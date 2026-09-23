using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;

namespace BusNavigate.Service.Test.BusStop;

public class BusStopContextServiceTests
{
    private static (BusNavigateDbContext DbContext, Service.Implements.BusStop.BusStopContextService Service) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.BusStop.BusStopContextService(dbContext));
    }

    [Fact]
    public async Task GetContextAsync_StopWithNoLandmarks_ReturnsEmptyListNotError()
    {
        // Arrange — T08's graceful-degradation rule.
        var (dbContext, service) = CreateSubject();
        var stop = new BusStopEntity
        {
            ExternalStopId = "S1",
            NameTh = "สยาม",
            NameEn = "Siam",
            Latitude = 13.75m,
            Longitude = 100.53m,
        };
        dbContext.BusStops.Add(stop);
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetContextAsync(stop.Id);

        // Assert
        Assert.Empty(result.Landmarks);
        Assert.Equal("Siam", result.NameEn);
    }

    [Fact]
    public async Task GetContextAsync_StopWithLandmarks_ReturnsThemOrderedByDistance()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var stop = new BusStopEntity
        {
            ExternalStopId = "S1",
            NameTh = "s",
            NameEn = "s",
            Latitude = 13.75m,
            Longitude = 100.53m,
        };
        dbContext.BusStops.Add(stop);
        await dbContext.SaveChangesAsync();

        dbContext.StopLandmarks.AddRange(
            new StopLandmark
            {
                BusStopId = stop.Id,
                ExternalOsmId = "node/2",
                LandmarkType = LandmarkType.Landmark,
                NameTh = "far",
                NameEn = "far",
                DistanceMeters = 200,
                UpdatedAt = DateTime.UtcNow,
            },
            new StopLandmark
            {
                BusStopId = stop.Id,
                ExternalOsmId = "node/1",
                LandmarkType = LandmarkType.Crossing,
                NameTh = "near",
                NameEn = "near",
                DistanceMeters = 20,
                UpdatedAt = DateTime.UtcNow,
            });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetContextAsync(stop.Id);

        // Assert
        Assert.Equal(2, result.Landmarks.Count);
        Assert.Equal("near", result.Landmarks[0].NameEn);
        Assert.Equal("far", result.Landmarks[1].NameEn);
    }

    [Fact]
    public async Task GetContextAsync_UnknownBusStop_ThrowsValidateException()
    {
        // Arrange
        var (_, service) = CreateSubject();

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(() => service.GetContextAsync(999));
    }
}
