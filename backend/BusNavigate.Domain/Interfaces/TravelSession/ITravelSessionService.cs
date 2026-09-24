using BusNavigate.Domain.ViewModels.TravelSession;
using TravelSessionEntity = BusNavigate.Domain.Entities.TravelSession;

namespace BusNavigate.Domain.Interfaces.TravelSession;

public interface ITravelSessionService
{
    // Creates a session in PLANNED state for a confirmed plan (T09: POST /travel-sessions).
    Task<TravelSessionEntity> CreateAsync(
        int userId, int directionId, int boardingStopId, int alightingStopId, CancellationToken cancellationToken = default);

    // Applies one state-machine event (T09: POST /travel-sessions/{id}/events). Throws
    // ValidateException if the event isn't a valid transition from the session's current state.
    // recoverySelection is required for, and only meaningful with, ConfirmedRecovery (F01).
    Task<TravelSessionEntity> ApplyEventAsync(
        int travelSessionId, TravelSessionEventType eventType, ConfirmedRecoverySelection? recoverySelection = null,
        CancellationToken cancellationToken = default);

    // Stall sweep: transitions any non-terminal session with no activity in the last 2
    // hours to ABANDONED. Returns the number of sessions abandoned.
    Task<int> AbandonStaleSessionsAsync(CancellationToken cancellationToken = default);

    // Get-off assistance polling (T09: GET /travel-sessions/{id}/progress) — valid only
    // while RIDING. currentStopSequence is the RouteStop.SequenceNumber the client
    // reports being at right now (no live GPS-to-stop matching exists yet); omitted
    // means "just boarded," i.e. still at the boarding stop.
    Task<TravelSessionProgress> GetProgressAsync(
        int travelSessionId, int? currentStopSequence, CancellationToken cancellationToken = default);
}
