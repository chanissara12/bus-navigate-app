using BusNavigate.Domain.ViewModels.Recovery;

namespace BusNavigate.Domain.Interfaces.Recovery;

public interface IRecoveryService
{
    // Generates RecoveryOptions from a new CurrentLocation (T06) — triggered by (or
    // combined with) a "reported wrong bus" event. travelSessionId identifies the
    // session in trouble; currentDirectionId is CONTEXT.md's CurrentRoute — the
    // Direction the user reports actually being on right now, which is NOT the same
    // as travelSessionId's own (originally planned) DirectionId in the exact
    // wrong-bus scenario this ticket exists for. Null when the user doesn't know/
    // report which bus they're on (e.g. missed it entirely) — "continue on current
    // bus" is then simply not offered as a candidate, per T06 ("not special-cased,
    // just one more candidate").
    Task<RecoveryOptionsResult> GenerateRecoveryOptionsAsync(
        int travelSessionId, int? currentDirectionId, decimal currentLatitude, decimal currentLongitude,
        CancellationToken cancellationToken = default);
}
