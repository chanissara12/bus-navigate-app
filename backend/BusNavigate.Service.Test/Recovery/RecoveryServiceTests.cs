using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Interfaces.Recovery;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using Microsoft.EntityFrameworkCore;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;
using TravelSessionEntity = BusNavigate.Domain.Entities.TravelSession;

namespace BusNavigate.Service.Test.Recovery;

public class RecoveryServiceTests
{
    // Where the original plan's destination is (Victory Monument-ish) — far from
    // CurrentLocation below, matching a genuine wrong-bus scenario.
    private const decimal DestinationLat = 13.80m;
    private const decimal DestinationLon = 100.60m;

    // Where the user reports actually being right now (Siam-ish).
    private const decimal CurrentLat = 13.7456m;
    private const decimal CurrentLon = 100.5342m;

    private static (BusNavigateDbContext DbContext, Service.Implements.Recovery.RecoveryService Service) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);
        var evaluationService = new Service.Implements.TravelOptionEvaluation.TravelOptionEvaluationService(dbContext);

        return (dbContext, new Service.Implements.Recovery.RecoveryService(dbContext, evaluationService));
    }

    private static async Task<int> SeedTravelSessionAsync(BusNavigateDbContext dbContext)
    {
        var user = new User { ExternalDeviceId = Guid.NewGuid().ToString(), CreatedAt = DateTime.UtcNow };
        var busRoute = new BusRoute
        {
            ExternalRouteId = $"R-PLAN-{Guid.NewGuid()}",
            ShortName = "1",
            LongName = "Planned route",
            DataSource = "test",
            ImportedAt = DateTime.UtcNow,
        };
        var direction = new Direction { BusRoute = busRoute, ExternalDirectionKey = $"plan-{Guid.NewGuid()}", DirectionIndex = 0, Headsign = "Planned" };
        var boardingStop = new BusStopEntity { ExternalStopId = $"BOARD-{Guid.NewGuid()}", NameTh = "b", NameEn = "b", Latitude = 13.70m, Longitude = 100.50m };
        var alightingStop = new BusStopEntity
        {
            ExternalStopId = $"DEST-{Guid.NewGuid()}",
            NameTh = "d",
            NameEn = "d",
            Latitude = DestinationLat,
            Longitude = DestinationLon,
        };

        dbContext.AddRange(user, busRoute, direction, boardingStop, alightingStop);
        await dbContext.SaveChangesAsync();

        var session = new TravelSessionEntity
        {
            UserId = user.Id,
            DirectionId = direction.Id,
            BoardingStopId = boardingStop.Id,
            AlightingStopId = alightingStop.Id,
            State = TravelSessionState.Misboarded,
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
        };
        dbContext.TravelSessions.Add(session);
        await dbContext.SaveChangesAsync();

        return session.Id;
    }

    private static async Task<int> SeedDirectionAsync(
        BusNavigateDbContext dbContext, string headsign, params (decimal Lat, decimal Lon)[] stopCoordinates)
    {
        var busRoute = new BusRoute
        {
            ExternalRouteId = $"R-{Guid.NewGuid()}",
            ShortName = headsign,
            LongName = headsign,
            DataSource = "test",
            ImportedAt = DateTime.UtcNow,
        };
        var direction = new Direction
        {
            BusRoute = busRoute,
            ExternalDirectionKey = $"{Guid.NewGuid()}",
            DirectionIndex = 0,
            Headsign = headsign,
        };
        dbContext.AddRange(busRoute, direction);
        await dbContext.SaveChangesAsync();

        for (var i = 0; i < stopCoordinates.Length; i++)
        {
            var (lat, lon) = stopCoordinates[i];
            var stop = new BusStopEntity
            {
                ExternalStopId = $"S-{direction.Id}-{i}",
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

    private static async Task SeedPlaceAsync(BusNavigateDbContext dbContext, string name, decimal lat, decimal lon)
    {
        dbContext.Places.Add(new Place
        {
            ExternalId = $"OSM-{Guid.NewGuid()}",
            Name = name,
            PlaceType = PlaceType.RailStation,
            Latitude = lat,
            Longitude = lon,
            DataSource = "OSM",
        });
        await dbContext.SaveChangesAsync();
    }

    [Fact]
    public async Task GenerateRecoveryOptionsAsync_DirectionReachingDestinationFromNearbyStop_IsRecommended()
    {
        // Arrange — a stop ~200m from CurrentLocation (discoverable) and another
        // ~200m from Destination (so T05's evaluation accepts it).
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        await SeedDirectionAsync(
            dbContext, "Good route",
            (CurrentLat + 0.0018m, CurrentLon),
            (DestinationLat + 0.0018m, DestinationLon));

        // Act
        var result = await service.GenerateRecoveryOptionsAsync(sessionId, currentDirectionId: null, CurrentLat, CurrentLon);

        // Assert
        var option = Assert.Single(result.RecommendedOptions);
        Assert.Equal("Good route → Good route", option.Label);
        Assert.Contains(option.Reasons, r => r.Code == ReasonCode.ReachesDestination);
        Assert.Empty(result.LastResortOptions);
    }

    [Fact]
    public async Task GenerateRecoveryOptionsAsync_NearbyDirectionThatDoesNotReachDestination_IsLastResort()
    {
        // Arrange — a stop ~200m from CurrentLocation, but nothing near Destination.
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        await SeedDirectionAsync(dbContext, "Dead end", (CurrentLat + 0.0018m, CurrentLon));

        // Act
        var result = await service.GenerateRecoveryOptionsAsync(sessionId, currentDirectionId: null, CurrentLat, CurrentLon);

        // Assert
        Assert.Empty(result.RecommendedOptions);
        var option = Assert.Single(result.LastResortOptions);
        Assert.Contains(option.Reasons, r => r.Code == ReasonCode.DoesNotReachDestination);
    }

    [Fact]
    public async Task GenerateRecoveryOptionsAsync_DirectionOutsideSearchRadius_IsNeverConsidered()
    {
        // Arrange — a direction whose only stop is ~2000m from CurrentLocation, well
        // outside the 800m recovery-point search radius.
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        await SeedDirectionAsync(dbContext, "Too far", (CurrentLat + 0.018m, CurrentLon));

        // Act
        var result = await service.GenerateRecoveryOptionsAsync(sessionId, currentDirectionId: null, CurrentLat, CurrentLon);

        // Assert
        Assert.Empty(result.RecommendedOptions);
        Assert.Empty(result.LastResortOptions);
    }

    [Fact]
    public async Task GenerateRecoveryOptionsAsync_CurrentDirectionProvided_IsIncludedWithZeroDistance()
    {
        // Arrange — the "continue on current bus" candidate: a direction with no stop
        // anywhere near Destination, so it's expected to land in LastResort, but must
        // still be considered even though nothing places it within the search radius
        // (it's supplied directly as CONTEXT.md's CurrentRoute, not discovered).
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        var currentDirectionId = await SeedDirectionAsync(dbContext, "Current wrong bus", (0m, 0m));

        // Act
        var result = await service.GenerateRecoveryOptionsAsync(sessionId, currentDirectionId, CurrentLat, CurrentLon);

        // Assert
        var option = Assert.Single(result.LastResortOptions);
        Assert.Equal(0, option.DistanceMeters);
    }

    [Fact]
    public async Task GenerateRecoveryOptionsAsync_UnknownCurrentDirection_ThrowsValidateException()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(
            () => service.GenerateRecoveryOptionsAsync(sessionId, currentDirectionId: 999, CurrentLat, CurrentLon));
    }

    [Fact]
    public async Task GenerateRecoveryOptionsAsync_NearbyRailStation_ReturnsUnconfirmedPointerWithUnknownConfidence()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        await SeedPlaceAsync(dbContext, "BTS Siam", CurrentLat + 0.0018m, CurrentLon);
        await SeedPlaceAsync(dbContext, "Too far station", CurrentLat + 0.018m, CurrentLon);

        // Act
        var result = await service.GenerateRecoveryOptionsAsync(sessionId, currentDirectionId: null, CurrentLat, CurrentLon);

        // Assert
        var pointer = Assert.Single(result.UnconfirmedRailPointers);
        Assert.Equal("BTS Siam", pointer.Label);
        Assert.Equal(DataConfidence.Unknown, pointer.DataConfidence);
        Assert.Empty(pointer.Reasons);
    }

    [Fact]
    public async Task GenerateRecoveryOptionsAsync_LastResortOptions_AreOrderedByHowCloseTheyGot()
    {
        // Arrange — two rejected directions, one whose nearest-to-destination stop is
        // much closer than the other's; the closer one should rank first.
        var (dbContext, service) = CreateSubject();
        var sessionId = await SeedTravelSessionAsync(dbContext);
        // "Closer" reaches to within ~950m of destination (rejected, but barely).
        await SeedDirectionAsync(
            dbContext, "Closer",
            (CurrentLat + 0.0018m, CurrentLon),
            (DestinationLat + 0.0075m, DestinationLon));
        // "Farther" has no stop anywhere near destination at all.
        await SeedDirectionAsync(dbContext, "Farther", (CurrentLat + 0.002m, CurrentLon));

        // Act
        var result = await service.GenerateRecoveryOptionsAsync(sessionId, currentDirectionId: null, CurrentLat, CurrentLon);

        // Assert
        Assert.Equal(2, result.LastResortOptions.Count);
        Assert.Equal("Closer → Closer", result.LastResortOptions[0].Label);
        Assert.Equal("Farther → Farther", result.LastResortOptions[1].Label);
    }

    [Fact]
    public async Task GenerateRecoveryOptionsAsync_UnknownTravelSession_ThrowsValidateException()
    {
        // Arrange
        var (_, service) = CreateSubject();

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(
            () => service.GenerateRecoveryOptionsAsync(999, currentDirectionId: null, CurrentLat, CurrentLon));
    }
}
