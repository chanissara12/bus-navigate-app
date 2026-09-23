using BusNavigate.Service.Implements.GtfsImport;

namespace BusNavigate.Service.Test.GtfsImport;

public class GtfsParserTests
{
    [Fact]
    public void ParseAgencies_MapsFields()
    {
        // Arrange
        const string csv = "agency_id,agency_name,agency_url,agency_timezone\n" +
            "1,Office of Transport and Traffic Policy and Planning,https://otp.go.th,Asia/Bangkok\n";

        // Act
        var result = GtfsParser.ParseAgencies(csv);

        // Assert
        var agency = Assert.Single(result);
        Assert.Equal("1", agency.AgencyId);
        Assert.Equal("Office of Transport and Traffic Policy and Planning", agency.AgencyName);
    }

    [Fact]
    public void ParseRoutes_MapsFields()
    {
        // Arrange
        const string csv = "route_id,agency_id,route_short_name,route_long_name,route_type\n" +
            "R45,1,45,Siam - Victory Monument,3\n";

        // Act
        var result = GtfsParser.ParseRoutes(csv);

        // Assert
        var route = Assert.Single(result);
        Assert.Equal("R45", route.RouteId);
        Assert.Equal("1", route.AgencyId);
        Assert.Equal("45", route.ShortName);
        Assert.Equal("Siam - Victory Monument", route.LongName);
    }

    [Fact]
    public void ParseTrips_MapsFieldsIncludingDirectionId()
    {
        // Arrange
        const string csv = "trip_id,route_id,service_id,trip_headsign,direction_id\n" +
            "T1,R45,WEEKDAY,Siam,0\n" +
            "T2,R45,WEEKDAY,Victory Monument,1\n";

        // Act
        var result = GtfsParser.ParseTrips(csv);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(0, result[0].DirectionId);
        Assert.Equal("Siam", result[0].TripHeadsign);
        Assert.Equal(1, result[1].DirectionId);
    }

    [Fact]
    public void ParseStops_UsesStopNameEnWhenPresent_OtherwiseFallsBackToStopName()
    {
        // Arrange
        const string csv = "stop_id,stop_code,stop_name,stop_name_en,stop_lat,stop_lon\n" +
            "S1,1001,สยาม,Siam,13.745,100.534\n" +
            "S2,,สีลม,,13.729,100.539\n";

        // Act
        var result = GtfsParser.ParseStops(csv);

        // Assert
        Assert.Equal("สยาม", result[0].NameTh);
        Assert.Equal("Siam", result[0].NameEn);
        Assert.Equal("1001", result[0].StopCode);
        Assert.Equal(13.745m, result[0].Latitude);

        Assert.Equal("สีลม", result[1].NameTh);
        Assert.Equal("สีลม", result[1].NameEn); // falls back to stop_name
        Assert.Null(result[1].StopCode);
    }

    [Fact]
    public void ParseStopTimes_PastMidnightTime_DoesNotWrapOrThrow()
    {
        // Arrange — GTFS times can exceed 24:00:00 for trips continuing past midnight.
        const string csv = "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n" +
            "T1,25:30:00,25:31:00,S1,1\n";

        // Act
        var result = GtfsParser.ParseStopTimes(csv);

        // Assert
        var stopTime = Assert.Single(result);
        Assert.Equal(TimeSpan.FromHours(25) + TimeSpan.FromMinutes(30), stopTime.ArrivalTime);
        Assert.Equal(TimeSpan.FromHours(25) + TimeSpan.FromMinutes(31), stopTime.DepartureTime);
    }

    [Fact]
    public void ParseStopTimes_MalformedTime_SkipsRowRatherThanThrowing()
    {
        // Arrange
        const string csv = "trip_id,arrival_time,departure_time,stop_id,stop_sequence\n" +
            "T1,not-a-time,08:00:00,S1,1\n" +
            "T1,08:05:00,08:06:00,S2,2\n";

        // Act
        var result = GtfsParser.ParseStopTimes(csv);

        // Assert
        var stopTime = Assert.Single(result);
        Assert.Equal("S2", stopTime.StopId);
    }

    [Fact]
    public void ParseCalendars_MapsDayFlagsAndDateRange()
    {
        // Arrange
        const string csv = "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n" +
            "WEEKDAY,1,1,1,1,1,0,0,20260101,20261231\n";

        // Act
        var result = GtfsParser.ParseCalendars(csv);

        // Assert
        var calendar = Assert.Single(result);
        Assert.True(calendar.Monday);
        Assert.False(calendar.Saturday);
        Assert.Equal(new DateOnly(2026, 1, 1), calendar.StartDate);
        Assert.Equal(new DateOnly(2026, 12, 31), calendar.EndDate);
    }

    [Fact]
    public void ParseCalendarDates_MapsExceptionType()
    {
        // Arrange
        const string csv = "service_id,date,exception_type\n" +
            "WEEKDAY,20260401,2\n";

        // Act
        var result = GtfsParser.ParseCalendarDates(csv);

        // Assert
        var exception = Assert.Single(result);
        Assert.Equal(new DateOnly(2026, 4, 1), exception.Date);
        Assert.Equal(2, exception.ExceptionType);
    }
}
