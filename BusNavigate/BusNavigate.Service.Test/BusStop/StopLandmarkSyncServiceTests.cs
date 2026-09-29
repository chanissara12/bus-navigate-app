using BusNavigate.Domain.Database;
using BusNavigate.Domain.Interfaces.BusStop;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;

namespace BusNavigate.Service.Test.BusStop;

public class StopLandmarkSyncServiceTests
{
    private const decimal StopLat = 13.7456m;
    private const decimal StopLon = 100.5342m;

    private static (BusNavigateDbContext DbContext, Mock<IStopLandmarkFetcher> Fetcher) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);
        var fetcher = new Mock<IStopLandmarkFetcher>();

        return (dbContext, fetcher);
    }

    private static Service.Implements.BusStop.StopLandmarkSyncService CreateService(
        BusNavigateDbContext dbContext, Mock<IStopLandmarkFetcher> fetcher) =>
        new(dbContext, fetcher.Object, NullLogger<Service.Implements.BusStop.StopLandmarkSyncService>.Instance);

    private static string BuildCrossingLandmarkJson(decimal lat, decimal lon) =>
        $$$"""{"elements":[{"type":"node","id":1,"lat":{{{lat}}},"lon":{{{lon}}},"tags":{"highway":"crossing"}}]}""";

    private static async Task<int> SeedStopAsync(BusNavigateDbContext dbContext, decimal lat, decimal lon)
    {
        var stop = new BusStopEntity
        {
            ExternalStopId = $"{Guid.NewGuid()}",
            NameTh = "s",
            NameEn = "s",
            Latitude = lat,
            Longitude = lon,
        };
        dbContext.BusStops.Add(stop);
        await dbContext.SaveChangesAsync();
        return stop.Id;
    }

    [Fact]
    public async Task SyncAsync_LandmarkWithinRadiusOfAStop_IsAssociatedAndSaved()
    {
        // Arrange — a landmark ~50m from the seeded stop, well within the 300m radius.
        var (dbContext, fetcher) = CreateSubject();
        var stopId = await SeedStopAsync(dbContext, StopLat, StopLon);
        fetcher.Setup(f => f.FetchLandmarksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCrossingLandmarkJson(StopLat + 0.00045m, StopLon));
        var service = CreateService(dbContext, fetcher);

        // Act
        await service.SyncAsync();

        // Assert
        var landmark = Assert.Single(dbContext.StopLandmarks);
        Assert.Equal(stopId, landmark.BusStopId);
        Assert.True(landmark.DistanceMeters < 300);
    }

    [Fact]
    public async Task SyncAsync_LandmarkFarFromEveryStop_IsNotSaved()
    {
        // Arrange — a landmark ~2000m from the only seeded stop.
        var (dbContext, fetcher) = CreateSubject();
        await SeedStopAsync(dbContext, StopLat, StopLon);
        fetcher.Setup(f => f.FetchLandmarksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCrossingLandmarkJson(StopLat + 0.018m, StopLon));
        var service = CreateService(dbContext, fetcher);

        // Act
        await service.SyncAsync();

        // Assert
        Assert.Empty(dbContext.StopLandmarks);
    }

    [Fact]
    public async Task SyncAsync_RunTwice_UpsertsWithoutDuplicating()
    {
        // Arrange
        var (dbContext, fetcher) = CreateSubject();
        await SeedStopAsync(dbContext, StopLat, StopLon);
        fetcher.Setup(f => f.FetchLandmarksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildCrossingLandmarkJson(StopLat, StopLon));
        var service = CreateService(dbContext, fetcher);
        await service.SyncAsync();
        var idAfterFirstSync = dbContext.StopLandmarks.Single().Id;

        // Act
        await service.SyncAsync();

        // Assert
        Assert.Single(dbContext.StopLandmarks);
        Assert.Equal(idAfterFirstSync, dbContext.StopLandmarks.Single().Id);
    }

    [Fact]
    public async Task SyncAsync_NoBusStopsExist_DoesNotCallFetcher()
    {
        // Arrange
        var (dbContext, fetcher) = CreateSubject();
        var service = CreateService(dbContext, fetcher);

        // Act
        await service.SyncAsync();

        // Assert
        fetcher.Verify(f => f.FetchLandmarksAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
