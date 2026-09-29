using BusNavigate.Domain.Interfaces.GtfsImport;
using Microsoft.AspNetCore.Mvc;

namespace BusNavigate.WebApi.Controllers.TripPlanning;

[ApiController]
[Route("api/v1/directions")]
public class DirectionsController : ControllerBase
{
    private readonly IRouteShapeService _routeShapeService;

    public DirectionsController(IRouteShapeService routeShapeService)
    {
        _routeShapeService = routeShapeService;
    }

    [HttpGet("shapes")]
    public async Task<IActionResult> GetShapes(CancellationToken cancellationToken)
    {
        var result = await _routeShapeService.GetAllShapesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}/shape")]
    public async Task<IActionResult> GetShape(int id, CancellationToken cancellationToken)
    {
        if (id <= 0)
        {
            return BadRequest();
        }

        var result = await _routeShapeService.GetShapeAsync(id, cancellationToken);
        return Ok(result);
    }
}
