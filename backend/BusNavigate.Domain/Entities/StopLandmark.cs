namespace BusNavigate.Domain.Entities;

// Officially-sourced supporting context for a BusStop (T08) — sourced from OSM only
// (no StopImage table in Phase 1: T02 found no imagery source clears the licensing
// bar). Every row is implicitly "Official" — no VerificationStatus field until a
// second (community) source exists. Attribution is one app-wide static credit line
// ("© OpenStreetMap contributors"), not stored per-record.
public class StopLandmark
{
    public int Id { get; set; }

    public int BusStopId { get; set; }

    public BusStop BusStop { get; set; } = null!;

    public LandmarkType LandmarkType { get; set; }

    public string NameTh { get; set; } = string.Empty;

    public string NameEn { get; set; } = string.Empty;

    // Free-text fallback for anything that doesn't map cleanly to LandmarkType — shown
    // as-is, never used to drive display logic.
    public string? Description { get; set; }

    public int DistanceMeters { get; set; }

    public string ExternalOsmId { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; }
}
