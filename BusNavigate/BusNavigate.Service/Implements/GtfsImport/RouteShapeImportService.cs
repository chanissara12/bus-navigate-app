using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Helpers;
using BusNavigate.Domain.Interfaces.GtfsImport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BusNavigate.Service.Implements.GtfsImport;

public class RouteShapeImportService : IRouteShapeImportService
{
    private const string ImportStateId = "namtang";

    private readonly BusNavigateDbContext _dbContext;
    private readonly IGtfsFeedFetcher _feedFetcher;
    private readonly ILogger<RouteShapeImportService> _logger;

    public RouteShapeImportService(
        BusNavigateDbContext dbContext,
        IGtfsFeedFetcher feedFetcher,
        ILogger<RouteShapeImportService> logger)
    {
        _dbContext = dbContext;
        _feedFetcher = feedFetcher;
        _logger = logger;
    }

    public async Task ImportAsync(CancellationToken cancellationToken = default)
    {
        var feedVersion = await _feedFetcher.GetLatestVersionAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(feedVersion))
        {
            _logger.LogWarning("GTFS feed version is unavailable; skipping route-shape import.");
            return;
        }

        var existingState = await _dbContext.RouteShapeImportStates
            .SingleOrDefaultAsync(state => state.Id == ImportStateId, cancellationToken);

        var directionCount = await _dbContext.Directions.CountAsync(cancellationToken);
        var importedDirectionCount = await _dbContext.RouteShapePoints
            .Select(point => point.DirectionId)
            .Distinct()
            .CountAsync(cancellationToken);

        if (existingState?.FeedVersion == feedVersion &&
            directionCount > 0 &&
            importedDirectionCount >= directionCount)
        {
            _logger.LogInformation("GTFS route shapes are already current at feed version {FeedVersion}.", feedVersion);
            return;
        }

        var feed = await _feedFetcher.FetchLatestShapeFeedAsync(cancellationToken);
        var trips = GtfsParser.ParseTrips(feed.Trips);
        var shapeIdCandidatesByDirectionKey = RouteShapeParser.GetShapeIdCandidatesByDirection(trips);

        var directionByExternalKey = await _dbContext.Directions
            .ToDictionaryAsync(direction => direction.ExternalDirectionKey, cancellationToken);

        var selectedShapeIds = shapeIdCandidatesByDirectionKey.Values
            .SelectMany(shapeIds => shapeIds)
            .ToHashSet(StringComparer.Ordinal);

        var pointsByShape = RouteShapeParser.Parse(feed.Shapes, selectedShapeIds);

        // RouteStops (from the earlier main GTFS import, already run by the time this
        // service runs — see WeeklyDataSyncBackgroundService) are the union of every
        // trip variant's stops; used below to pick, among a direction's several shape
        // candidates, the one that actually passes near all of them.
        var stopCoordinatesByDirectionId = (await _dbContext.RouteStops
            .AsNoTracking()
            .Include(routeStop => routeStop.BusStop)
            .ToListAsync(cancellationToken))
            .GroupBy(routeStop => routeStop.DirectionId)
            .ToDictionary(
                group => group.Key,
                group => group.Select(routeStop => (routeStop.BusStop.Latitude, routeStop.BusStop.Longitude)).ToList());

        await using var transaction = _dbContext.Database.IsRelational()
            ? await _dbContext.Database.BeginTransactionAsync(cancellationToken)
            : null;

        if (_dbContext.Database.IsRelational())
        {
            await _dbContext.RouteShapePoints.ExecuteDeleteAsync(cancellationToken);
        }
        else
        {
            var existingPoints = await _dbContext.RouteShapePoints.ToListAsync(cancellationToken);
            _dbContext.RouteShapePoints.RemoveRange(existingPoints);
        }

        var points = new List<RouteShapePoint>();
        foreach (var directionPair in shapeIdCandidatesByDirectionKey)
        {
            if (!directionByExternalKey.TryGetValue(directionPair.Key, out var direction))
            {
                continue;
            }

            stopCoordinatesByDirectionId.TryGetValue(direction.Id, out var stops);
            var shapeId = ChooseBestShapeId(directionPair.Value, pointsByShape, stops);

            if (shapeId is null || !pointsByShape.TryGetValue(shapeId, out var shapePoints))
            {
                continue;
            }

            for (var i = 0; i < shapePoints.Count; i++)
            {
                points.Add(new RouteShapePoint
                {
                    DirectionId = direction.Id,
                    Sequence = i + 1,
                    Latitude = shapePoints[i].Latitude,
                    Longitude = shapePoints[i].Longitude
                });
            }
        }

        await _dbContext.RouteShapePoints.AddRangeAsync(points, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (existingState is null)
        {
            existingState = new RouteShapeImportState { Id = ImportStateId };
            _dbContext.RouteShapeImportStates.Add(existingState);
        }

        existingState.FeedVersion = feedVersion;
        existingState.ImportedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (transaction is not null)
        {
            await transaction.CommitAsync(cancellationToken);
        }

        _logger.LogInformation(
            "GTFS route-shape import complete: {DirectionCount} directions, {PointCount} points.",
            directionByExternalKey.Count,
            points.Count);
    }

    // Picks the most-common-trip-pattern shape by default; only bothers comparing
    // candidates against real stop coordinates when there's more than one shape and
    // actual RouteStop data to check coverage against.
    private static string? ChooseBestShapeId(
        IReadOnlyList<string> candidateShapeIds,
        IReadOnlyDictionary<string, List<(decimal Latitude, decimal Longitude)>> pointsByShape,
        List<(decimal Latitude, decimal Longitude)>? stops)
    {
        if (candidateShapeIds.Count == 0)
        {
            return null;
        }

        if (candidateShapeIds.Count == 1 || stops is null || stops.Count == 0)
        {
            return candidateShapeIds[0];
        }

        return candidateShapeIds
            .Where(shapeId => pointsByShape.ContainsKey(shapeId))
            .OrderBy(shapeId => WorstStopCoverageMeters(pointsByShape[shapeId], stops))
            .FirstOrDefault()
            ?? candidateShapeIds[0];
    }

    // The largest "nearest shape point" distance across all of a direction's stops —
    // i.e. how far the single worst-served stop ends up from this candidate shape.
    // Lower is better: it means every stop the direction actually serves sits close to
    // this shape's geometry, not just most of them.
    private static double WorstStopCoverageMeters(
        List<(decimal Latitude, decimal Longitude)> shapePoints,
        List<(decimal Latitude, decimal Longitude)> stops)
    {
        var worstMeters = 0d;

        foreach (var stop in stops)
        {
            var nearestMeters = double.MaxValue;
            foreach (var point in shapePoints)
            {
                var distance = GeoDistanceHelper.HaversineDistanceMeters(
                    stop.Latitude, stop.Longitude, point.Latitude, point.Longitude);
                if (distance < nearestMeters)
                {
                    nearestMeters = distance;
                }
            }

            if (nearestMeters > worstMeters)
            {
                worstMeters = nearestMeters;
            }
        }

        return worstMeters;
    }
}
