namespace BusNavigate.Domain.ViewModels.Recovery;

// T09's POST /travel-sessions/{id}/recovery body. CurrentDirectionId is CONTEXT.md's
// CurrentRoute — null when the user doesn't know/report which bus they're on.
public record RecoveryRequest(decimal CurrentLatitude, decimal CurrentLongitude, int? CurrentDirectionId);
