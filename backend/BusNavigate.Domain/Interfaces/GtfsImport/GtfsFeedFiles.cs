namespace BusNavigate.Domain.Interfaces.GtfsImport;

// Raw text contents of the GTFS files this import needs, as returned by
// IGtfsFeedFetcher. Kept in Domain since both the fetcher (Service) and any future
// consumer share this shape.
public record GtfsFeedFiles(
    string Agency,
    string Routes,
    string Trips,
    string Stops,
    string StopTimes,
    string Calendar,
    string CalendarDates
);
