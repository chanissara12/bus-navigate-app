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

        var nearest = routeStops
            .Select(routeStop => new NearestRouteStopResult(
                routeStop.Id,
                routeStop.BusStopId,
                routeStop.SequenceNumber,
                GeoDistanceHelper.HaversineDistanceMeters(
                    routeStop.BusStop.Latitude, routeStop.BusStop.Longitude, targetLatitude, targetLongitude)))
            .OrderBy(result => result.DistanceMeters)
            .First();

        return nearest;
    }
}
