using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;
using UserPreferenceEntity = BusNavigate.Domain.Entities.UserPreference;

namespace BusNavigate.Domain.Interfaces.PreferenceRanking;

// Shared by trip-planning (03) and recovery (04) — reorders an already-generated list
// of candidates by a rider's UserPreference, never removing one (spec.md). TravelOption
// and RecoveryOption don't share a base type, so callers supply small accessor and
// reconstructor delegates instead of this service depending on either concrete type.
public interface IPreferenceRankingService
{
    // getTransferCount/getBoardingStopId/getAlightingStopId/getReasons read a candidate's
    // current figures; withReasons returns a copy of a candidate with its Reasons list
    // replaced (records are immutable) — used only when a preference actually matched,
    // and always appends to the existing reasons, never replaces them.
    Task<IReadOnlyList<T>> RankAsync<T>(
        IReadOnlyList<T> candidates,
        UserPreferenceEntity preference,
        Func<T, double> getWalkingDistanceMeters,
        Func<T, int> getTransferCount,
        Func<T, int?> getBoardingStopId,
        Func<T, int?> getAlightingStopId,
        Func<T, IReadOnlyList<EvaluationReason>> getReasons,
        Func<T, IReadOnlyList<EvaluationReason>, T> withReasons,
        CancellationToken cancellationToken = default);
}
