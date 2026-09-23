using BusNavigate.Domain.Interfaces.Recovery;
using BusNavigate.Domain.ViewModels.Recovery;
using Microsoft.AspNetCore.Mvc;

namespace BusNavigate.Server.Controllers.Recovery;

[ApiController]
[Route("api/v1/travel-sessions/{travelSessionId:int}/recovery")]
public class RecoveryController : ControllerBase
{
    private readonly IRecoveryService _recoveryService;

    public RecoveryController(IRecoveryService recoveryService)
    {
        _recoveryService = recoveryService;
    }

    // POST /api/v1/travel-sessions/{travelSessionId}/recovery — the frontend calls
    // this after (or alongside) a "reported_wrong_bus" event (T06/T09).
    [HttpPost]
    public async Task<IActionResult> GenerateOptions(
        int travelSessionId, [FromBody] RecoveryRequest request, CancellationToken cancellationToken)
    {
        var result = await _recoveryService.GenerateRecoveryOptionsAsync(
            travelSessionId, request.CurrentDirectionId, request.CurrentLatitude, request.CurrentLongitude, cancellationToken);
        return Ok(result);
    }
}
