using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;

namespace BusNavigate.Domain.ViewModels.TravelOptionEvaluation;

// Value carries the reason's associated number where the code needs one (+minutes,
// +count, +meters per T05) — null for codes that are self-explanatory (e.g. NoTransfer).
public record EvaluationReason(ReasonCode Code, decimal? Value = null);
