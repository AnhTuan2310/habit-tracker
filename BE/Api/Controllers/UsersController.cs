using Application.DTOs.Common;
using Application.DTOs.Users;
using Application.IServices;
using Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public class UsersController : BaseController
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }

    /// <summary>
    /// The user the app is acting as.
    /// </summary>
    /// <remarks>
    /// With no login, this is always the seeded user. When authentication is added
    /// the only change here is reading the id from the token instead of a constant
    /// — the route, the response shape and every caller stay as they are.
    /// </remarks>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrent(CancellationToken ct = default)
    {
        var user = await _service.GetCurrentAsync(AppDefaults.DemoUserId, ct);

        return Ok(BaseResponseDTO<CurrentUserDTO>.SuccessResponse(user));
    }
}
