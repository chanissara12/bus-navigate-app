using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Interfaces.GtfsImport;
using BusNavigate.Service.Implements.GtfsImport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace BusNavigate.Service.Test.GtfsImport;

public class RouteShapeImportServiceTests
{
    [Fact]
    public async Task ImportAsync_SelectsMostCommonShapePerDirectionAndSimplifiesPoints()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new BusNavigateDbContext(options);

        dbContext.Directions.AddRange(
            new Direction { Id = 1, ExternalDirectionKey = "R45-0" },
            new Direction { Id = 2, ExternalDirectionKey = "R45-1" });
        await dbContext.SaveChangesAsync();

        const string trips =
            "trip_id,route_id,service_id,trip_headsign,direction_id,shape_id\n" +
            "T1,R45,WEEKDAY,Siam,0,SHAPE-A\n" +
            "T2,R45,WEEKDAY,Siam,0,SHAPE-A\n" +
            "T3,R45,WEEKDAY,Siam,0,SHAPE-B\n" +
            "T4,R45,WEEKDAY,Victory Monument,1,SHAPE-C\n";

        const string shapes =
            "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\n" +
            "SHAPE-A,13.700000,100.500000,1\n" +
            "SHAPE-A,13.700050,100.500000,2\n" +
            "SHAPE-A,13.700100,100.500000,3\n" +
            "SHAPE-B,13.800000,100.600000,1\n" +
            "SHAPE-B,13.801000,100.600000,2\n" +
            "SHAPE-C,13.710000,100.510000,1\n" +
            "SHAPE-C,13.711000,100.510000,2\n";

        var fetcher = new Mock<IGtfsFeedFetcher>();
        fetcher.Setup(f => f.GetLatestVersionAsync(It.IsAny<CancellationToken>())).ReturnsAsync("version-1");
        fetcher.Setup(f => f.FetchLatestShapeFeedAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((trips, shapes));

        var service = new RouteShapeImportService(
            dbContext,
            fetcher.Object,
            NullLogger<RouteShapeImportService>.Instance);

        // Act
        await service.ImportAsync();

        // Assert
        var directionZeroPoints = dbContext.RouteShapePoints
            .Where(point => point.DirectionId == 1)
            .OrderBy(point => point.Sequence)
            .ToList();
        var directionOnePoints = dbContext.RouteShapePoints
            .Where(point => point.DirectionId == 2)
            .OrderBy(point => point.Sequence)
            .ToList();

        Assert.Equal(2, directionZeroPoints.Count);
        Assert.Equal(2, directionOnePoints.Count);
        Assert.Equal(13.700000m, directionZeroPoints[0].Latitude);
        Assert.Equal(13.700100m, directionZeroPoints[1].Latitude);
        Assert.Equal("version-1", dbContext.RouteShapeImportStates.Single().FeedVersion);
    }

    [Fact]
    public async Task ImportAsync_SameFeedVersion_SkipsExpensiveShapeDownload()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new BusNavigateDbContext(options);

        dbContext.RouteShapeImportStates.Add(new RouteShapeImportState
        {
            Id = "namtang",
            FeedVersion = "version-1",
            ImportedAt = DateTime.UtcNow
        });
        dbContext.Directions.Add(new Direction { Id = 1, ExternalDirectionKey = "R45-0" });
        dbContext.RouteShapePoints.Add(new RouteShapePoint
        {
            DirectionId = 1,
            Sequence = 1,
            Latitude = 13.7m,
            Longitude = 100.5m
        });
        await dbContext.SaveChangesAsync();

        var fetcher = new Mock<IGtfsFeedFetcher>();
        fetcher.Setup(f => f.GetLatestVersionAsync(It.IsAny<CancellationToken>())).ReturnsAsync("version-1");

        var service = new RouteShapeImportService(
            dbContext,
            fetcher.Object,
            NullLogger<RouteShapeImportService>.Instance);

        // Act
        await service.ImportAsync();

        // Assert
        fetcher.Verify(
            f => f.FetchLatestShapeFeedAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
