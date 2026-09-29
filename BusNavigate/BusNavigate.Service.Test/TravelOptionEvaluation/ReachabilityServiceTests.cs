using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;

namespace BusNavigate.Service.Test.TravelOptionEvaluation;

public class ReachabilityServiceTests
{
    private static (BusNavigateDbContext DbContext, Service.Implements.TravelOptionEvaluation.ReachabilityService Service)
        CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.TravelOptionEvaluation.ReachabilityService(dbContext));
    }

    private static async Task<int> SeedDirectionWithStopsAsync(
        BusNavigateDbContext dbContext, params (decimal Lat, decimal Lon)[] stopCoordinates)
    {
        var busRoute = new BusRoute
        {
            ExternalRouteId = $"{Guid.NewGuid()}",
            ShortName = "1",
            LongName = "Route",
            DataSource = "test",
            ImportedAt = DateTime.UtcNow,
        };
        var direction = new Direction { BusRoute = busRoute, ExternalDirectionKey = $"{Guid.NewGuid()}", DirectionIndex = 0, Headsign = "H" };
        dbContext.AddRange(busRoute, direction);
        await dbContext.SaveChangesAsync();

        for (var i = 0; i < stopCoordinates.Length; i++)
        {
            var (lat, lon) = stopCoordinates[i];
            var stop = new BusStopEntity
            {
                ExternalStopId = $"{direction.Id}-{i}",
                NameTh = "s",
                NameEn = "s",
                Latitude = lat,
                Longitude = lon,
            };
            dbContext.BusStops.Add(stop);
            await dbContext.SaveChangesAsync();

            dbContext.RouteStops.Add(new RouteStop { DirectionId = direction.Id, BusStopId = stop.Id, SequenceNumber = i + 1 });
        }

        await dbContext.SaveChangesAsync();
        return direction.Id;
    }

    [Fact]
    public async Task FindNearestRouteStopAsync_MultipleStops_ReturnsClosestOneWithItsSequenceNumber()
    {
        // Arrange — target point is closest to the 2nd stop.
        var (dbContext, service) = CreateSubject();
        const decimal targetLat = 13.75m;
        const decimal targetLon = 100.53m;
        var directionId = await SeedDirectionWithStopsAsync(
            dbContext,
            (targetLat + 0.05m, targetLon),   // far
            (targetLat + 0.0005m, targetLon), // closest
            (targetLat + 0.02m, targetLon));  // middling

        // Act
        var result = await service.FindNearestRouteStopAsync(directionId, targetLat, targetLon);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result!.SequenceNumber);
        Assert.True(result.DistanceMeters < 100);
    }

    [Fact]
    public async Task FindNearestRouteStopAsync_DirectionWithNoStops_ReturnsNull()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();

        // Act
        var result = await service.FindNearestRouteStopAsync(999, 13.75m, 100.53m);

        // Assert
        Assert.Null(result);
    }
}
