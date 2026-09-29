using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.Interfaces.TripPlanning;
using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;
using BusNavigate.Domain.ViewModels.TripPlanning;
using BusNavigate.WebApi.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace BusNavigate.WebApi.Controllers.TripPlanning;

[ApiController]
[Route("api/v1/travel-options")]
public class TravelOptionsController : ControllerBase
{
    private readonly ITravelOptionSearchService _travelOptionSearchService;
    private readonly ITravelOptionEvaluationService _travelOptionEvaluationService;

    public TravelOptionsController(
        ITravelOptionSearchService travelOptionSearchService, ITravelOptionEvaluationService travelOptionEvaluationService)
    {
        _travelOptionSearchService = travelOptionSearchService;
        _travelOptionEvaluationService = travelOptionEvaluationService;
    }

    // POST /api/v1/travel-options — full search, direct-connections only (T11).
    // userId is optional (03) — no X-Device-Id just means no preference to rank by.
    [HttpPost]
    public async Task<IActionResult> Search(
        [FromBody] SearchTravelOptionsRequest request, CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetUserId();
        var results = await _travelOptionSearchService.SearchAsync(
            request.CurrentLatitude, request.CurrentLongitude, request.DestinationPlaceId, request.DestinationType,
            userId, cancellationToken);
        return Ok(results);
    }

    // POST /api/v1/travel-options/compare — the T05 "can I take this bus?" check.
    [HttpPost("compare")]
    public async Task<IActionResult> Compare(
        [FromBody] CompareTravelOptionRequest request, CancellationToken cancellationToken)
    {
        var result = await _travelOptionEvaluationService.EvaluateAsync(
            request.CurrentTravelSessionId, request.CandidateDirectionId, cancellationToken);
        return Ok(result);
    }
}
