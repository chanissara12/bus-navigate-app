using BusNavigate.Domain.Constants;
using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Helpers;
using BusNavigate.Domain.Interfaces.ServiceStatus;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.Interfaces.TripPlanning;
using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;
using BusNavigate.Domain.ViewModels.TripPlanning;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.TripPlanning;

public class TravelOptionSearchService : ITravelOptionSearchService
{
    // Same bounding-box pre-filter technique as RecoveryService — no PostGIS/spatial
    // index in Phase 1's schema.
    private const double MetersPerDegreeLatitude = 111_320;

    private readonly BusNavigateDbContext _dbContext;
    private readonly IReachabilityService _reachabilityService;
    private readonly IServiceStatusService _serviceStatusService;

    public TravelOptionSearchService(
        BusNavigateDbContext dbContext, IReachabilityService reachabilityService, IServiceStatusService serviceStatusService)
    {
        _dbContext = dbContext;
        _reachabilityService = reachabilityService;
        _serviceStatusService = serviceStatusService;
    }

    public async Task<IReadOnlyList<TravelOption>> SearchAsync(
        decimal currentLatitude, decimal currentLongitude, int destinationPlaceId, PlaceKind destinationType,
        CancellationToken cancellationToken = default)
    {
        var (destinationLatitude, destinationLongitude) = await ResolveDestinationAsync(
            destinationPlaceId, destinationType, cancellationToken);

        var boardingCandidates = await FindBoardingCandidatesAsync(currentLatitude, currentLongitude, cancellationToken);

        var options = new List<TravelOption>();

        foreach (var (direction, boardingRouteStop, boardingDistanceMeters) in boardingCandidates)
        {
            var alightingRouteStop = await _reachabilityService.FindNearestRouteStopAsync(
                direction.Id, destinationLatitude, destinationLongitude, cancellationToken);

            if (alightingRouteStop is null)
            {
                continue;
            }

            var alightingWalkDistanceMeters =
                alightingRouteStop.DistanceMeters * TravelOptionEvaluationConstants.WalkingDetourFactor;

            if (alightingWalkDistanceMeters > TravelOptionEvaluationConstants.WalkBudgetMeters)
            {
                continue;
            }

            // Order check — new for T11 (T05/T06 never needed it; they always check a
            // single already-directionally-consistent pair). A Direction serving both
            // points but with the destination BEFORE the boarding point along that
            // Direction is not a valid option: it would send the rider the wrong way.
            if (alightingRouteStop.SequenceNumber <= boardingRouteStop.SequenceNumber)
            {
                continue;
            }

            var boardingStop = await _dbContext.BusStops
                .FirstAsync(s => s.Id == boardingRouteStop.BusStopId, cancellationToken);
            var alightingStop = await _dbContext.BusStops
                .FirstAsync(s => s.Id == alightingRouteStop.BusStopId, cancellationToken);

            var serviceStatus = await _serviceStatusService.GetStatusAsync(
                direction.BusRouteId, direction.Id, cancellationToken);

            var boardingWalkDistanceMeters = boardingDistanceMeters * TravelOptionEvaluationConstants.WalkingDetourFactor;

            options.Add(new TravelOption(
                direction.Id,
                direction.BusRoute.ShortName,
                direction.Headsign,
                boardingStop.Id, boardingStop.NameTh, boardingStop.NameEn,
                alightingStop.Id, alightingStop.NameTh, alightingStop.NameEn,
                boardingWalkDistanceMeters + alightingWalkDistanceMeters,
                DataConfidence.Scheduled,
                serviceStatus,
                [
                    new EvaluationReason(ReasonCode.ReachesDestination),
                    new EvaluationReason(ReasonCode.WithinWalkBudget, (decimal)alightingWalkDistanceMeters),
                ]));
        }

        return options;
    }

    private async Task<(decimal Latitude, decimal Longitude)> ResolveDestinationAsync(
        int destinationPlaceId, PlaceKind destinationType, CancellationToken cancellationToken)
    {
        if (destinationType == PlaceKind.BusStop)
        {
            var stop = await _dbContext.BusStops.FirstOrDefaultAsync(s => s.Id == destinationPlaceId, cancellationToken)
                ?? throw new ValidateException($"BusStop {destinationPlaceId} was not found.");
            return (stop.Latitude, stop.Longitude);
        }

        var place = await _dbContext.Places.FirstOrDefaultAsync(p => p.Id == destinationPlaceId, cancellationToken)
            ?? throw new ValidateException($"Place {destinationPlaceId} was not found.");
        return (place.Latitude, place.Longitude);
    }

    // Every Direction reachable, on foot within the walk budget, from currentLocation —
    // paired with the specific nearest RouteStop used to discover it (that RouteStop's
    // SequenceNumber feeds the order check above).
    private async Task<List<(Direction Direction, NearestRouteStopResult RouteStop, double DistanceMeters)>>
        FindBoardingCandidatesAsync(decimal currentLatitude, decimal currentLongitude, CancellationToken cancellationToken)
    {
        var (minLat, maxLat, minLon, maxLon) = ComputeBoundingBox(
            currentLatitude, currentLongitude, TravelOptionEvaluationConstants.WalkBudgetMeters);

        var stopsInBoundingBox = await _dbContext.BusStops
            .Where(s => s.Latitude >= minLat && s.Latitude <= maxLat && s.Longitude >= minLon && s.Longitude <= maxLon)
            .ToListAsync(cancellationToken);

        var stopsWithinRadius = stopsInBoundingBox
            .Select(stop => (
                Stop: stop,
                DistanceMeters: GeoDistanceHelper.HaversineDistanceMeters(
                    stop.Latitude, stop.Longitude, currentLatitude, currentLongitude)))
            .Where(x => x.DistanceMeters <= TravelOptionEvaluationConstants.WalkBudgetMeters)
            .ToList();

        var nearbyStopIds = stopsWithinRadius.Select(x => x.Stop.Id).ToHashSet();
        var distanceByStopId = stopsWithinRadius.ToDictionary(x => x.Stop.Id, x => x.DistanceMeters);

        var routeStops = await _dbContext.RouteStops
            .Where(rs => nearbyStopIds.Contains(rs.BusStopId))
            .Include(rs => rs.Direction).ThenInclude(d => d.BusRoute)
            .ToListAsync(cancellationToken);

        var candidates = new Dictionary<int, (Direction Direction, NearestRouteStopResult RouteStop, double DistanceMeters)>();

        foreach (var routeStop in routeStops)
        {
            var distance = distanceByStopId[routeStop.BusStopId];
            if (!candidates.TryGetValue(routeStop.DirectionId, out var existing) || distance < existing.DistanceMeters)
            {
                candidates[routeStop.DirectionId] = (
                    routeStop.Direction,
                    new NearestRouteStopResult(routeStop.Id, routeStop.BusStopId, routeStop.SequenceNumber, distance),
                    distance);
            }
        }

        return [.. candidates.Values];
    }

    private static (decimal MinLat, decimal MaxLat, decimal MinLon, decimal MaxLon) ComputeBoundingBox(
        decimal latitude, decimal longitude, double radiusMeters)
    {
        var latDelta = (decimal)(radiusMeters / MetersPerDegreeLatitude);
        var metersPerDegreeLongitude = MetersPerDegreeLatitude * Math.Cos((double)latitude * Math.PI / 180.0);
        var lonDelta = (decimal)(radiusMeters / Math.Max(metersPerDegreeLongitude, 1));

        return (latitude - latDelta, latitude + latDelta, longitude - lonDelta, longitude + lonDelta);
    }
}
