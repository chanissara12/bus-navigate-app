namespace BusNavigate.Domain.Interfaces.BusStop;

// Runs on the same weekly job as the GTFS sync (T08: "not a separate schedule").
public interface IStopLandmarkSyncService
{
    Task SyncAsync(CancellationToken cancellationToken = default);
}
