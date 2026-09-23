using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Test.TravelOptionEvaluation;

public class TravelOptionEvaluationServiceTests
{
    // Destination (the seeded TravelSession's AlightingStop) — roughly Siam, Bangkok.
    private const decimal DestinationLat = 13.7456m;
    private const decimal DestinationLon = 100.5342m;

    private static (BusNavigateDbContext DbContext, Service.Implements.TravelOptionEvaluation.TravelOptionEvaluationService Service)
        CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.TravelOptionEvaluation.TravelOptionEvaluationService(dbContext));
    }

    private static async Task<int> SeedTravelSessionAsync(BusNavigateDbContext dbContext)
    {
        var user = new User { ExternalDeviceId = Guid.NewGuid().ToString(), CreatedAt = DateTime.UtcNow };
        var busRoute = new BusRoute
        {
            ExternalRouteId = "R-ORIGINAL",
            ShortName = "1",
            LongName = "Original route",
            DataSource = "test",
            ImportedAt = DateTime.UtcNow,
        };
        var direction = new Direction { BusRoute = busRoute, ExternalDirectionKey = "R-ORIGINAL-0", DirectionIndex = 0, Headsign = "Siam" };
        var boardingStop = new BusStop { ExternalStopId = "BOARD", NameTh = "b", NameEn = "b", Latitude = 13.70m, Longitude = 100.50m };
        var alightingStop = new BusStop
        {
            ExternalStopId = "DEST",
            NameTh = "d",
            NameEn = "d",
            Latitude = DestinationLat,
            Longitude = DestinationLon,
        };

        dbContext.AddRange(user, busRoute, direction, boardingStop, alightingStop);
        await dbContext.SaveChangesAsync();

        var session = new BusNavigate.Domain.Entities.TravelSession
        {
            UserId = user.Id,
            DirectionId = direction.Id,
            BoardingStopId = boardingStop.Id,
            AlightingStopId = alightingStop.Id,
            State = TravelSessionState.Riding,
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
        };
        dbContext.TravelSessions.Add(session);
        await dbContext.SaveChangesAsync();

        return session.Id;
    }

    private static async Task<int> SeedCandidateDirectionAsync(
        BusNavigateDbContext dbContext, params (decimal Lat, decimal Lon)[] stopCoordinates)
    {
        var busRoute = new BusRoute
        {
            ExternalRouteId = $"R-CANDIDATE-{Guid.NewGuid()}",
            ShortName = "2",
            LongName = "Candidate route",
            DataSource = "test",
            ImportedAt = DateTime.UtcNow,
        };
        var direction = new Direction
        {
            BusRoute = busRoute,
            ExternalDirectionKey = $"candidate-{Guid.NewGuid()}",
            DirectionIndex = 0,
            Headsign = "Candidate",
        };
        dbContext.AddRange(busRoute, direction);
        await dbContext.SaveChangesAsync();

        for (var i = 0; i < stopCoordinates.Length; i++)
        {
            var (lat, lon) = stopCoordinates[i];
            var stop = new BusStop
            {
                ExternalStopId = $"CAND-{direction.Id}-{i}",
                NameTh = "c",
                NameEn = "c",
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
    public async Task EvaluateAsync_CandidateStopWithinWalkBudget_IsAccepted()
    {
        // Arrange — a candidate stop ~200m from the destination; 200m x 1.3 = 260m,
        // well within the 800m budget.
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        var candidateDirectionId = await SeedCandidateDirectionAsync(dbContext, (DestinationLat + 0.0018m, DestinationLon));

        // Act
        var result = await service.EvaluateAsync(sessionId, candidateDirectionId);

        // Assert
        Assert.True(result.Accepted);
        Assert.Contains(result.Reasons, r => r.Code == ReasonCode.ReachesDestination);
        Assert.Contains(result.Reasons, r => r.Code == ReasonCode.NoTransfer);
        var walkBudgetReason = Assert.Single(result.Reasons, r => r.Code == ReasonCode.WithinWalkBudget);
        Assert.NotNull(walkBudgetReason.Value);
        Assert.InRange(walkBudgetReason.Value!.Value, 0, 800);
    }

    [Fact]
    public async Task EvaluateAsync_NoCandidateStopWithinWalkBudget_IsRejected()
    {
        // Arrange — a candidate stop ~2000m from the destination; well beyond the
        // 800m budget even before the 1.3x detour factor.
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        var candidateDirectionId = await SeedCandidateDirectionAsync(dbContext, (DestinationLat + 0.018m, DestinationLon));

        // Act
        var result = await service.EvaluateAsync(sessionId, candidateDirectionId);

        // Assert
        Assert.False(result.Accepted);
        var reason = Assert.Single(result.Reasons);
        Assert.Equal(ReasonCode.DoesNotReachDestination, reason.Code);
    }

    [Fact]
    public async Task EvaluateAsync_MultipleCandidateStops_UsesNearestOneToDestination()
    {
        // Arrange — one far stop (would be rejected alone) and one close stop; the
        // candidate direction as a whole must be judged by its nearest stop.
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        var candidateDirectionId = await SeedCandidateDirectionAsync(
            dbContext,
            (DestinationLat + 0.018m, DestinationLon), // ~2000m — too far alone
            (DestinationLat + 0.0018m, DestinationLon) // ~200m — within budget
        );

        // Act
        var result = await service.EvaluateAsync(sessionId, candidateDirectionId);

        // Assert
        Assert.True(result.Accepted);
    }

    [Fact]
    public async Task EvaluateAsync_UnknownTravelSession_ThrowsValidateException()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var candidateDirectionId = await SeedCandidateDirectionAsync(dbContext, (DestinationLat, DestinationLon));

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(() => service.EvaluateAsync(999, candidateDirectionId));
    }

    [Fact]
    public async Task EvaluateAsync_CandidateDirectionWithNoStops_ThrowsValidateException()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(() => service.EvaluateAsync(sessionId, 999));
    }
}
