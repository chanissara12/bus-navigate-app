using BusNavigate.Domain.Database;
using BusNavigate.Domain.Helpers;
using BusNavigate.Domain.Interfaces.BusStop;
using BusNavigate.Domain.ViewModels.BusStop;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.BusStop;

public class NearbyBusStopSearchService : INearbyBusStopSearchService
{
    // Same bounding-box pre-filter technique as RecoveryService/TravelOptionSearchService.
    private const double MetersPerDegreeLatitude = 111_320;

    private readonly BusNavigateDbContext _dbContext;

    public NearbyBusStopSearchService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<BusStopSummary>> FindNearbyAsync(
        decimal latitude, decimal longitude, double radiusMeters, CancellationToken cancellationToken = default)
    {
        var (minLat, maxLat, minLon, maxLon) = ComputeBoundingBox(latitude, longitude, radiusMeters);

        var stopsInBoundingBox = await _dbContext.BusStops
            .Where(s => s.Latitude >= minLat && s.Latitude <= maxLat && s.Longitude >= minLon && s.Longitude <= maxLon)
            .ToListAsync(cancellationToken);

        return [.. stopsInBoundingBox
            .Select(stop => new BusStopSummary(
                stop.Id, stop.NameTh, stop.NameEn, stop.StopCode, stop.Latitude, stop.Longitude,
                GeoDistanceHelper.HaversineDistanceMeters(stop.Latitude, stop.Longitude, latitude, longitude)))
            .Where(summary => summary.DistanceMeters <= radiusMeters)
            .OrderBy(summary => summary.DistanceMeters)];
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
