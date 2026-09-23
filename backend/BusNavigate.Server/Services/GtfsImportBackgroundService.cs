using BusNavigate.Domain.Interfaces.GtfsImport;

namespace BusNavigate.Server.Services;

// Runs the GTFS import once at startup, then weekly — matches T03's "scheduled
// recurring background job, not a one-time seed" decision. Uses a scoped
// IGtfsImportService per run since DbContext is request/scope-bound.
public class GtfsImportBackgroundService(
    IServiceProvider serviceProvider, ILogger<GtfsImportBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan ImportInterval = TimeSpan.FromDays(7);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(ImportInterval);

        await RunImportAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunImportAsync(stoppingToken);
        }
    }

    private async Task RunImportAsync(CancellationToken cancellationToken)
    {
        using var scope = serviceProvider.CreateScope();
        var importService = scope.ServiceProvider.GetRequiredService<IGtfsImportService>();

        try
        {
            await importService.ImportAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "GTFS import run failed");
        }
    }
}
