using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.Interfaces.TripPlanning;
using Microsoft.EntityFrameworkCore;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;
using UserPreferenceEntity = BusNavigate.Domain.Entities.UserPreference;

namespace BusNavigate.Service.Test.TripPlanning;

public class TravelOptionSearchServiceTests
{
    private const decimal CurrentLat = 13.7456m;
    private const decimal CurrentLon = 100.5342m;
    private const decimal DestinationLat = 13.80m;
    private const decimal DestinationLon = 100.60m;

    private static (BusNavigateDbContext DbContext, Service.Implements.TripPlanning.TravelOptionSearchService Service)
        CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);
        var reachabilityService = new Service.Implements.TravelOptionEvaluation.ReachabilityService(dbContext);
        var serviceStatusService = new Service.Implements.ServiceStatus.ServiceStatusService(dbContext);
        var userPreferenceService = new Service.Implements.UserPreference.UserPreferenceService(dbContext);
        var preferenceRankingService = new Service.Implements.PreferenceRanking.PreferenceRankingService(dbContext);

        return (dbContext, new Service.Implements.TripPlanning.TravelOptionSearchService(
            dbContext, reachabilityService, serviceStatusService, userPreferenceService, preferenceRankingService));
    }

    private static async Task<int> SeedDestinationBusStopAsync(BusNavigateDbContext dbContext)
    {
        var stop = new BusStopEntity
        {
            ExternalStopId = $"DEST-{Guid.NewGuid()}",
            NameTh = "d",
            NameEn = "d",
            Latitude = DestinationLat,
            Longitude = DestinationLon,
        };
        dbContext.BusStops.Add(stop);
        await dbContext.SaveChangesAsync();
        return stop.Id;
    }

    // stopCoordinates are in sequence order (index 0 = SequenceNumber 1, etc.).
    private static async Task<int> SeedDirectionAsync(
        BusNavigateDbContext dbContext, string headsign, params (decimal Lat, decimal Lon)[] stopCoordinates)
    {
        var busRoute = new BusRoute
        {
            ExternalRouteId = $"{Guid.NewGuid()}",
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
                NameTh = $"s{i}",
                NameEn = $"s{i}",
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
    public async Task SearchAsync_ValidDirectConnection_IsReturned()
    {
        // Arrange — boarding stop (seq 1) near CurrentLocation, alighting stop (seq 2,
        // a later sequence) near Destination.
        var (dbContext, service) = CreateSubject();
        var destinationStopId = await SeedDestinationBusStopAsync(dbContext);
        await SeedDirectionAsync(
            dbContext, "Good route",
            (CurrentLat + 0.0018m, CurrentLon),
            (DestinationLat + 0.0018m, DestinationLon));

        // Act
        var result = await service.SearchAsync(CurrentLat, CurrentLon, destinationStopId, PlaceKind.BusStop);

        // Assert
        var option = Assert.Single(result);
        Assert.Equal("Good route", option.RouteShortName);
        Assert.True(option.WalkingDistanceMeters > 0);
    }

    [Fact]
    public async Task SearchAsync_DestinationBeforeBoardingInSequence_IsExcluded()
    {
        // Arrange — reversed: the stop near Destination comes FIRST (seq 1), the stop
        // near CurrentLocation comes SECOND (seq 2) — this direction would take the
        // rider the wrong way.
        var (dbContext, service) = CreateSubject();
        var destinationStopId = await SeedDestinationBusStopAsync(dbContext);
        await SeedDirectionAsync(
            dbContext, "Wrong way",
            (DestinationLat + 0.0018m, DestinationLon),
            (CurrentLat + 0.0018m, CurrentLon));

        // Act
        var result = await service.SearchAsync(CurrentLat, CurrentLon, destinationStopId, PlaceKind.BusStop);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task SearchAsync_DirectionDoesNotReachDestination_IsExcluded()
    {
        // Arrange — only a boarding-adjacent stop; nothing near Destination.
        var (dbContext, service) = CreateSubject();
        var destinationStopId = await SeedDestinationBusStopAsync(dbContext);
        await SeedDirectionAsync(dbContext, "Dead end", (CurrentLat + 0.0018m, CurrentLon));

        // Act
        var result = await service.SearchAsync(CurrentLat, CurrentLon, destinationStopId, PlaceKind.BusStop);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task SearchAsync_NoDirectionNearCurrentLocation_ReturnsEmpty()
    {
        // Arrange — a direction that exists but is far from CurrentLocation entirely.
        var (dbContext, service) = CreateSubject();
        var destinationStopId = await SeedDestinationBusStopAsync(dbContext);
        await SeedDirectionAsync(
            dbContext, "Far away",
            (CurrentLat + 0.05m, CurrentLon),
            (DestinationLat + 0.0018m, DestinationLon));

        // Act
        var result = await service.SearchAsync(CurrentLat, CurrentLon, destinationStopId, PlaceKind.BusStop);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task SearchAsync_DestinationIsPlaceKind_ResolvesAgainstPlaceTable()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        var place = new Place
        {
            ExternalId = "OSM-1",
            Name = "BTS Station",
            PlaceType = PlaceType.RailStation,
            Latitude = DestinationLat,
            Longitude = DestinationLon,
            DataSource = "OSM",
        };
        dbContext.Places.Add(place);
        await dbContext.SaveChangesAsync();

        await SeedDirectionAsync(
            dbContext, "Good route",
            (CurrentLat + 0.0018m, CurrentLon),
            (DestinationLat + 0.0018m, DestinationLon));

        // Act
        var result = await service.SearchAsync(CurrentLat, CurrentLon, place.Id, PlaceKind.Place);

        // Assert
        Assert.Single(result);
    }

    [Fact]
    public async Task SearchAsync_UnknownDestination_ThrowsValidateException()
    {
        // Arrange
        var (_, service) = CreateSubject();

        // Act & Assert
        await Assert.ThrowsAsync<ValidateException>(
            () => service.SearchAsync(CurrentLat, CurrentLon, 999, PlaceKind.BusStop));
    }

    [Fact]
    public async Task SearchAsync_NoUserId_ReturnsResultsUnreordered()
    {
        // Arrange — omitting userId entirely (03: optional, graceful default).
        var (dbContext, service) = CreateSubject();
        var destinationStopId = await SeedDestinationBusStopAsync(dbContext);
        await SeedDirectionAsync(
            dbContext, "Good route",
            (CurrentLat + 0.0018m, CurrentLon),
            (DestinationLat + 0.0018m, DestinationLon));

        // Act
        var result = await service.SearchAsync(CurrentLat, CurrentLon, destinationStopId, PlaceKind.BusStop);

        // Assert
        var option = Assert.Single(result);
        Assert.DoesNotContain(option.Reasons, r => r.Code == ReasonCode.MatchesMinimizeWalking);
    }

    [Fact]
    public async Task SearchAsync_UserHasMinimizeWalkingPreference_ReordersByLowerWalkingDistanceAndTagsReason()
    {
        // Arrange — "Far walk" boards ~670m from CurrentLocation (within the 800m
        // budget but clearly farther), "Near walk" boards ~100m away.
        var (dbContext, service) = CreateSubject();
        var destinationStopId = await SeedDestinationBusStopAsync(dbContext);
        await SeedDirectionAsync(
            dbContext, "Far walk",
            (CurrentLat + 0.006m, CurrentLon),
            (DestinationLat + 0.0018m, DestinationLon));
        await SeedDirectionAsync(
            dbContext, "Near walk",
            (CurrentLat + 0.0009m, CurrentLon),
            (DestinationLat + 0.0018m, DestinationLon));

        var userId = await SeedUserWithPreferenceAsync(dbContext, minimizeWalking: true);

        // Act
        var result = await service.SearchAsync(CurrentLat, CurrentLon, destinationStopId, PlaceKind.BusStop, userId);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Near walk", result[0].RouteShortName);
        Assert.Contains(result[0].Reasons, r => r.Code == ReasonCode.MatchesMinimizeWalking);
    }

    [Fact]
    public async Task SearchAsync_UserHasNoPreferenceSaved_ReturnsResultsUnreordered()
    {
        // Arrange — a resolved user (real X-Device-Id) who never set a preference (01:
        // absence of a row reads back as all toggles off, never an error).
        var (dbContext, service) = CreateSubject();
        var destinationStopId = await SeedDestinationBusStopAsync(dbContext);
        await SeedDirectionAsync(
            dbContext, "Good route",
            (CurrentLat + 0.0018m, CurrentLon),
            (DestinationLat + 0.0018m, DestinationLon));

        var user = new User { ExternalDeviceId = Guid.NewGuid().ToString(), CreatedAt = DateTime.UtcNow };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.SearchAsync(CurrentLat, CurrentLon, destinationStopId, PlaceKind.BusStop, user.Id);

        // Assert
        var option = Assert.Single(result);
        Assert.DoesNotContain(option.Reasons, r => r.Code == ReasonCode.MatchesMinimizeWalking);
    }

    private static async Task<int> SeedUserWithPreferenceAsync(
        BusNavigateDbContext dbContext, bool minimizeWalking = false, bool minimizeTransfers = false,
        bool avoidStreetCrossing = false)
    {
        var user = new User { ExternalDeviceId = Guid.NewGuid().ToString(), CreatedAt = DateTime.UtcNow };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        dbContext.UserPreferences.Add(new UserPreferenceEntity
        {
            UserId = user.Id,
            MinimizeWalking = minimizeWalking,
            MinimizeTransfers = minimizeTransfers,
            AvoidStreetCrossing = avoidStreetCrossing,
            UpdatedAt = DateTime.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        return user.Id;
    }
}
