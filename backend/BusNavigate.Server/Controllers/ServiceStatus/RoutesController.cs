using BusNavigate.Domain.Interfaces.ServiceStatus;
using Microsoft.AspNetCore.Mvc;

namespace BusNavigate.Server.Controllers.ServiceStatus;

[ApiController]
[Route("api/v1/routes")]
public class RoutesController : ControllerBase
{
    private readonly IServiceStatusService _serviceStatusService;

    public RoutesController(IServiceStatusService serviceStatusService)
    {
        _serviceStatusService = serviceStatusService;
    }

    // GET /api/v1/routes/{routeId}/status?directionId={optional}
    [HttpGet("{routeId:int}/status")]
    public async Task<IActionResult> GetStatus(
        int routeId, [FromQuery] int? directionId, CancellationToken cancellationToken)
    {
        var result = await _serviceStatusService.GetStatusAsync(routeId, directionId, cancellationToken);
        return Ok(result);
    }
}
