using BusNavigate.Domain.ViewModels.TripPlanning;

namespace BusNavigate.Domain.Interfaces.TripPlanning;

// Initial trip-planning search (T11) — direct-connections only, no transfer search.
// Distinct from ITravelOptionEvaluationService (T05), which checks one already-known
// candidate against an existing TravelSession; this searches from scratch, before any
// TravelSession exists.
public interface ITravelOptionSearchService
{
    // userId is optional (03) — a missing device identity just means the results come
    // back unreordered, same as a rider who has no UserPreference saved yet.
    Task<IReadOnlyList<TravelOption>> SearchAsync(
        decimal currentLatitude, decimal currentLongitude, int destinationPlaceId, PlaceKind destinationType,
        int? userId = null, CancellationToken cancellationToken = default);
}
