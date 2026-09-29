namespace BusNavigate.Domain.Interfaces.TripPlanning;

// Search results and travel-option requests need to reference either a BusStop or a
// Place (rail station) by id — this tags which table the id resolves against, since
// there is no single unified "Place" table in Phase 1's schema (see T11).
public enum PlaceKind
{
    BusStop,
    Place,
}
