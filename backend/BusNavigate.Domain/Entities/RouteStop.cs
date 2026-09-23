namespace BusNavigate.Domain.Entities;

// The canonical, superset ordered stop list for a Direction — the union of all stops
// any trip in that Direction visits, in sequence order. Individual Trips reference a
// subset via TripStopTime.
public class RouteStop
{
    public int Id { get; set; }

    public int DirectionId { get; set; }

    public Direction Direction { get; set; } = null!;

    public int BusStopId { get; set; }

    public BusStop BusStop { get; set; } = null!;

    public int SequenceNumber { get; set; }

    public ICollection<TripStopTime> TripStopTimes { get; set; } = [];
}
