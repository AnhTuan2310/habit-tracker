using Application.DTOs.Common;
using Application.DTOs.Sync;
using Application.IServices;
using Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public class SyncController : BaseController
{
    private readonly ISyncService _service;

    public SyncController(ISyncService service)
    {
        _service = service;
    }

    /// <summary>
    /// Pushes a batch of check-in actions and pulls back whatever changed elsewhere.
    /// </summary>
    /// <remarks>
    /// Both directions travel in one call because a device coming back online needs
    /// both at the same moment: it has local actions to hand over, and it is behind
    /// on everything the other devices did while it was away.
    ///
    /// Sending the same batch twice is safe. Each operation carries an OpId that the
    /// client generates once, so the second attempt is recognised and ignored rather
    /// than counted again.
    /// </remarks>
    /// <param name="request">Device id, the last change number seen, and the operations.</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpPost]
    public async Task<IActionResult> Push([FromBody] SyncRequest request, CancellationToken ct = default)
    {
        var response = await _service.SyncAsync(AppDefaults.DemoUserId, request, ct);

        return Ok(BaseResponseDTO<SyncResponse>.SuccessResponse(response));
    }
}
