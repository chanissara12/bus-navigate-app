using BusNavigate.Domain.ViewModels.TripPlanning;

namespace BusNavigate.Domain.Interfaces.TripPlanning;

// Initial trip-planning search (T11) — direct-connections only, no transfer search.
// Distinct from ITravelOptionEvaluationService (T05), which checks one already-known
// candidate against an existing TravelSession; this searches from scratch, before any
// TravelSession exists.
public interface ITravelOptionSearchService
{
    Task<IReadOnlyList<TravelOption>> SearchAsync(
        decimal currentLatitude, decimal currentLongitude, int destinationPlaceId, PlaceKind destinationType,
        CancellationToken cancellationToken = default);
}
