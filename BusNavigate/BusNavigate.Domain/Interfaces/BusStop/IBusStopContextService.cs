using BusNavigate.Domain.ViewModels.BusStop;

namespace BusNavigate.Domain.Interfaces.BusStop;

public interface IBusStopContextService
{
    Task<BusStopContextResult> GetContextAsync(int busStopId, CancellationToken cancellationToken = default);
}
