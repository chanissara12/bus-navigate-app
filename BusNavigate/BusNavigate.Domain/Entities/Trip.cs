namespace BusNavigate.Domain.Entities;

// Pure immutable schedule identity — carries no live position and no delay/deviation
// data in Phase 1.
public class Trip
{
    public int Id { get; set; }

    public int DirectionId { get; set; }

    public Direction Direction { get; set; } = null!;

    public int ServiceCalendarId { get; set; }

    public ServiceCalendar ServiceCalendar { get; set; } = null!;

    public string ExternalTripId { get; set; } = string.Empty;

    public ICollection<TripStopTime> TripStopTimes { get; set; } = [];
}
