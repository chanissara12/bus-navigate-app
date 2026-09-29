using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
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
        var shapeIdByDirectionKey = RouteShapeParser.GetMostCommonShapeIdByDirection(trips);

        var directionByExternalKey = await _dbContext.Directions
            .ToDictionaryAsync(direction => direction.ExternalDirectionKey, cancellationToken);

        var selectedShapeIds = shapeIdByDirectionKey.Values
            .Where(shapeId => !string.IsNullOrWhiteSpace(shapeId))
            .Select(shapeId => shapeId!)
            .ToHashSet(StringComparer.Ordinal);

        var pointsByShape = RouteShapeParser.Parse(feed.Shapes, selectedShapeIds);

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
        foreach (var directionPair in shapeIdByDirectionKey)
        {
            if (!directionByExternalKey.TryGetValue(directionPair.Key, out var direction) ||
                directionPair.Value is not { } shapeId ||
                !pointsByShape.TryGetValue(shapeId, out var shapePoints))
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
}
