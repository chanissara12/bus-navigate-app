using BusNavigate.Domain.Entities;

namespace BusNavigate.Domain.ViewModels.TravelSession;

// Get-off assistance (T04/T09) is a computed value, not its own state. RemainingStopCount
// is derived from the caller-reported currentStopSequence (T09 has no live GPS-to-stop
// matching mechanism yet — the client reports which RouteStop it believes it's at), so
// DataConfidence is Estimated, never Scheduled/Realtime. No ETA field — that needs live
// Trip-schedule matching, a separate feature not built yet (same gap T11 flagged for
// TravelOption's EstimatedDuration).
public record TravelSessionProgress(int RemainingStopCount, bool IsApproachingDestination, DataConfidence DataConfidence);
