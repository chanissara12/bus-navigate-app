namespace BusNavigate.Domain.ViewModels.TravelSession;

// T09's POST /travel-sessions/{id}/events body: { "type": "started_walking" | ... }.
// Kept as a raw string here (not the TravelSessionEventType enum directly) — the
// wire format uses snake_case ("started_walking") while the enum is PascalCase
// ("StartedWalking"); the controller maps between the two explicitly rather than via
// a JSON naming-policy converter, so an unrecognized string produces the standard
// ValidateException error shape instead of a raw deserialization failure.
// RecoverySelection is only present when Type is "confirmed_recovery" (F01).
public record TravelSessionEventRequest(string Type, ConfirmedRecoverySelection? RecoverySelection = null);
