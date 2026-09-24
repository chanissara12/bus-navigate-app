using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Interfaces.TravelSession;
using BusNavigate.Domain.ViewModels.TravelSession;
using BusNavigate.Server.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace BusNavigate.Server.Controllers.TravelSession;

[ApiController]
[Route("api/v1/travel-sessions")]
public class TravelSessionsController : ControllerBase
{
    private readonly ITravelSessionService _travelSessionService;

    public TravelSessionsController(ITravelSessionService travelSessionService)
    {
        _travelSessionService = travelSessionService;
    }

    // POST /api/v1/travel-sessions — creates a session in PLANNED state.
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateTravelSessionRequest request, CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetRequiredUserId();
        var session = await _travelSessionService.CreateAsync(
            userId, request.DirectionId, request.BoardingStopId, request.AlightingStopId, cancellationToken);
        return Ok(ToResponse(session));
    }

    // POST /api/v1/travel-sessions/{id}/events — state transitions (T04's table).
    [HttpPost("{id:int}/events")]
    public async Task<IActionResult> ApplyEvent(
        int id, [FromBody] TravelSessionEventRequest request, CancellationToken cancellationToken)
    {
        var eventType = ParseEventType(request.Type);
        var session = await _travelSessionService.ApplyEventAsync(id, eventType, request.RecoverySelection, cancellationToken);
        return Ok(ToResponse(session));
    }

    // GET /api/v1/travel-sessions/{id}/progress — get-off assistance polling, valid
    // only while RIDING.
    [HttpGet("{id:int}/progress")]
    public async Task<IActionResult> GetProgress(
        int id, [FromQuery] int? currentStopSequence, CancellationToken cancellationToken)
    {
        var progress = await _travelSessionService.GetProgressAsync(id, currentStopSequence, cancellationToken);
        return Ok(progress);
    }

    private static TravelSessionResponse ToResponse(BusNavigate.Domain.Entities.TravelSession session) => new(
        session.Id, session.State, session.DirectionId, session.BoardingStopId, session.AlightingStopId,
        session.CreatedAt, session.LastActivityAt);

    private static TravelSessionEventType ParseEventType(string type) => type switch
    {
        "started_walking" => TravelSessionEventType.StartedWalking,
        "arrived_at_stop" => TravelSessionEventType.ArrivedAtStop,
        "boarded" => TravelSessionEventType.Boarded,
        "alighted" => TravelSessionEventType.Alighted,
        "reached_destination" => TravelSessionEventType.ReachedDestination,
        "reported_wrong_bus" => TravelSessionEventType.ReportedWrongBus,
        "confirmed_recovery" => TravelSessionEventType.ConfirmedRecovery,
        _ => throw new ValidateException($"Unknown event type '{type}'."),
    };
}
