using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Interfaces.Recovery;
using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;

namespace BusNavigate.Domain.ViewModels.Recovery;

// A TravelOption-shaped candidate anchored at a RecoveryPoint rather than the user's
// original boarding stop (CONTEXT.md). DistanceMeters is the straight-line walk from
// the user's reported CurrentLocation to this option's boarding point — 0 for the
// "continue on current bus" candidate, which needs no walk at all. Reasons is empty
// for UnconfirmedRailPointer kind — no computed itinerary exists for it (T06).
public record RecoveryOption(
    RecoveryOptionKind Kind,
    string Label,
    double DistanceMeters,
    DataConfidence DataConfidence,
    IReadOnlyList<EvaluationReason> Reasons
);
