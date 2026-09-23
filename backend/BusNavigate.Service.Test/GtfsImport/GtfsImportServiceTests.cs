using BusNavigate.Domain.Database;
using BusNavigate.Domain.Interfaces.GtfsImport;
using BusNavigate.Service.Implements.GtfsImport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace BusNavigate.Service.Test.GtfsImport;

public class GtfsImportServiceTests
{
    private const string Agency = "agency_id,agency_name\n1,Office of Transport and Traffic Policy and Planning\n";

    private const string Routes = "route_id,agency_id,route_short_name,route_long_name\n" +
        "R45,1,45,Siam - Victory Monument\n";

    // T1: full-length direction-0 trip (S1, S2, S3). T2: short-turn direction-0 trip
    // that skips S2 but keeps S1/S3's original positional stop_sequence (1 and 3), so
    // it must not reorder or shrink the canonical RouteStop list. T3: another
    // direction-0 trip with a minority headsign, to test headsign derivation.
    // T4: direction-1 trip, reverse order (S3 then S1).
    private const string Trips = "trip_id,route_id,service_id,trip_headsign,direction_id\n" +
        "T1,R45,WEEKDAY,Siam,0\n" +
        "T2,R45,WEEKDAY,Siam,0\n" +
        "T3,R45,WEEKDAY,Other,0\n" +
        "T4,R45,WEEKDAY,Victory Monument,1\n";

    private const string Stops = "stop_id,stop_name,stop_name_en,stop_lat,stop_lon\n" +
        "S1,สยาม,Siam,13.745,100.534\n" +
        "S2,สีลม,Silom,13.729,100.539\n" +
        "S3,สะพานควาย,Victory Monument,13.762,100.537\n";

    private const string StopTimes = "trip_id,stop_id,stop_sequence,arrival_time,departure_time\n" +
        "T1,S1,1,08:00:00,08:00:00\n" +
        "T1,S2,2,08:05:00,08:05:00\n" +
        "T1,S3,3,08:10:00,08:10:00\n" +
        "T2,S1,1,09:00:00,09:00:00\n" +
        "T2,S3,3,09:08:00,09:08:00\n" +
        "T3,S1,1,10:00:00,10:00:00\n" +
        "T4,S3,1,11:00:00,11:00:00\n" +
        "T4,S1,2,11:10:00,11:10:00\n";

    private const string Calendar = "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n" +
        "WEEKDAY,1,1,1,1,1,0,0,20260101,20261231\n";

    private const string CalendarDates = "service_id,date,exception_type\n" +
        "WEEKDAY,20260413,2\n";

    private static GtfsFeedFiles BuildFeed() => new(Agency, Routes, Trips, Stops, StopTimes, Calendar, CalendarDates);

    private static (BusNavigateDbContext DbContext, Mock<IGtfsFeedFetcher> Fetcher) CreateSubject()
    {
        var options = new DbContextOptionsBuilder<BusNavigateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var dbContext = new BusNavigateDbContext(options);

        var fetcher = new Mock<IGtfsFeedFetcher>();
        fetcher.Setup(f => f.FetchLatestAsync(It.IsAny<CancellationToken>())).ReturnsAsync(BuildFeed());

        return (dbContext, fetcher);
    }

    private static Service.Implements.GtfsImport.GtfsImportService CreateImportService(
        BusNavigateDbContext dbContext, Mock<IGtfsFeedFetcher> fetcher) =>
        new(dbContext, fetcher.Object, NullLogger<Service.Implements.GtfsImport.GtfsImportService>.Instance);

    [Fact]
    public async Task ImportAsync_FirstImport_CreatesEntitiesWithCorrectForeignKeyWiring()
    {
        // Arrange
        var (dbContext, fetcher) = CreateSubject();
        var importService = CreateImportService(dbContext, fetcher);

        // Act
        await importService.ImportAsync();

        // Assert
        var route = Assert.Single(dbContext.BusRoutes);
        Assert.Equal("R45", route.ExternalRouteId);
        Assert.Equal("Office of Transport and Traffic Policy and Planning", route.AgencyName);
        Assert.Equal("NamtangGTFS", route.DataSource);

        Assert.Equal(2, dbContext.Directions.Count());
        Assert.Equal(3, dbContext.BusStops.Count());

        var calendar = Assert.Single(dbContext.ServiceCalendars);
        Assert.True(calendar.Monday);

        var exception = Assert.Single(dbContext.ServiceExceptions);
        Assert.Equal(calendar.Id, exception.ServiceCalendarId);

        Assert.Equal(4, dbContext.Trips.Count());
        Assert.All(dbContext.Trips, t => Assert.True(t.DirectionId > 0));
        Assert.All(dbContext.Trips, t => Assert.Equal(calendar.Id, t.ServiceCalendarId));
    }

    [Fact]
    public async Task ImportAsync_DirectionDerivation_GroupsByRouteAndDirectionId_HeadsignIsMostCommon()
    {
        // Arrange
        var (dbContext, fetcher) = CreateSubject();
        var importService = CreateImportService(dbContext, fetcher);

        // Act
        await importService.ImportAsync();

        // Assert
        var directionZero = dbContext.Directions.Single(d => d.ExternalDirectionKey == "R45-0");
        Assert.Equal("Siam", directionZero.Headsign); // 2 trips say "Siam", 1 says "Other"
        Assert.Equal(0, directionZero.DirectionIndex);

        var directionOne = dbContext.Directions.Single(d => d.ExternalDirectionKey == "R45-1");
        Assert.Equal("Victory Monument", directionOne.Headsign);
    }

    [Fact]
    public async Task ImportAsync_RouteStopDerivation_ShortTurnTripDoesNotShrinkCanonicalList()
    {
        // Arrange
        var (dbContext, fetcher) = CreateSubject();
        var importService = CreateImportService(dbContext, fetcher);

        // Act
        await importService.ImportAsync();

        // Assert
        var directionZero = dbContext.Directions.Single(d => d.ExternalDirectionKey == "R45-0");
        var routeStops = dbContext.RouteStops
            .Where(rs => rs.DirectionId == directionZero.Id)
            .Include(rs => rs.BusStop)
            .OrderBy(rs => rs.SequenceNumber)
            .ToList();

        // S1, S2, S3 — T2's shorter trip (S1, S3 only) must not drop S2 from the
        // canonical list or reorder it.
        Assert.Equal(["S1", "S2", "S3"], routeStops.Select(rs => rs.BusStop.ExternalStopId));
        Assert.Equal([1, 2, 3], routeStops.Select(rs => rs.SequenceNumber));
    }

    [Fact]
    public async Task ImportAsync_RunTwice_UpsertsWithoutDuplicatingRowsOrChangingIds()
    {
        // Arrange
        var (dbContext, fetcher) = CreateSubject();
        var importService = CreateImportService(dbContext, fetcher);
        await importService.ImportAsync();

        var routeIdAfterFirstImport = dbContext.BusRoutes.Single().Id;
        var directionCountAfterFirstImport = dbContext.Directions.Count();
        var routeStopCountAfterFirstImport = dbContext.RouteStops.Count();

        // Act — re-import the same feed
        await importService.ImportAsync();

        // Assert
        Assert.Single(dbContext.BusRoutes);
        Assert.Equal(routeIdAfterFirstImport, dbContext.BusRoutes.Single().Id);
        Assert.Equal(directionCountAfterFirstImport, dbContext.Directions.Count());
        Assert.Equal(routeStopCountAfterFirstImport, dbContext.RouteStops.Count());
    }
}
