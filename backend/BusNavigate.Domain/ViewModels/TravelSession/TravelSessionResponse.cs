using BusNavigate.Domain.Entities;

namespace BusNavigate.Domain.ViewModels.TravelSession;

// A small DTO rather than returning the TravelSessionEntity directly — avoids
// serializing EF navigation properties (User/Direction/BoardingStop/AlightingStop).
public record TravelSessionResponse(
    int Id,
    TravelSessionState State,
    int DirectionId,
    int BoardingStopId,
    int AlightingStopId,
    DateTime CreatedAt,
    DateTime LastActivityAt
);
