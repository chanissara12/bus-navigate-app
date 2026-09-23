namespace BusNavigate.Domain.Entities;

// Generic named location per CONTEXT.md, scoped down for Phase 1 to just what T06
// needs: BTS/MRT stations sourced from OSM railway=station tags, carrying no
// route/schedule data (Namtang GTFS covers bus only, not rail — see T06). No FK from
// any bus-side entity; only ever surfaced as an unconfirmed recovery pointer.
public class Place
{
    public int Id { get; set; }

    public string ExternalId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public PlaceType PlaceType { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public string DataSource { get; set; } = string.Empty;
}
