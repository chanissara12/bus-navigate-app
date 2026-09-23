using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Interfaces.TravelSession;
using Microsoft.EntityFrameworkCore;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;

namespace BusNavigate.Service.Test.TravelSession;

public class TravelSessionServiceTests
{
    private static (BusNavigateDbContext DbContext, Service.Implements.TravelSession.TravelSessionService Service) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.TravelSession.TravelSessionService(dbContext));
    }

    private static async Task<int> SeedSessionAsync(
        BusNavigateDbContext dbContext, Service.Implements.TravelSession.TravelSessionService service)
    {
        var user = new User { ExternalDeviceId = Guid.NewGuid().ToString(), CreatedAt = DateTime.UtcNow };
        var busRoute = new BusRoute { ExternalRouteId = "R1", ShortName = "1", LongName = "Route 1", DataSource = "test", ImportedAt = DateTime.UtcNow };
        var direction = new Direction { BusRoute = busRoute, ExternalDirectionKey = "R1-0", DirectionIndex = 0, Headsign = "Siam" };
        var boardingStop = new BusStopEntity { ExternalStopId = "S1", NameTh = "1", NameEn = "1", Latitude = 0, Longitude = 0 };
        var alightingStop = new BusStopEntity { ExternalStopId = "S2", NameTh = "2", NameEn = "2", Latitude = 0, Longitude = 0 };

        dbContext.AddRange(user, busRoute, direction, boardingStop, alightingStop);
        await dbContext.SaveChangesAsync();

        var session = await service.CreateAsync(user.Id, direction.Id, boardingStop.Id, alightingStop.Id);
        return session.Id;
    }

    // Boarding at SequenceNumber 1, alighting at SequenceNumber 4 — three stops apart.
    private static async Task<int> SeedRidingSessionWithRouteStopsAsync(
        BusNavigateDbContext dbContext, Service.Implements.TravelSession.TravelSessionService service)
    {
        var sessionId = await SeedSessionAsync(dbContext, service);
        var session = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        session.State = TravelSessionState.Riding;

        dbContext.RouteStops.Add(
            new RouteStop { DirectionId = session.DirectionId, BusStopId = session.BoardingStopId, SequenceNumber = 1 });
        dbContext.RouteStops.Add(
            new RouteStop { DirectionId = session.DirectionId, BusStopId = session.AlightingStopId, SequenceNumber = 4 });
        await dbContext.SaveChangesAsync();

        return sessionId;
    }

    [Fact]
    public async Task CreateAsync_CreatesSessionInPlannedState()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();

        // Act
        var sessionId = await SeedSessionAsync(dbContext, service);

        // Assert
        var session = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        Assert.Equal(TravelSessionState.Planned, session.State);
    }

    [Theory]
    [InlineData(TravelSessionState.Planned, TravelSessionEventType.StartedWalking, TravelSessionState.WalkingToStop)]
    [InlineData(TravelSessionState.WalkingToStop, TravelSessionEventType.ArrivedAtStop, TravelSessionState.Waiting)]
    [InlineData(TravelSessionState.Waiting, TravelSessionEventType.Boarded, TravelSessionState.Riding)]
    [InlineData(TravelSessionState.Waiting, TravelSessionEventType.ReportedWrongBus, TravelSessionState.Misboarded)]
    [InlineData(TravelSessionState.Riding, TravelSessionEventType.ReportedWrongBus, TravelSessionState.Misboarded)]
    [InlineData(TravelSessionState.Riding, TravelSessionEventType.Alighted, TravelSessionState.Alighted)]
    [InlineData(TravelSessionState.Alighted, TravelSessionEventType.ReachedDestination, TravelSessionState.Completed)]
    public async Task ApplyEventAsync_ValidTransition_MovesToExpectedState(
        TravelSessionState from, TravelSessionEventType eventType, TravelSessionState expected)
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedSessionAsync(dbContext, service);
        var session = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        session.State = from;
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.ApplyEventAsync(sessionId, eventType);

        // Assert
        Assert.Equal(expected, result.State);
    }

    [Theory]
    [InlineData(TravelSessionState.Planned, TravelSessionEventType.Boarded)]
    [InlineData(TravelSessionState.Completed, TravelSessionEventType.StartedWalking)]
    [InlineData(TravelSessionState.Abandoned, TravelSessionEventType.ArrivedAtStop)]
    [InlineData(TravelSessionState.Misboarded, TravelSessionEventType.Boarded)]
    public async Task ApplyEventAsync_InvalidTransition_ThrowsValidateExceptionAndLeavesStateUnchanged(
        TravelSessionState from, TravelSessionEventType eventType)
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedSessionAsync(dbContext, service);
        var session = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        session.State = from;
        await dbContext.SaveChangesAsync();

        // Act
        await Assert.ThrowsAsync<ValidateException>(() => service.ApplyEventAsync(sessionId, eventType));

        // Assert
        var unchanged = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        Assert.Equal(from, unchanged.State);
    }

    [Fact]
    public async Task ApplyEventAsync_UnknownSession_ThrowsValidateException()
    {
        // Arrange
        var (_, service) = CreateSubject();

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(
            () => service.ApplyEventAsync(999, TravelSessionEventType.StartedWalking));
    }

    [Fact]
    public async Task AbandonStaleSessionsAsync_NonTerminalSessionInactiveOverTwoHours_BecomesAbandoned()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedSessionAsync(dbContext, service);
        var session = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        session.State = TravelSessionState.Waiting;
        session.LastActivityAt = DateTime.UtcNow - TimeSpan.FromHours(3);
        await dbContext.SaveChangesAsync();

        // Act
        var abandonedCount = await service.AbandonStaleSessionsAsync();

        // Assert
        Assert.Equal(1, abandonedCount);
        var updated = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        Assert.Equal(TravelSessionState.Abandoned, updated.State);
    }

    [Fact]
    public async Task AbandonStaleSessionsAsync_RecentlyActiveSession_IsUntouched()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedSessionAsync(dbContext, service);
        var session = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        session.State = TravelSessionState.Waiting;
        session.LastActivityAt = DateTime.UtcNow - TimeSpan.FromMinutes(30);
        await dbContext.SaveChangesAsync();

        // Act
        var abandonedCount = await service.AbandonStaleSessionsAsync();

        // Assert
        Assert.Equal(0, abandonedCount);
        var unchanged = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        Assert.Equal(TravelSessionState.Waiting, unchanged.State);
    }

    [Fact]
    public async Task AbandonStaleSessionsAsync_StaleCompletedSession_IsNeverAbandoned()
    {
        // Arrange — Completed is terminal, so it must not be touched even if very stale.
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedSessionAsync(dbContext, service);
        var session = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        session.State = TravelSessionState.Completed;
        session.LastActivityAt = DateTime.UtcNow - TimeSpan.FromDays(1);
        await dbContext.SaveChangesAsync();

        // Act
        var abandonedCount = await service.AbandonStaleSessionsAsync();

        // Assert
        Assert.Equal(0, abandonedCount);
        var unchanged = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        Assert.Equal(TravelSessionState.Completed, unchanged.State);
    }

    [Fact]
    public async Task GetProgressAsync_NoCurrentStopSequenceProvided_AssumesStillAtBoardingStop()
    {
        // Arrange — boarding seq 1, alighting seq 4 → 3 stops remaining if not moved yet.
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedRidingSessionWithRouteStopsAsync(dbContext, service);

        // Act
        var result = await service.GetProgressAsync(sessionId, currentStopSequence: null);

        // Assert
        Assert.Equal(3, result.RemainingStopCount);
        Assert.False(result.IsApproachingDestination);
        Assert.Equal(DataConfidence.Estimated, result.DataConfidence);
    }

    [Fact]
    public async Task GetProgressAsync_OneStopFromAlighting_IsApproachingDestination()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedRidingSessionWithRouteStopsAsync(dbContext, service);

        // Act — reported at sequence 3, alighting is at sequence 4.
        var result = await service.GetProgressAsync(sessionId, currentStopSequence: 3);

        // Assert
        Assert.Equal(1, result.RemainingStopCount);
        Assert.True(result.IsApproachingDestination);
    }

    [Fact]
    public async Task GetProgressAsync_ReportedPastAlighting_ClampsRemainingCountToZero()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedRidingSessionWithRouteStopsAsync(dbContext, service);

        // Act — reported at sequence 6, past the alighting stop's sequence of 4.
        var result = await service.GetProgressAsync(sessionId, currentStopSequence: 6);

        // Assert
        Assert.Equal(0, result.RemainingStopCount);
        Assert.True(result.IsApproachingDestination);
    }

    [Theory]
    [InlineData(TravelSessionState.Planned)]
    [InlineData(TravelSessionState.Waiting)]
    [InlineData(TravelSessionState.Alighted)]
    public async Task GetProgressAsync_SessionNotRiding_ThrowsValidateException(TravelSessionState state)
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedRidingSessionWithRouteStopsAsync(dbContext, service);
        var session = await dbContext.TravelSessions.SingleAsync(s => s.Id == sessionId);
        session.State = state;
        await dbContext.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(() => service.GetProgressAsync(sessionId, null));
    }

    [Fact]
    public async Task GetProgressAsync_UnknownSession_ThrowsValidateException()
    {
        // Arrange
        var (_, service) = CreateSubject();

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(() => service.GetProgressAsync(999, null));
    }
}
