using BusNavigate.Domain.Interfaces.BusStop;
using Microsoft.AspNetCore.Mvc;

namespace BusNavigate.Server.Controllers.BusStop;

[ApiController]
[Route("api/v1/bus-stops")]
public class BusStopsController : ControllerBase
{
    private readonly IBusStopContextService _busStopContextService;
    private readonly INearbyBusStopSearchService _nearbyBusStopSearchService;

    public BusStopsController(
        IBusStopContextService busStopContextService, INearbyBusStopSearchService nearbyBusStopSearchService)
    {
        _busStopContextService = busStopContextService;
        _nearbyBusStopSearchService = nearbyBusStopSearchService;
    }

    // GET /api/v1/bus-stops/{id} — bus stop context (BusStop + StopLandmark[]).
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetContext(int id, CancellationToken cancellationToken)
    {
        var result = await _busStopContextService.GetContextAsync(id, cancellationToken);
        return Ok(result);
    }

    // GET /api/v1/bus-stops/nearby?lat={}&lng={}&radius={} — current-stop identification.
    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearby(
        [FromQuery] decimal lat, [FromQuery] decimal lng, [FromQuery] double radius, CancellationToken cancellationToken)
    {
        var results = await _nearbyBusStopSearchService.FindNearbyAsync(lat, lng, radius, cancellationToken);
        return Ok(results);
    }
}
