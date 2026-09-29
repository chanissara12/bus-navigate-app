namespace BusNavigate.Domain.Constants;

// T05's resolution — shared by TravelOptionEvaluation and reused as-is (no relaxed
// thresholds) by T06's wrong-bus recovery, per T06's "same 800m walk budget, not a
// separate constant" decision. Kept as one source of truth for both.
public static class TravelOptionEvaluationConstants
{
    public const double WalkBudgetMeters = 800;

    // Standard approximation for irregular urban street grids, given Phase 1 has no
    // turn-by-turn WalkingRoute/routing graph.
    public const double WalkingDetourFactor = 1.3;

    public const double WalkingSpeedKmh = 5;
}
