using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Interfaces.TravelSession;
using BusNavigate.Domain.ViewModels.TravelSession;
using Microsoft.EntityFrameworkCore;
using TravelSessionEntity = BusNavigate.Domain.Entities.TravelSession;
using TravelSessionState = BusNavigate.Domain.Entities.TravelSessionState;

namespace BusNavigate.Service.Implements.TravelSession;

public class TravelSessionService : ITravelSessionService
{
    private readonly BusNavigateDbContext _dbContext;

    public TravelSessionService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

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
        int userId, int directionId, int boardingStopId, int alightingStopId, double walkingDistanceMeters,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var nextId = (await _dbContext.TravelSessions
            .MaxAsync(s => (int?)s.Id, cancellationToken) ?? 0) + 1;

        var session = new TravelSessionEntity
        {
            Id = nextId,
            UserId = userId,
            DirectionId = directionId,
            BoardingStopId = boardingStopId,
            AlightingStopId = alightingStopId,
            WalkingDistanceMeters = walkingDistanceMeters,
            State = TravelSessionState.Planned,
            CreatedAt = now,
            LastActivityAt = now,
        };

        _dbContext.TravelSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _dbContext.TravelSessions
            .Include(s => s.AlightingStop)
            .FirstAsync(s => s.Id == session.Id, cancellationToken);
    }

    public async Task<TravelSessionEntity> GetAsync(
        int travelSessionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.TravelSessions
            .Include(s => s.AlightingStop)
            .FirstOrDefaultAsync(s => s.Id == travelSessionId, cancellationToken)
            ?? throw new ValidateException($"Travel session {travelSessionId} was not found.");
    }

    public async Task<TravelSessionEntity> ApplyEventAsync(
        int travelSessionId, TravelSessionEventType eventType, ConfirmedRecoverySelection? recoverySelection = null,
        CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.TravelSessions
            .Include(s => s.AlightingStop)
            .FirstOrDefaultAsync(s => s.Id == travelSessionId, cancellationToken)
            ?? throw new ValidateException($"Travel session {travelSessionId} was not found.");

        if (eventType == TravelSessionEventType.ConfirmedRecovery)
        {
            ApplyConfirmedRecovery(session, recoverySelection);
        }
        else if (Transitions.TryGetValue((session.State, eventType), out var nextState))
        {
            session.State = nextState;
        }
        else
        {
            throw new ValidateException($"Cannot apply event '{eventType}' to a session in state '{session.State}'.");
        }

        session.LastActivityAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return session;
    }

    // ConfirmedRecovery's target state depends on the confirmed RecoveryOption
    // (F01), not a fixed (State, Event) -> State lookup, so it's handled separately
    // from Transitions. A BusDirection option with IsCurrentBus false is a genuine
    // route change (walk to a new stop); IsCurrentBus true means nothing about the
    // route changed, so the session goes straight back to RIDING. An
    // UnconfirmedRailPointer option has no DirectionId/BoardingStopId to send, so it
    // is rejected the same way a malformed selection is.
    private static void ApplyConfirmedRecovery(TravelSessionEntity session, ConfirmedRecoverySelection? selection)
    {
        if (session.State != TravelSessionState.Misboarded)
        {
            throw new ValidateException(
                $"Cannot apply event 'ConfirmedRecovery' to a session in state '{session.State}'.");
        }

        if (selection is null)
        {
            throw new ValidateException("ConfirmedRecovery requires the confirmed recovery option's details.");
        }

        if (selection.IsCurrentBus)
        {
            session.State = TravelSessionState.Riding;
            return;
        }

        if (selection.DirectionId is not int directionId || selection.BoardingStopId is not int boardingStopId)
        {
            // Also the rejection path for an UnconfirmedRailPointer option: it has no
            // DirectionId/BoardingStopId to send, so it always fails this same check.
            throw new ValidateException(
                "ConfirmedRecovery requires DirectionId and BoardingStopId for a non-current-bus option — an " +
                "UnconfirmedRailPointer option cannot be confirmed.");
        }

        session.DirectionId = directionId;
        session.BoardingStopId = boardingStopId;
        session.State = TravelSessionState.WalkingToStop;
    }

    public async Task<int> AbandonStaleSessionsAsync(CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow - StallThreshold;

        var staleSessions = await _dbContext.TravelSessions
            .Where(s => !TerminalStates.Contains(s.State) && s.LastActivityAt < cutoff)
            .ToListAsync(cancellationToken);

        foreach (var session in staleSessions)
        {
            session.State = TravelSessionState.Abandoned;
        }

        if (staleSessions.Count > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return staleSessions.Count;
    }

    // Threshold matching T04's "1 stop to Siam" framing.
    private const int ApproachingDestinationThreshold = 1;

    private static TravelStopSummary ToStopSummary(BusNavigate.Domain.Entities.BusStop stop) =>
        new(stop.Id, stop.NameTh, stop.NameEn);

    public async Task<TravelSessionProgress> GetProgressAsync(
        int travelSessionId, int? currentStopSequence, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.TravelSessions.FirstOrDefaultAsync(s => s.Id == travelSessionId, cancellationToken)
            ?? throw new ValidateException($"Travel session {travelSessionId} was not found.");

        if (session.State != TravelSessionState.Riding)
        {
            throw new ValidateException(
                $"Progress is only available while RIDING (session is currently '{session.State}').");
        }

        var routeStops = await _dbContext.RouteStops
            .Where(rs => rs.DirectionId == session.DirectionId)
            .Include(rs => rs.BusStop)
            .OrderBy(rs => rs.SequenceNumber)
            .ToListAsync(cancellationToken);

        var boardingRouteStop = routeStops.FirstOrDefault(rs => rs.BusStopId == session.BoardingStopId);
        var alightingRouteStop = routeStops.FirstOrDefault(rs => rs.BusStopId == session.AlightingStopId);

        if (boardingRouteStop is null || alightingRouteStop is null)
        {
            throw new ValidateException("Session's boarding/alighting stop is no longer part of its Direction.");
        }

        var effectiveCurrentSequence = currentStopSequence ?? boardingRouteStop.SequenceNumber;
        var remainingStopCount = Math.Max(0, alightingRouteStop.SequenceNumber - effectiveCurrentSequence);

        var previousStop = routeStops
            .Where(rs => rs.SequenceNumber <= effectiveCurrentSequence &&
                rs.SequenceNumber <= alightingRouteStop.SequenceNumber)
            .LastOrDefault();

        var nextStop = routeStops
            .Where(rs => rs.SequenceNumber > effectiveCurrentSequence &&
                rs.SequenceNumber <= alightingRouteStop.SequenceNumber)
            .FirstOrDefault();

        return new TravelSessionProgress(
            previousStop is null ? null : ToStopSummary(previousStop.BusStop),
            nextStop is null ? null : ToStopSummary(nextStop.BusStop),
            ToStopSummary(alightingRouteStop.BusStop),
            remainingStopCount,
            remainingStopCount <= ApproachingDestinationThreshold,
            DataConfidence.Estimated);
    }
}
