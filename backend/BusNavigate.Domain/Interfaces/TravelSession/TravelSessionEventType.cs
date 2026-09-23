namespace BusNavigate.Domain.Interfaces.TravelSession;

// Mirrors T09's planned POST /travel-sessions/{id}/events body: { "type": ... }.
// Not persisted — a request-shaped value the service validates against T04's
// transition table.
public enum TravelSessionEventType
{
    StartedWalking,
    ArrivedAtStop,
    Boarded,
    ReportedWrongBus,
    Alighted,
    ReachedDestination,
}
