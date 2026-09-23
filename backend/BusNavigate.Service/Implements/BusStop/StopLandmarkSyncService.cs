using BusNavigate.Domain.Constants;
using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Helpers;
using BusNavigate.Domain.Interfaces.BusStop;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BusNavigate.Service.Implements.BusStop;

public class StopLandmarkSyncService : IStopLandmarkSyncService
{
    private readonly BusNavigateDbContext _dbContext;
    private readonly IStopLandmarkFetcher _fetcher;
    private readonly ILogger<StopLandmarkSyncService> _logger;

    public StopLandmarkSyncService(
        BusNavigateDbContext dbContext, IStopLandmarkFetcher fetcher, ILogger<StopLandmarkSyncService> logger)
    {
        _dbContext = dbContext;
        _fetcher = fetcher;
        _logger = logger;
    }

    public async Task SyncAsync(CancellationToken cancellationToken = default)
    {
        var stops = await _dbContext.BusStops.ToListAsync(cancellationToken);
        if (stops.Count == 0)
        {
            _logger.LogInformation("No BusStops exist yet — skipping stop landmark sync");
            return;
        }

        var json = await _fetcher.FetchLandmarksAsync(cancellationToken);
        var landmarks = OverpassLandmarkParser.Parse(json);

        var existing = await _dbContext.StopLandmarks.ToDictionaryAsync(l => l.ExternalOsmId, cancellationToken);
        var now = DateTime.UtcNow;
        var associatedCount = 0;

        foreach (var landmark in landmarks)
        {
            // Assign to the single nearest BusStop only — the schema has a direct
            // BusStopId FK (not a many-to-many), matching T08's 1:1 association.
            var nearest = stops
                .Select(stop => (
                    Stop: stop,
                    DistanceMeters: GeoDistanceHelper.HaversineDistanceMeters(
                        stop.Latitude, stop.Longitude, landmark.Latitude, landmark.Longitude)))
                .OrderBy(x => x.DistanceMeters)
                .First();

            if (nearest.DistanceMeters > StopLandmarkConstants.MaxAssociationDistanceMeters)
            {
                continue;
            }

            if (!existing.TryGetValue(landmark.ExternalOsmId, out var entity))
            {
                entity = new StopLandmark { ExternalOsmId = landmark.ExternalOsmId };
                _dbContext.StopLandmarks.Add(entity);
                existing[landmark.ExternalOsmId] = entity;
            }

            entity.BusStopId = nearest.Stop.Id;
            entity.LandmarkType = landmark.LandmarkType;
            entity.NameTh = landmark.NameTh;
            entity.NameEn = landmark.NameEn;
            entity.Description = landmark.Description;
            entity.DistanceMeters = (int)Math.Round(nearest.DistanceMeters);
            entity.UpdatedAt = now;

            associatedCount++;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Stop landmark sync complete: {AssociatedCount} of {TotalCount} landmarks associated with a stop",
            associatedCount, landmarks.Count);
    }
}
