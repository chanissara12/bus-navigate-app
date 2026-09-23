namespace BusNavigate.Domain.Entities;

// Note: no Phase 1 curation mechanism populates this beyond Unknown (see T03) —
// which stop to board at is fully determined by Direction membership, not RoadSide.
public enum RoadSide
{
    Unknown = 0,
    Near = 1,
    Far = 2,
}
