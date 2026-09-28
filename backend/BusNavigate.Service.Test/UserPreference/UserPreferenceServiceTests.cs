using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Test.UserPreference;

public class UserPreferenceServiceTests
{
    private static (BusNavigateDbContext DbContext, Service.Implements.UserPreference.UserPreferenceService Service) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.UserPreference.UserPreferenceService(dbContext));
    }

    private static async Task<int> SeedUserAsync(BusNavigateDbContext dbContext)
    {
        var user = new User { ExternalDeviceId = Guid.NewGuid().ToString(), CreatedAt = DateTime.UtcNow };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user.Id;
    }

    [Fact]
    public async Task GetAsync_NoSavedPreference_ReturnsAllTogglesOff()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var userId = await SeedUserAsync(dbContext);

        // Act
        var preference = await service.GetAsync(userId);

        // Assert
        Assert.False(preference.MinimizeWalking);
        Assert.False(preference.MinimizeTransfers);
        Assert.False(preference.AvoidStreetCrossing);
    }

    [Fact]
    public async Task SetAsync_NoExistingRow_CreatesPreferenceViaSingleUpsert()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var userId = await SeedUserAsync(dbContext);

        // Act
        await service.SetAsync(userId, minimizeWalking: true, minimizeTransfers: false, avoidStreetCrossing: true);

        // Assert
        var saved = await dbContext.UserPreferences.SingleAsync(p => p.UserId == userId);
        Assert.True(saved.MinimizeWalking);
        Assert.False(saved.MinimizeTransfers);
        Assert.True(saved.AvoidStreetCrossing);
    }

    [Fact]
    public async Task GetAsync_AfterSet_ReadsBackTheSameValuesOnASeparateCall()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var userId = await SeedUserAsync(dbContext);
        await service.SetAsync(userId, minimizeWalking: false, minimizeTransfers: true, avoidStreetCrossing: false);

        // Act
        var preference = await service.GetAsync(userId);

        // Assert
        Assert.False(preference.MinimizeWalking);
        Assert.True(preference.MinimizeTransfers);
        Assert.False(preference.AvoidStreetCrossing);
    }

    [Fact]
    public async Task SetAsync_ExistingRow_FullyReplacesPreviousValueRatherThanPatching()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var userId = await SeedUserAsync(dbContext);
        await service.SetAsync(userId, minimizeWalking: true, minimizeTransfers: true, avoidStreetCrossing: true);

        // Act
        await service.SetAsync(userId, minimizeWalking: false, minimizeTransfers: false, avoidStreetCrossing: true);

        // Assert
        var saved = await dbContext.UserPreferences.SingleAsync(p => p.UserId == userId);
        Assert.False(saved.MinimizeWalking);
        Assert.False(saved.MinimizeTransfers);
        Assert.True(saved.AvoidStreetCrossing);
    }

    [Fact]
    public async Task GetAsync_OneDevicesPreference_IsNeverVisibleToAnotherDevice()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var userAId = await SeedUserAsync(dbContext);
        var userBId = await SeedUserAsync(dbContext);
        await service.SetAsync(userAId, minimizeWalking: true, minimizeTransfers: true, avoidStreetCrossing: true);

        // Act
        var preferenceB = await service.GetAsync(userBId);

        // Assert
        Assert.False(preferenceB.MinimizeWalking);
        Assert.False(preferenceB.MinimizeTransfers);
        Assert.False(preferenceB.AvoidStreetCrossing);
    }
}
