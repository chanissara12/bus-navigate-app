namespace BusNavigate.Domain.Entities;

// Only RailStation is needed for Phase 1 (T06's BTS/MRT recovery pointers) — Place is
// a broader CONTEXT.md concept (destination search results, landmarks) that Phase 1
// hasn't built out yet; extend this enum when those land instead of designing it
// exhaustively upfront.
public enum PlaceType
{
    RailStation = 0,
}
