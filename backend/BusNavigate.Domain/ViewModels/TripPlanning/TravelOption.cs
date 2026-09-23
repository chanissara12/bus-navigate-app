using BusNavigate.Domain.Entities;
using BusNavigate.Domain.ViewModels.ServiceStatus;
using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;

namespace BusNavigate.Domain.ViewModels.TripPlanning;

// Direct-connections only in Phase 1 (T11) — no TransferStops/TransferCount field
// beyond a fixed 0, since a non-zero value is never possible yet (no multi-leg search).
// EstimatedDuration/WaitingTime are omitted entirely, not sent as null — both need
// live Trip-schedule matching against "now," a separate feature not built yet (T11).
public record TravelOption(
    int DirectionId,
    string RouteShortName,
    string Headsign,
    int BoardingStopId,
    string BoardingStopNameTh,
    string BoardingStopNameEn,
    int AlightingStopId,
    string AlightingStopNameTh,
    string AlightingStopNameEn,
    double WalkingDistanceMeters,
    DataConfidence DataConfidence,
    ServiceStatusResult ServiceStatus,
    IReadOnlyList<EvaluationReason> Reasons
);
