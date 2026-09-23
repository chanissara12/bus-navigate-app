namespace BusNavigate.Domain.Entities;

// Covers PROPOSAL.md section 15's walking-guidance warning list. Landmark is the
// generic catch-all — anything from OSM that doesn't map cleanly to a more specific
// value still gets a row (with Description carrying the free-text detail), never
// silently dropped for not fitting the enum.
public enum LandmarkType
{
    Crossing,
    Skywalk,
    MallEntrance,
    Landmark,
    TransitStationPointer,
}
