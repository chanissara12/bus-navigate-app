namespace BusNavigate.Domain.Entities;

// Manual, human-curated table (T07) — no automatic status feed exists for Namtang
// GTFS. Someone enters a record when they learn of a disruption; nothing here is
// ingested by the GTFS import job.
public class TransitAlert
{
    public int Id { get; set; }

    // Set when the alert applies to the whole route; null when it's direction-specific.
    public int? BusRouteId { get; set; }

    public BusRoute? BusRoute { get; set; }

    // Set when the alert applies to only one direction (e.g. a one-way diversion).
    public int? DirectionId { get; set; }

    public Direction? Direction { get; set; }

    public TransitAlertStatus Status { get; set; }

    public string? Description { get; set; }

    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
