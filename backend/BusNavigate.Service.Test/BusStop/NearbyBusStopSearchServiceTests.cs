using BusNavigate.Domain.Database;
using Microsoft.EntityFrameworkCore;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;

namespace BusNavigate.Service.Test.BusStop;

public class NearbyBusStopSearchServiceTests
{
    private const decimal CenterLat = 13.7456m;
    private const decimal CenterLon = 100.5342m;

    private static (BusNavigateDbContext DbContext, Service.Implements.BusStop.NearbyBusStopSearchService Service) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.BusStop.NearbyBusStopSearchService(dbContext));
    }

    [Fact]
    public async Task FindNearbyAsync_StopsWithinRadius_AreReturnedOrderedByDistance()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        dbContext.BusStops.AddRange(
            new BusStopEntity { ExternalStopId = "far", NameTh = "far", NameEn = "far", Latitude = CenterLat + 0.004m, Longitude = CenterLon },
            new BusStopEntity { ExternalStopId = "near", NameTh = "near", NameEn = "near", Latitude = CenterLat + 0.0009m, Longitude = CenterLon });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.FindNearbyAsync(CenterLat, CenterLon, 800);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("near", result[0].NameEn);
        Assert.Equal("far", result[1].NameEn);
    }

    [Fact]
    public async Task FindNearbyAsync_StopOutsideRadius_IsExcluded()
    {
        // Arrange — ~2000m away, outside an 800m radius.
        var (dbContext, service) = CreateSubject();
        dbContext.BusStops.Add(
            new BusStopEntity { ExternalStopId = "far", NameTh = "far", NameEn = "far", Latitude = CenterLat + 0.018m, Longitude = CenterLon });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.FindNearbyAsync(CenterLat, CenterLon, 800);

        // Assert
        Assert.Empty(result);
    }
}
