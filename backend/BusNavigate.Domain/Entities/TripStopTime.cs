namespace BusNavigate.Domain.Entities;

// Join entity carrying actual per-trip times; separate from RouteStop (which only
// holds canonical order, not times). ArrivalTime/DepartureTime use TimeSpan rather
// than TimeOnly because GTFS times can exceed 24:00:00 for trips past midnight —
// TimeOnly wraps at 24h and would silently corrupt such trips.
public class TripStopTime
{
    public int Id { get; set; }

    public int TripId { get; set; }

    public Trip Trip { get; set; } = null!;

    public int RouteStopId { get; set; }

    public RouteStop RouteStop { get; set; } = null!;

    public TimeSpan ArrivalTime { get; set; }

    public TimeSpan DepartureTime { get; set; }
}
