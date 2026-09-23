namespace BusNavigate.Domain.Interfaces.TravelOptionEvaluation;

// Structured factor codes per T05's map-notes decision — frontend owns
// localization/rendering, backend only ever emits a code (+ an optional numeric
// value). Extendable later as new cases surface; not designed exhaustively upfront.
// FasterBy/SlowerBy are declared but never emitted yet — they need matching a
// specific arriving Trip's schedule ("which trip is this"), which isn't modeled
// without live-vehicle or trip-selection data (see TravelOptionEvaluationService).
public enum ReasonCode
{
    ReachesDestination,
    DoesNotReachDestination,
    FasterBy,
    SlowerBy,
    NoTransfer,
    ExtraTransferCount,
    ExtraWalkDistance,
    WithinWalkBudget,
    ExceedsWalkBudget,
}
