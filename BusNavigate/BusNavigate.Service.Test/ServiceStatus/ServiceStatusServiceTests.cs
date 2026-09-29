using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Test.ServiceStatus;

public class ServiceStatusServiceTests
{
    private static (BusNavigateDbContext DbContext, Service.Implements.ServiceStatus.ServiceStatusService Service) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.ServiceStatus.ServiceStatusService(dbContext));
    }

    private static async Task<(int RouteId, int DirectionId)> SeedRouteWithDailyServiceAsync(BusNavigateDbContext dbContext)
    {
        var busRoute = new BusRoute
        {
            ExternalRouteId = $"R-{Guid.NewGuid()}",
            ShortName = "1",
            LongName = "Route",
            DataSource = "test",
            ImportedAt = DateTime.UtcNow,
        };
        var direction = new Direction { BusRoute = busRoute, ExternalDirectionKey = $"{Guid.NewGuid()}", DirectionIndex = 0, Headsign = "H" };
        var calendar = new ServiceCalendar
        {
            ExternalServiceId = $"{Guid.NewGuid()}",
            Monday = true,
            Tuesday = true,
            Wednesday = true,
            Thursday = true,
            Friday = true,
            Saturday = true,
            Sunday = true,
            StartDate = new DateOnly(2000, 1, 1),
            EndDate = new DateOnly(2100, 1, 1),
        };
        dbContext.AddRange(busRoute, direction, calendar);
        await dbContext.SaveChangesAsync();

        var trip = new Trip { DirectionId = direction.Id, ServiceCalendarId = calendar.Id, ExternalTripId = $"{Guid.NewGuid()}" };
        dbContext.Trips.Add(trip);
        await dbContext.SaveChangesAsync();

        return (busRoute.Id, direction.Id);
    }

    [Fact]
    public async Task GetStatusAsync_NoAlertRecord_ReturnsNullTransitAlert()
    {
        // Arrange — T07's default: no TransitAlert row means Normal (represented as null).
        var (dbContext, service) = CreateSubject();
        var (routeId, directionId) = await SeedRouteWithDailyServiceAsync(dbContext);

        // Act
        var result = await service.GetStatusAsync(routeId, directionId);

        // Assert
        Assert.Null(result.TransitAlert);
        Assert.False(result.NotOperatingToday);
    }

    [Fact]
    public async Task GetStatusAsync_ActiveWholeRouteAlert_IsReturnedRegardlessOfDirection()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var (routeId, directionId) = await SeedRouteWithDailyServiceAsync(dbContext);
        var now = DateTime.UtcNow;
        dbContext.TransitAlerts.Add(new TransitAlert
        {
            BusRouteId = routeId,
            DirectionId = null,
            Status = TransitAlertStatus.Cancelled,
            Description = "Permanently cancelled",
            EffectiveFrom = now.AddDays(-1),
            EffectiveTo = null,
            CreatedAt = now,
            UpdatedAt = now,
        });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatusAsync(routeId, directionId);

        // Assert
        Assert.NotNull(result.TransitAlert);
        Assert.Equal(TransitAlertStatus.Cancelled, result.TransitAlert!.Status);
    }

    [Fact]
    public async Task GetStatusAsync_DirectionSpecificAlert_DoesNotApplyToOtherDirection()
    {
        // Arrange — alert is for directionId, but caller asks about a different one.
        var (dbContext, service) = CreateSubject();
        var (routeId, directionId) = await SeedRouteWithDailyServiceAsync(dbContext);
        var otherDirection = new Direction
        {
            BusRouteId = routeId,
            ExternalDirectionKey = $"{Guid.NewGuid()}",
            DirectionIndex = 1,
            Headsign = "Other",
        };
        dbContext.Directions.Add(otherDirection);
        await dbContext.SaveChangesAsync();

        var now = DateTime.UtcNow;
        dbContext.TransitAlerts.Add(new TransitAlert
        {
            BusRouteId = routeId,
            DirectionId = directionId,
            Status = TransitAlertStatus.RouteChanged,
            EffectiveFrom = now.AddDays(-1),
            EffectiveTo = null,
            CreatedAt = now,
            UpdatedAt = now,
        });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatusAsync(routeId, otherDirection.Id);

        // Assert
        Assert.Null(result.TransitAlert);
    }

    [Fact]
    public async Task GetStatusAsync_ExpiredAlert_IsNotReturned()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var (routeId, directionId) = await SeedRouteWithDailyServiceAsync(dbContext);
        var now = DateTime.UtcNow;
        dbContext.TransitAlerts.Add(new TransitAlert
        {
            BusRouteId = routeId,
            Status = TransitAlertStatus.Delayed,
            EffectiveFrom = now.AddDays(-10),
            EffectiveTo = now.AddDays(-5),
            CreatedAt = now,
            UpdatedAt = now,
        });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatusAsync(routeId, directionId);

        // Assert
        Assert.Null(result.TransitAlert);
    }

    [Fact]
    public async Task GetStatusAsync_MultipleActiveAlerts_ReturnsMostRecentlyCreated()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var (routeId, directionId) = await SeedRouteWithDailyServiceAsync(dbContext);
        var now = DateTime.UtcNow;
        dbContext.TransitAlerts.AddRange(
            new TransitAlert
            {
                BusRouteId = routeId,
                Status = TransitAlertStatus.Delayed,
                EffectiveFrom = now.AddDays(-2),
                CreatedAt = now.AddHours(-2),
                UpdatedAt = now.AddHours(-2),
            },
            new TransitAlert
            {
                BusRouteId = routeId,
                Status = TransitAlertStatus.TemporarilySuspended,
                EffectiveFrom = now.AddDays(-1),
                CreatedAt = now.AddHours(-1),
                UpdatedAt = now.AddHours(-1),
            });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.GetStatusAsync(routeId, directionId);

        // Assert
        Assert.Equal(TransitAlertStatus.TemporarilySuspended, result.TransitAlert!.Status);
    }

    [Fact]
    public async Task GetStatusAsync_NoTripsScheduledAtAll_ReturnsNotOperatingToday()
    {
        // Arrange — a route/direction with zero trips (e.g. discontinued in a later
        // GTFS import but its RouteStop/BusRoute rows still exist).
        var (dbContext, service) = CreateSubject();
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

        // Act
        var result = await service.GetStatusAsync(busRoute.Id, direction.Id);

        // Assert
        Assert.True(result.NotOperatingToday);
    }

    [Fact]
    public async Task GetStatusAsync_UnknownBusRoute_ThrowsValidateException()
    {
        // Arrange
        var (_, service) = CreateSubject();

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(() => service.GetStatusAsync(999, null));
    }
}
