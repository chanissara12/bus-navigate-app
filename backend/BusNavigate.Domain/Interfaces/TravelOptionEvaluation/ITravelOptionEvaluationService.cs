using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;

namespace BusNavigate.Domain.Interfaces.TravelOptionEvaluation;

// Shared by trip-planning and recovery (T10: "recovery needs the exact same comparison
// algorithm as trip-planning... extracted into its own shared service, neither owns
// the other") — not nested under either feature's folder.
public interface ITravelOptionEvaluationService
{
    // 1-to-1 check of one candidate Direction against an already-confirmed
    // TravelSession's plan — not a fresh alternatives search (T05's scope).
    Task<TravelOptionEvaluationResult> EvaluateAsync(
        int travelSessionId, int candidateDirectionId, CancellationToken cancellationToken = default);
}
