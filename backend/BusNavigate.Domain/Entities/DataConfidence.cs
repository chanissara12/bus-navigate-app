namespace BusNavigate.Domain.Entities;

// Shared provenance label per CONTEXT.md — attached to any time-sensitive fact (ETA,
// stop identification, service status) so the UI never presents an estimate as
// verified fact. A response-shaping value, not a stored column on any entity here
// (mirrors DataConfidence's own note in T03) — declared alongside the other shared
// enums (RoadSide, ServiceExceptionType, TravelSessionState) for the same reason.
public enum DataConfidence
{
    Realtime = 0,
    Estimated = 1,
    Scheduled = 2,
    Unknown = 3,
}
