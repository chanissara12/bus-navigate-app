using BusNavigate.Domain.ViewModels.BusStop;

namespace BusNavigate.Domain.Interfaces.BusStop;

// Current-stop identification (T09: GET /bus-stops/nearby) — kept separate from
// IBusStopContextService (one stop's own detail) since this searches across many.
public interface INearbyBusStopSearchService
{
    Task<IReadOnlyList<BusStopSummary>> FindNearbyAsync(
        decimal latitude, decimal longitude, double radiusMeters, CancellationToken cancellationToken = default);
}
