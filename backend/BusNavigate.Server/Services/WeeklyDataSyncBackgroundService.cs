using BusNavigate.Domain.Interfaces.BusStop;
using BusNavigate.Domain.Interfaces.GtfsImport;

namespace BusNavigate.Server.Services;

// Runs the GTFS import, then the stop-landmark sync, once at startup and then
// weekly — matches T03's "scheduled recurring background job" decision and T08's
// "same weekly job as the GTFS sync, not a separate schedule" decision. Landmark
// sync runs second since it associates landmarks with BusStops the GTFS import just
// created/updated. Uses scoped services per run since DbContext is scope-bound.
public class WeeklyDataSyncBackgroundService : BackgroundService
{
    private static readonly TimeSpan SyncInterval = TimeSpan.FromDays(7);

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WeeklyDataSyncBackgroundService> _logger;

    public WeeklyDataSyncBackgroundService(
        IServiceProvider serviceProvider, ILogger<WeeklyDataSyncBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(SyncInterval);

        await RunSyncAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunSyncAsync(stoppingToken);
        }
    }

    private async Task RunSyncAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();

        try
        {
            await scope.ServiceProvider.GetRequiredService<IGtfsImportService>().ImportAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "GTFS import run failed");
        }

        try
        {
            await scope.ServiceProvider.GetRequiredService<IStopLandmarkSyncService>().SyncAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Stop landmark sync run failed");
        }
    }
}
