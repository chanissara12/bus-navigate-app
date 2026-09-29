namespace BusNavigate.Domain.Entities;

// Per T04's resolution: BOARDED was considered and dropped (no behavioral difference
// from the start of RIDING). MISBOARDED is a full state, not a flag on RIDING, since
// recovery routes to a different downstream flow than normal follow-through.
public enum TravelSessionState
{
    Planned = 0,
    WalkingToStop = 1,
    Waiting = 2,
    Riding = 3,
    Misboarded = 4,
    Alighted = 5,
    Completed = 6,
    Abandoned = 7,
}
