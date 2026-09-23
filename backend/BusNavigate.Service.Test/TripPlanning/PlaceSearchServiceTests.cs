using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Interfaces.TripPlanning;
using Microsoft.EntityFrameworkCore;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;

namespace BusNavigate.Service.Test.TripPlanning;

public class PlaceSearchServiceTests
{
    private static (BusNavigateDbContext DbContext, Service.Implements.TripPlanning.PlaceSearchService Service) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        return (dbContext, new Service.Implements.TripPlanning.PlaceSearchService(dbContext));
    }

    [Fact]
    public async Task SearchAsync_MatchesBusStopByThaiOrEnglishName_CaseInsensitive()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        dbContext.BusStops.Add(new BusStopEntity
        {
            ExternalStopId = "S1",
            NameTh = "สยาม",
            NameEn = "Siam",
            Latitude = 13.75m,
            Longitude = 100.53m,
        });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.SearchAsync("SIAM");

        // Assert
        var match = Assert.Single(result);
        Assert.Equal(PlaceKind.BusStop, match.Type);
        Assert.Equal("Siam", match.NameEn);
    }

    [Fact]
    public async Task SearchAsync_MatchesPlaceByName_UsesNameForBothThAndEnFields()
    {
        // Arrange — Place has no NameTh/NameEn split (T06).
        var (dbContext, service) = CreateSubject();
        dbContext.Places.Add(new Place
        {
            ExternalId = "OSM-1",
            Name = "BTS Asok",
            PlaceType = PlaceType.RailStation,
            Latitude = 13.74m,
            Longitude = 100.56m,
            DataSource = "OSM",
        });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.SearchAsync("asok");

        // Assert
        var match = Assert.Single(result);
        Assert.Equal(PlaceKind.Place, match.Type);
        Assert.Equal("BTS Asok", match.NameTh);
        Assert.Equal("BTS Asok", match.NameEn);
    }

    [Fact]
    public async Task SearchAsync_StartsWithMatch_IsRankedBeforeContainsMatch()
    {
        // Arrange
        var (dbContext, service) = CreateSubject();
        dbContext.BusStops.AddRange(
            new BusStopEntity { ExternalStopId = "S1", NameTh = "a", NameEn = "Victory Siam", Latitude = 13.7m, Longitude = 100.5m },
            new BusStopEntity { ExternalStopId = "S2", NameTh = "b", NameEn = "Siam Square", Latitude = 13.7m, Longitude = 100.5m });
        await dbContext.SaveChangesAsync();

        // Act
        var result = await service.SearchAsync("Siam");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal("Siam Square", result[0].NameEn);
    }

    [Fact]
    public async Task SearchAsync_NoMatches_ReturnsEmptyListNotError()
    {
        // Arrange
        var (_, service) = CreateSubject();

        // Act
        var result = await service.SearchAsync("nonexistent place");

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task SearchAsync_BlankQuery_ReturnsEmptyList()
    {
        // Arrange
        var (_, service) = CreateSubject();

        // Act
        var result = await service.SearchAsync("   ");

        // Assert
        Assert.Empty(result);
    }
}
