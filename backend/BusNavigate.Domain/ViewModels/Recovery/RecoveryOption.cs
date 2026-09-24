using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Interfaces.Recovery;
using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;

namespace BusNavigate.Domain.ViewModels.Recovery;

// A TravelOption-shaped candidate anchored at a RecoveryPoint rather than the user's
// original boarding stop (CONTEXT.md). DistanceMeters is the straight-line walk from
// the user's reported CurrentLocation to this option's boarding point — 0 for the
// "continue on current bus" candidate, which needs no walk at all. Reasons is empty
// for UnconfirmedRailPointer kind — no computed itinerary exists for it (T06).
// DirectionId/BoardingStopId/IsCurrentBus (F01) identify the option for a later
// ConfirmedRecovery event — populated only for Kind = BusDirection. BoardingStopId is
// null when IsCurrentBus is true: that candidate is supplied directly as the user's
// current Direction, not discovered via a nearby-stop search, so it has none.
public record RecoveryOption(
    RecoveryOptionKind Kind,
    string Label,
    double DistanceMeters,
    DataConfidence DataConfidence,
    IReadOnlyList<EvaluationReason> Reasons,
    int? DirectionId = null,
    int? BoardingStopId = null,
    bool IsCurrentBus = false
);
