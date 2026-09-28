using BusNavigate.Domain.Interfaces.UserPreference;
using BusNavigate.Domain.ViewModels.UserPreference;
using BusNavigate.Server.Extensions;
using Microsoft.AspNetCore.Mvc;
using UserPreferenceEntity = BusNavigate.Domain.Entities.UserPreference;

namespace BusNavigate.Server.Controllers.UserPreference;

[ApiController]
[Route("api/v1/user-preferences")]
public class UserPreferencesController : ControllerBase
{
    private readonly IUserPreferenceService _userPreferenceService;

    public UserPreferencesController(IUserPreferenceService userPreferenceService)
    {
        _userPreferenceService = userPreferenceService;
    }

    // GET /api/v1/user-preferences — reads back all-off, never an error, if none saved yet.
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetRequiredUserId();
        var preference = await _userPreferenceService.GetAsync(userId, cancellationToken);
        return Ok(ToResponse(preference));
    }

    // PUT /api/v1/user-preferences — full replace, single upsert.
    [HttpPut]
    public async Task<IActionResult> Set([FromBody] UserPreferenceRequest request, CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetRequiredUserId();
        var preference = await _userPreferenceService.SetAsync(
            userId, request.MinimizeWalking, request.MinimizeTransfers, request.AvoidStreetCrossing, cancellationToken);
        return Ok(ToResponse(preference));
    }

    private static UserPreferenceResponse ToResponse(UserPreferenceEntity preference) => new(
        preference.MinimizeWalking, preference.MinimizeTransfers, preference.AvoidStreetCrossing,
        preference.Id == 0 ? null : preference.UpdatedAt);
}
