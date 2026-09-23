namespace BusNavigate.Service.Implements.GtfsImport;

// Parsed GTFS rows, one record type per source file. Internal to the import pipeline —
// GtfsParser produces these, GtfsImportService maps them onto Domain entities.
public record GtfsAgency(string AgencyId, string AgencyName);

public record GtfsRoute(string RouteId, string ShortName, string LongName, string AgencyId);

public record GtfsTrip(string TripId, string RouteId, string ServiceId, int DirectionId, string TripHeadsign);

// Note: standard GTFS stops.txt only has one stop_name column. Namtang's feed is
// documented (T03) as providing both Thai and English names — this parser reads
// stop_name as the Thai name and an optional stop_name_en/stop_desc column as the
// English name (falling back to stop_name if neither is present). Unverified against
// the live feed (no network access in this session) — revisit once the real feed is
// available.
public record GtfsStop(string StopId, string NameTh, string NameEn, string? StopCode, decimal Latitude, decimal Longitude);

public record GtfsStopTime(string TripId, string StopId, TimeSpan ArrivalTime, TimeSpan DepartureTime, int StopSequence);

public record GtfsCalendar(
    string ServiceId,
    bool Monday,
    bool Tuesday,
    bool Wednesday,
    bool Thursday,
    bool Friday,
    bool Saturday,
    bool Sunday,
    DateOnly StartDate,
    DateOnly EndDate
);

public record GtfsCalendarDate(string ServiceId, DateOnly Date, int ExceptionType);
