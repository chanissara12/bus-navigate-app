using BusNavigate.Domain.Interfaces.TravelSession;

namespace BusNavigate.Server.Services;

// Sweeps for stalled TravelSessions (no activity for 2 hours) and abandons them —
// matches T04's stall-handling decision. Runs on a short interval since a stalled
// session should be swept promptly, unlike the weekly GTFS import.
public class TravelSessionStallSweepBackgroundService(
    IServiceProvider serviceProvider, ILogger<TravelSessionStallSweepBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(SweepInterval);

        do
        {
            using var scope = serviceProvider.CreateScope();
            var travelSessionService = scope.ServiceProvider.GetRequiredService<ITravelSessionService>();

            try
            {
                var abandonedCount = await travelSessionService.AbandonStaleSessionsAsync(stoppingToken);
                if (abandonedCount > 0)
                {
                    logger.LogInformation("Abandoned {Count} stalled travel session(s)", abandonedCount);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Travel session stall sweep failed");
            }
        }
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken));
    }
}
