namespace BusNavigate.Domain.Entities;

// One row per User (01: Store and read UserPreference). Absence of a row for a User is
// the graceful default — all three toggles off — not modeled as a separate state here.
public class UserPreference
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public bool MinimizeWalking { get; set; }

    public bool MinimizeTransfers { get; set; }

    public bool AvoidStreetCrossing { get; set; }

    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}
