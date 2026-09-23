namespace BusNavigate.Domain.ViewModels.Recovery;

// RecommendedOptions empty means "no recommendable option within normal criteria"
// (T06) — the frontend renders that message itself; the backend just returns an
// empty list rather than a special sentinel. LastResortOptions are candidates that
// failed T05's gates, surfaced separately and never silently promoted into
// RecommendedOptions (T06: "never silently loosening the thresholds").
public record RecoveryOptionsResult(
    IReadOnlyList<RecoveryOption> RecommendedOptions,
    IReadOnlyList<RecoveryOption> LastResortOptions,
    IReadOnlyList<RecoveryOption> UnconfirmedRailPointers
);
