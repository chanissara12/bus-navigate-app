namespace BusNavigate.Domain.Entities;

// Kept coarse: one row per (route_id, direction_id), not per stop-pattern variant.
// A short-turn/express trip is a Trip with fewer TripStopTime rows, not its own Direction.
public class Direction
{
    public int Id { get; set; }

    public int BusRouteId { get; set; }

    public BusRoute BusRoute { get; set; } = null!;

    public string ExternalDirectionKey { get; set; } = string.Empty;

    public int DirectionIndex { get; set; }

    public string Headsign { get; set; } = string.Empty;

    public ICollection<RouteStop> RouteStops { get; set; } = [];

    public ICollection<Trip> Trips { get; set; } = [];
}
