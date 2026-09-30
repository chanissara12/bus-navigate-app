using BusNavigate.Domain.Database;
using BusNavigate.Domain.Helpers;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.TravelOptionEvaluation;

public class ReachabilityService : IReachabilityService
{
    private readonly BusNavigateDbContext _dbContext;

    public ReachabilityService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<NearestRouteStopResult?> FindNearestRouteStopAsync(
        int directionId, decimal targetLatitude, decimal targetLongitude, CancellationToken cancellationToken = default)
    {
        var routeStops = await _dbContext.RouteStops
            .Where(rs => rs.DirectionId == directionId)
            .Include(rs => rs.BusStop)
            .ToListAsync(cancellationToken);

        if (routeStops.Count == 0)
        {
            return null;
        }

        // A stop shared by multiple directions (e.g. a BRT station with separate
        // platforms per direction, but only one coordinate in the source GTFS data)
        // needs its per-direction platform location approximated — snapping onto this
        // direction's own route shape, since each direction's shape runs along a
        // different side of the road at a shared-name station.
        var shapePoints = (await _dbContext.RouteShapePoints
            .Where(p => p.DirectionId == directionId)
            .Select(p => new { p.Latitude, p.Longitude })
            .ToListAsync(cancellationToken))
            .Select(p => (p.Latitude, p.Longitude))
            .ToList();

        var nearest = routeStops
            .Select(routeStop =>
            {
                var (effectiveLatitude, effectiveLongitude) = SnapToShape(
                    routeStop.BusStop.Latitude, routeStop.BusStop.Longitude, shapePoints);

                return new NearestRouteStopResult(
                    routeStop.Id,
                    routeStop.BusStopId,
                    routeStop.SequenceNumber,
                    GeoDistanceHelper.HaversineDistanceMeters(
                        effectiveLatitude, effectiveLongitude, targetLatitude, targetLongitude));
            })
            .OrderBy(result => result.DistanceMeters)
            .First();

        return nearest;
    }

    // Falls back to the stop's own coordinate when the direction has no shape points.
    private static (decimal Latitude, decimal Longitude) SnapToShape(
        decimal stopLatitude, decimal stopLongitude, List<(decimal Latitude, decimal Longitude)> shapePoints)
    {
        if (shapePoints.Count == 0)
        {
            return (stopLatitude, stopLongitude);
        }

        var nearestDistanceMeters = double.MaxValue;
        var nearestPoint = (stopLatitude, stopLongitude);
        foreach (var point in shapePoints)
        {
            var distanceMeters = GeoDistanceHelper.HaversineDistanceMeters(
                stopLatitude, stopLongitude, point.Latitude, point.Longitude);
            if (distanceMeters < nearestDistanceMeters)
            {
                nearestDistanceMeters = distanceMeters;
                nearestPoint = point;
            }
        }

        return nearestPoint;
    }
}
