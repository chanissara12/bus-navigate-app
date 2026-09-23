using BusNavigate.Domain.Interfaces.TripPlanning;
using Microsoft.AspNetCore.Mvc;

namespace BusNavigate.Server.Controllers.TripPlanning;

[ApiController]
[Route("api/v1/places")]
public class PlacesController : ControllerBase
{
    private readonly IPlaceSearchService _placeSearchService;

    public PlacesController(IPlaceSearchService placeSearchService)
    {
        _placeSearchService = placeSearchService;
    }

    // GET /api/v1/places/search?q={text}
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken cancellationToken)
    {
        var results = await _placeSearchService.SearchAsync(q, cancellationToken);
        return Ok(results);
    }
}
