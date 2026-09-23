namespace BusNavigate.Domain.Entities;

// The live state of one in-progress trip attempt — starts the moment the user confirms
// a TravelOption (not when they board) and ends at arrival or abandonment. Direction/
// BoardingStop/AlightingStop capture the confirmed plan directly (TravelOption itself
// is a computed result, never persisted — see T10). Richer TravelOption fields
// (estimated duration, walking distance, transfer count, etc.) aren't needed by the
// state machine itself and are deferred to whichever ticket implements plan generation.
public class TravelSession
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public TravelSessionState State { get; set; } = TravelSessionState.Planned;

    public int DirectionId { get; set; }

    public Direction Direction { get; set; } = null!;

    public int BoardingStopId { get; set; }

    public BusStop BoardingStop { get; set; } = null!;

    public int AlightingStopId { get; set; }

    public BusStop AlightingStop { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    // Updated on every transition and progress poll — the stall sweep abandons any
    // non-terminal session whose LastActivityAt falls more than 2 hours behind.
    public DateTime LastActivityAt { get; set; }
}
