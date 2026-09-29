namespace BusNavigate.Domain.Entities;

// Anonymous/device-scoped for Phase 1 — no login/signup flow. Identified by a
// client-generated device id (see T09's X-Device-Id header decision), upserted lazily
// on first sight of a new device.
public class User
{
    public int Id { get; set; }

    public string ExternalDeviceId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public ICollection<TravelSession> TravelSessions { get; set; } = [];
}
