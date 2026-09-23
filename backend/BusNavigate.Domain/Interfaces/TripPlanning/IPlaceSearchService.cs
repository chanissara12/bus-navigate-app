using BusNavigate.Domain.ViewModels.TripPlanning;

namespace BusNavigate.Domain.Interfaces.TripPlanning;

public interface IPlaceSearchService
{
    // Restricted to transit-dataset names — no external geocoding (map Notes' standing
    // decision). Capped at 20 results (T09); an empty/no-match query returns an empty
    // list, never an error.
    Task<IReadOnlyList<PlaceSearchResult>> SearchAsync(string query, CancellationToken cancellationToken = default);
}
