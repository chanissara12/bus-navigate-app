using BusNavigate.Domain.Interfaces.TravelSession;

namespace BusNavigate.Server.Services;

// Sweeps for stalled TravelSessions (no activity for 2 hours) and abandons them —
// matches T04's stall-handling decision. Runs on a short interval since a stalled
// session should be swept promptly, unlike the weekly GTFS import.
public class TravelSessionStallSweepBackgroundService : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(15);

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TravelSessionStallSweepBackgroundService> _logger;

    public TravelSessionStallSweepBackgroundService(
        IServiceProvider serviceProvider, ILogger<TravelSessionStallSweepBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(SweepInterval);

        do
        {
            using var scope = _serviceProvider.CreateScope();
            var travelSessionService = scope.ServiceProvider.GetRequiredService<ITravelSessionService>();

            try
            {
                var abandonedCount = await travelSessionService.AbandonStaleSessionsAsync(stoppingToken);
                if (abandonedCount > 0)
                {
                    _logger.LogInformation("Abandoned {Count} stalled travel session(s)", abandonedCount);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Travel session stall sweep failed");
            }
        }
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken));
    }
}
