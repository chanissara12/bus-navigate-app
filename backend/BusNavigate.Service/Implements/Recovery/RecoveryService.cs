using BusNavigate.Domain.Constants;
using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Helpers;
using BusNavigate.Domain.Interfaces.Recovery;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.ViewModels.Recovery;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.Recovery;

public class RecoveryService(
    BusNavigateDbContext dbContext,
    ITravelOptionEvaluationService travelOptionEvaluationService
) : IRecoveryService
{
    // Roughly constant everywhere on Earth — used only to size a coarse bounding-box
    // pre-filter (translatable to SQL) before the exact haversine check in memory.
    // There's no PostGIS/spatial index in Phase 1's schema, so this keeps the "nearby
    // stops" query from doing a full-table haversine scan.
    private const double MetersPerDegreeLatitude = 111_320;

    public async Task<RecoveryOptionsResult> GenerateRecoveryOptionsAsync(
        int travelSessionId, int? currentDirectionId, decimal currentLatitude, decimal currentLongitude,
        CancellationToken cancellationToken = default)
    {
        var sessionExists = await dbContext.TravelSessions
            .AnyAsync(s => s.Id == travelSessionId, cancellationToken);
        if (!sessionExists)
        {
            throw new ValidateException($"Travel session {travelSessionId} was not found.");
        }

        var candidateDirections = await FindCandidateDirectionsAsync(
            currentDirectionId, currentLatitude, currentLongitude, cancellationToken);

        var recommended = new List<RecoveryOption>();
        var lastResort = new List<RecoveryOption>();

        foreach (var (direction, distanceMeters) in candidateDirections)
        {
            var evaluation = await travelOptionEvaluationService.EvaluateAsync(
                travelSessionId, direction.Id, cancellationToken);

            // DataConfidence.Scheduled: fully computed from GTFS schedule data, no live
            // vehicle tracking exists in Phase 1 (see CONTEXT.md's Vehicle/RealtimeVehicle
            // out-of-scope note) — distinct from the Unknown rail pointers below.
            var option = new RecoveryOption(
                RecoveryOptionKind.BusDirection, FormatLabel(direction), distanceMeters,
                DataConfidence.Scheduled, evaluation.Reasons);

            (evaluation.Accepted ? recommended : lastResort).Add(option);
        }

        // Rank last-resort candidates by "how close it got" — the rejection reason's
        // value (walk distance, or transfer-count overage) when available. Candidates
        // rejected for a reason with no attached value sort last.
        lastResort = [.. lastResort.OrderBy(o => o.Reasons.Count > 0 ? o.Reasons[0].Value ?? decimal.MaxValue : decimal.MaxValue)];

        var railPointers = await FindNearbyRailPointersAsync(currentLatitude, currentLongitude, cancellationToken);

        return new RecoveryOptionsResult(recommended, lastResort, railPointers);
    }

    // "Continue on current bus" is CONTEXT.md's CurrentRoute (currentDirectionId) —
    // not special-cased, just one more candidate with zero walk distance (T06). Every
    // other candidate is a Direction reachable from a BusStop within the walk budget
    // of CurrentLocation.
    private async Task<List<(Direction Direction, double DistanceMeters)>> FindCandidateDirectionsAsync(
        int? currentDirectionId, decimal currentLatitude, decimal currentLongitude, CancellationToken cancellationToken)
    {
        var stopsWithinRadius = await FindStopsWithinRadiusAsync(currentLatitude, currentLongitude, cancellationToken);
        var distanceByStopId = stopsWithinRadius.ToDictionary(x => x.Stop.Id, x => x.DistanceMeters);

        var nearbyStopIds = distanceByStopId.Keys.ToHashSet();
        var routeStops = await dbContext.RouteStops
            .Where(rs => nearbyStopIds.Contains(rs.BusStopId))
            .Include(rs => rs.Direction).ThenInclude(d => d.BusRoute)
            .ToListAsync(cancellationToken);

        var candidates = new Dictionary<int, (Direction Direction, double DistanceMeters)>();

        if (currentDirectionId is int directionId)
        {
            var currentDirection = await dbContext.Directions
                .Include(d => d.BusRoute)
                .FirstOrDefaultAsync(d => d.Id == directionId, cancellationToken)
                ?? throw new ValidateException($"Direction {directionId} was not found.");

            candidates[directionId] = (currentDirection, 0);
        }

        foreach (var routeStop in routeStops)
        {
            var distance = distanceByStopId[routeStop.BusStopId];
            if (!candidates.TryGetValue(routeStop.DirectionId, out var existing) || distance < existing.DistanceMeters)
            {
                candidates[routeStop.DirectionId] = (routeStop.Direction, distance);
            }
        }

        return [.. candidates.Values];
    }

    private async Task<List<RecoveryOption>> FindNearbyRailPointersAsync(
        decimal currentLatitude, decimal currentLongitude, CancellationToken cancellationToken)
    {
        var (minLat, maxLat, minLon, maxLon) = ComputeBoundingBox(
            currentLatitude, currentLongitude, TravelOptionEvaluationConstants.WalkBudgetMeters);

        var nearbyPlaces = await dbContext.Places
            .Where(p => p.Latitude >= minLat && p.Latitude <= maxLat && p.Longitude >= minLon && p.Longitude <= maxLon)
            .ToListAsync(cancellationToken);

        return nearbyPlaces
            .Select(place => (
                Place: place,
                DistanceMeters: GeoDistanceHelper.HaversineDistanceMeters(
                    place.Latitude, place.Longitude, currentLatitude, currentLongitude)))
            .Where(x => x.DistanceMeters <= TravelOptionEvaluationConstants.WalkBudgetMeters)
            .Select(x => new RecoveryOption(
                RecoveryOptionKind.UnconfirmedRailPointer, x.Place.Name, x.DistanceMeters,
                DataConfidence.Unknown, Reasons: []))
            .ToList();
    }

    private async Task<List<(BusStop Stop, double DistanceMeters)>> FindStopsWithinRadiusAsync(
        decimal currentLatitude, decimal currentLongitude, CancellationToken cancellationToken)
    {
        var (minLat, maxLat, minLon, maxLon) = ComputeBoundingBox(
            currentLatitude, currentLongitude, TravelOptionEvaluationConstants.WalkBudgetMeters);

        var stopsInBoundingBox = await dbContext.BusStops
            .Where(s => s.Latitude >= minLat && s.Latitude <= maxLat && s.Longitude >= minLon && s.Longitude <= maxLon)
            .ToListAsync(cancellationToken);

        return stopsInBoundingBox
            .Select(stop => (
                Stop: stop,
                DistanceMeters: GeoDistanceHelper.HaversineDistanceMeters(
                    stop.Latitude, stop.Longitude, currentLatitude, currentLongitude)))
            .Where(x => x.DistanceMeters <= TravelOptionEvaluationConstants.WalkBudgetMeters)
            .ToList();
    }

    private static (decimal MinLat, decimal MaxLat, decimal MinLon, decimal MaxLon) ComputeBoundingBox(
        decimal latitude, decimal longitude, double radiusMeters)
    {
        var latDelta = (decimal)(radiusMeters / MetersPerDegreeLatitude);
        var metersPerDegreeLongitude = MetersPerDegreeLatitude * Math.Cos((double)latitude * Math.PI / 180.0);
        var lonDelta = (decimal)(radiusMeters / Math.Max(metersPerDegreeLongitude, 1));

        return (latitude - latDelta, latitude + latDelta, longitude - lonDelta, longitude + lonDelta);
    }

    private static string FormatLabel(Direction direction) => $"{direction.BusRoute.ShortName} → {direction.Headsign}";
}
