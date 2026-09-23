using System.Globalization;

namespace BusNavigate.Service.Implements.GtfsImport;

// Pure parsing: takes raw GTFS CSV text, returns typed records. No I/O.
public static class GtfsParser
{
    public static List<GtfsAgency> ParseAgencies(string csvText)
    {
        var table = CsvTable.Parse(csvText);
        var result = new List<GtfsAgency>(table.RowCount);
        for (var i = 0; i < table.RowCount; i++)
        {
            result.Add(new GtfsAgency(
                table.Get(i, "agency_id") ?? string.Empty,
                table.Get(i, "agency_name") ?? string.Empty
            ));
        }

        return result;
    }

    public static List<GtfsRoute> ParseRoutes(string csvText)
    {
        var table = CsvTable.Parse(csvText);
        var result = new List<GtfsRoute>(table.RowCount);
        for (var i = 0; i < table.RowCount; i++)
        {
            var routeId = table.Get(i, "route_id");
            if (routeId is null)
            {
                continue;
            }

            result.Add(new GtfsRoute(
                routeId,
                table.Get(i, "route_short_name") ?? string.Empty,
                table.Get(i, "route_long_name") ?? string.Empty,
                table.Get(i, "agency_id") ?? string.Empty
            ));
        }

        return result;
    }

    public static List<GtfsTrip> ParseTrips(string csvText)
    {
        var table = CsvTable.Parse(csvText);
        var result = new List<GtfsTrip>(table.RowCount);
        for (var i = 0; i < table.RowCount; i++)
        {
            var tripId = table.Get(i, "trip_id");
            var routeId = table.Get(i, "route_id");
            var serviceId = table.Get(i, "service_id");
            if (tripId is null || routeId is null || serviceId is null)
            {
                continue;
            }

            var directionId = int.TryParse(table.Get(i, "direction_id"), out var parsedDirection) ? parsedDirection : 0;

            result.Add(new GtfsTrip(
                tripId,
                routeId,
                serviceId,
                directionId,
                table.Get(i, "trip_headsign") ?? string.Empty
            ));
        }

        return result;
    }

    public static List<GtfsStop> ParseStops(string csvText)
    {
        var table = CsvTable.Parse(csvText);
        var result = new List<GtfsStop>(table.RowCount);
        for (var i = 0; i < table.RowCount; i++)
        {
            var stopId = table.Get(i, "stop_id");
            if (stopId is null)
            {
                continue;
            }

            var nameTh = table.Get(i, "stop_name") ?? string.Empty;
            var nameEn = table.Get(i, "stop_name_en") ?? table.Get(i, "stop_desc") ?? nameTh;

            var latitude = decimal.TryParse(table.Get(i, "stop_lat"), NumberStyles.Float, CultureInfo.InvariantCulture, out var lat) ? lat : 0m;
            var longitude = decimal.TryParse(table.Get(i, "stop_lon"), NumberStyles.Float, CultureInfo.InvariantCulture, out var lon) ? lon : 0m;

            result.Add(new GtfsStop(stopId, nameTh, nameEn, table.Get(i, "stop_code"), latitude, longitude));
        }

        return result;
    }

    public static List<GtfsStopTime> ParseStopTimes(string csvText)
    {
        var table = CsvTable.Parse(csvText);
        var result = new List<GtfsStopTime>(table.RowCount);
        for (var i = 0; i < table.RowCount; i++)
        {
            var tripId = table.Get(i, "trip_id");
            var stopId = table.Get(i, "stop_id");
            if (tripId is null || stopId is null)
            {
                continue;
            }

            if (!TryParseGtfsTime(table.Get(i, "arrival_time"), out var arrival) ||
                !TryParseGtfsTime(table.Get(i, "departure_time"), out var departure))
            {
                continue;
            }

            var stopSequence = int.TryParse(table.Get(i, "stop_sequence"), out var seq) ? seq : 0;

            result.Add(new GtfsStopTime(tripId, stopId, arrival, departure, stopSequence));
        }

        return result;
    }

    public static List<GtfsCalendar> ParseCalendars(string csvText)
    {
        var table = CsvTable.Parse(csvText);
        var result = new List<GtfsCalendar>(table.RowCount);
        for (var i = 0; i < table.RowCount; i++)
        {
            var serviceId = table.Get(i, "service_id");
            if (serviceId is null)
            {
                continue;
            }

            if (!TryParseGtfsDate(table.Get(i, "start_date"), out var startDate) ||
                !TryParseGtfsDate(table.Get(i, "end_date"), out var endDate))
            {
                continue;
            }

            result.Add(new GtfsCalendar(
                serviceId,
                IsDayServed(table, i, "monday"),
                IsDayServed(table, i, "tuesday"),
                IsDayServed(table, i, "wednesday"),
                IsDayServed(table, i, "thursday"),
                IsDayServed(table, i, "friday"),
                IsDayServed(table, i, "saturday"),
                IsDayServed(table, i, "sunday"),
                startDate,
                endDate
            ));
        }

        return result;
    }

    public static List<GtfsCalendarDate> ParseCalendarDates(string csvText)
    {
        var table = CsvTable.Parse(csvText);
        var result = new List<GtfsCalendarDate>(table.RowCount);
        for (var i = 0; i < table.RowCount; i++)
        {
            var serviceId = table.Get(i, "service_id");
            if (serviceId is null)
            {
                continue;
            }

            if (!TryParseGtfsDate(table.Get(i, "date"), out var date))
            {
                continue;
            }

            var exceptionType = int.TryParse(table.Get(i, "exception_type"), out var type) ? type : 0;

            result.Add(new GtfsCalendarDate(serviceId, date, exceptionType));
        }

        return result;
    }

    private static bool IsDayServed(CsvTable table, int rowIndex, string column) => table.Get(rowIndex, column) == "1";

    // GTFS time_of_day fields (arrival_time/departure_time) use HH:MM:SS where HH can
    // exceed 24 for service continuing past midnight. Parsed manually rather than via
    // TimeSpan.Parse/TryParseExact — both treat "hh" as a 0-23 time-of-day component
    // and reject values like "25:30:00", even though TimeSpan itself has no such limit.
    private static bool TryParseGtfsTime(string? value, out TimeSpan result)
    {
        result = default;
        if (value is null)
        {
            return false;
        }

        var parts = value.Split(':');
        if (parts.Length != 3 ||
            !int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var hours) ||
            !int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var minutes) ||
            !int.TryParse(parts[2], NumberStyles.Integer, CultureInfo.InvariantCulture, out var seconds))
        {
            return false;
        }

        result = new TimeSpan(0, hours, minutes, seconds);
        return true;
    }

    // GTFS dates are YYYYMMDD with no separators.
    private static bool TryParseGtfsDate(string? value, out DateOnly result)
    {
        result = default;
        return value is not null &&
            DateOnly.TryParseExact(value, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out result);
    }
}
