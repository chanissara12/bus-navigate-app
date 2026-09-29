namespace BusNavigate.Domain.Interfaces.Recovery;

public enum RecoveryOptionKind
{
    // Fully computed and confirmed — evaluated via the same ITravelOptionEvaluationService
    // (T05) used by trip-planning, per T06's "reuses T05's algorithm exactly" decision.
    BusDirection,

    // An unconfirmed pointer at a BTS/MRT station (Place) — no route/schedule data
    // exists for it in Phase 1, so it's never run through the evaluation algorithm.
    UnconfirmedRailPointer,
}
