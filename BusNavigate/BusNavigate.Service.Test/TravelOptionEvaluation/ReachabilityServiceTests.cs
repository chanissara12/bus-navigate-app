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

    [Fact]
    public async Task FindNearestRouteStopAsync_StopSharedByTwoDirections_UsesEachDirectionsOwnShapeToDistinguishThem()
    {
        // Arrange — reproduces a real BRT station: one BusStop coordinate shared by two
        // opposite directions, each running along a different side of the road. The
        // target sits right next to direction A's shape but far from direction B's.
        var (dbContext, service) = CreateSubject();
        const decimal sharedStopLat = 13.6903m;
        const decimal sharedStopLon = 100.5042m;
        const decimal targetLat = 13.6903m;
        const decimal targetLon = 100.5052m;

        var directionAId = await SeedDirectionWithStopsAsync(dbContext, (sharedStopLat, sharedStopLon));
        dbContext.RouteShapePoints.Add(
            new RouteShapePoint { DirectionId = directionAId, Sequence = 1, Latitude = sharedStopLat, Longitude = 100.5052m });

        var directionBId = await SeedDirectionWithStopsAsync(dbContext, (sharedStopLat, sharedStopLon));
        dbContext.RouteShapePoints.Add(
            new RouteShapePoint { DirectionId = directionBId, Sequence = 1, Latitude = sharedStopLat, Longitude = 100.4942m });

        await dbContext.SaveChangesAsync();

        // Act
        var resultA = await service.FindNearestRouteStopAsync(directionAId, targetLat, targetLon);
        var resultB = await service.FindNearestRouteStopAsync(directionBId, targetLat, targetLon);

        // Assert — direction A's platform (snapped near the target) reports much closer
        // than direction B's (snapped on the far side), even though both directions
        // share the exact same raw BusStop coordinate.
        Assert.NotNull(resultA);
        Assert.NotNull(resultB);
        Assert.True(resultA!.DistanceMeters < 50);
        Assert.True(resultB!.DistanceMeters > 1000);
    }

    [Fact]
    public async Task FindNearestRouteStopAsync_DirectionWithNoShapePoints_FallsBackToTheStopsOwnCoordinate()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        const decimal targetLat = 13.75m;
        const decimal targetLon = 100.53m;
        var directionId = await SeedDirectionWithStopsAsync(dbContext, (targetLat + 0.0005m, targetLon));

        // Act
        var result = await service.FindNearestRouteStopAsync(directionId, targetLat, targetLon);

        // Assert
        Assert.NotNull(result);
        Assert.True(result!.DistanceMeters < 100);
    }
}
