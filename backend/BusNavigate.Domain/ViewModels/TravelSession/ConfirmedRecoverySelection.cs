namespace BusNavigate.Domain.ViewModels.TravelSession;

// The identifying fields of one RecoveryOption (F01) — carried by a ConfirmedRecovery
// event so the backend knows which candidate the user picked. DirectionId/
// BoardingStopId are null for an UnconfirmedRailPointer option (it has none) and for
// IsCurrentBus (nothing about the route changes, so there's nothing to identify).
public record ConfirmedRecoverySelection(int? DirectionId, int? BoardingStopId, bool IsCurrentBus);
