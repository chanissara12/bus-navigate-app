using BusNavigate.Domain.ViewModels.ServiceStatus;

namespace BusNavigate.Domain.Interfaces.ServiceStatus;

// Cross-cutting — consumed by every feature, not owned by any one of them (T10's map
// Notes: "TransitAlert/service-status is cross-cutting... not its own feature module").
public interface IServiceStatusService
{
    Task<ServiceStatusResult> GetStatusAsync(
        int busRouteId, int? directionId, CancellationToken cancellationToken = default);
}
