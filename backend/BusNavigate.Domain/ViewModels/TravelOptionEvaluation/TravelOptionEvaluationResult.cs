namespace BusNavigate.Domain.ViewModels.TravelOptionEvaluation;

// Shape matches T09's planned POST /travel-options/compare response:
// { accepted, option?, reasons }. The `option` field isn't included here — TravelOption
// itself isn't computed by this ticket (T05 is a 1-to-1 accept/reject check against an
// already-confirmed plan, not a fresh search) and stays out of scope until trip-planning
// search is implemented.
public record TravelOptionEvaluationResult(bool Accepted, IReadOnlyList<EvaluationReason> Reasons);
