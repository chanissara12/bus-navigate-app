using BusNavigate.Domain.Database;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Interfaces.TravelSession;
using Microsoft.EntityFrameworkCore;
using TravelSessionEntity = BusNavigate.Domain.Entities.TravelSession;
using TravelSessionState = BusNavigate.Domain.Entities.TravelSessionState;

namespace BusNavigate.Service.Implements.TravelSession;

public class TravelSessionService(BusNavigateDbContext dbContext) : ITravelSessionService
{
    // Terminal states never accept a further event or get swept into ABANDONED again.
    private static readonly HashSet<TravelSessionState> TerminalStates =
    [
        TravelSessionState.Completed,
        TravelSessionState.Abandoned,
    ];

    private static readonly TimeSpan StallThreshold = TimeSpan.FromHours(2);

    // T04's state transition table. MISBOARDED has no outgoing transition here —
    // recovery follow-through is T06's concern, not yet implemented.
    // Note: T04 also allows ALIGHTED -> COMPLETED to fire automatically "if ALIGHTED
    // stop == Destination", as an alternative to the explicit user action below. Not
    // implemented yet — TravelSession has no separate Destination concept from
    // AlightingStopId (no transfer/multi-leg modeling exists), so "alighted at the
    // final destination" vs. "alighted at a transfer point" can't be distinguished
    // without a design decision that's out of this ticket's scope. The explicit
    // ReachedDestination action (required by the ticket regardless) covers every case.
    private static readonly Dictionary<(TravelSessionState From, TravelSessionEventType Event), TravelSessionState> Transitions =
        new()
        {
            [(TravelSessionState.Planned, TravelSessionEventType.StartedWalking)] = TravelSessionState.WalkingToStop,
            [(TravelSessionState.WalkingToStop, TravelSessionEventType.ArrivedAtStop)] = TravelSessionState.Waiting,
            [(TravelSessionState.Waiting, TravelSessionEventType.Boarded)] = TravelSessionState.Riding,
            [(TravelSessionState.Waiting, TravelSessionEventType.ReportedWrongBus)] = TravelSessionState.Misboarded,
            [(TravelSessionState.Riding, TravelSessionEventType.ReportedWrongBus)] = TravelSessionState.Misboarded,
            [(TravelSessionState.Riding, TravelSessionEventType.Alighted)] = TravelSessionState.Alighted,
            [(TravelSessionState.Alighted, TravelSessionEventType.ReachedDestination)] = TravelSessionState.Completed,
        };

    public async Task<TravelSessionEntity> CreateAsync(
        int userId, int directionId, int boardingStopId, int alightingStopId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var session = new TravelSessionEntity
        {
            UserId = userId,
            DirectionId = directionId,
            BoardingStopId = boardingStopId,
            AlightingStopId = alightingStopId,
            State = TravelSessionState.Planned,
            CreatedAt = now,
            LastActivityAt = now,
        };

        dbContext.TravelSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task<TravelSessionEntity> ApplyEventAsync(
        int travelSessionId, TravelSessionEventType eventType, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.TravelSessions.FirstOrDefaultAsync(s => s.Id == travelSessionId, cancellationToken)
            ?? throw new ValidateException($"Travel session {travelSessionId} was not found.");

        if (!Transitions.TryGetValue((session.State, eventType), out var nextState))
        {
            throw new ValidateException($"Cannot apply event '{eventType}' to a session in state '{session.State}'.");
        }

        session.State = nextState;
        session.LastActivityAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task<int> AbandonStaleSessionsAsync(CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow - StallThreshold;

        var staleSessions = await dbContext.TravelSessions
            .Where(s => !TerminalStates.Contains(s.State) && s.LastActivityAt < cutoff)
            .ToListAsync(cancellationToken);

        foreach (var session in staleSessions)
        {
            session.State = TravelSessionState.Abandoned;
        }

        if (staleSessions.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return staleSessions.Count;
    }
}
