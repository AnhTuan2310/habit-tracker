using Application.DTOs.Common;
using Application.DTOs.Habits;
using Application.IServices;
using Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public class HabitsController : BaseController
{
    private readonly IHabitService _service;

    public HabitsController(IHabitService service)
    {
        _service = service;
    }

    /// <summary>
    /// The whole board: every habit with its streaks and its recent days.
    /// </summary>
    /// <param name="today">
    /// The client's own current date. The server does not use its own clock here:
    /// the user decides what "today" means, and their device may be in another
    /// timezone or ticking just before midnight.
    /// </param>
    /// <param name="days">How many days the calendar grid covers.</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpGet]
    public async Task<IActionResult> GetBoard(
        [FromQuery] DateOnly? today,
        [FromQuery] int days = AppDefaults.DefaultWindowDays,
        CancellationToken ct = default)
    {
        var date = today ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var window = Math.Clamp(days, 1, 366);

        var board = await _service.GetBoardAsync(AppDefaults.DemoUserId, date, window, ct);

        return Ok(BaseResponseDTO<HabitBoardDTO>.SuccessResponse(board));
    }

    /// <summary>Creates a habit.</summary>
    /// <param name="request">Name and emoji of the new habit.</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHabitRequest request, CancellationToken ct = default)
    {
        var id = await _service.CreateAsync(AppDefaults.DemoUserId, request, ct);

        return Ok(BaseResponseDTO<Guid>.SuccessResponse(id));
    }

    /// <summary>
    /// Archives a habit. The row and its check-ins stay, so past history keeps
    /// its meaning; the habit simply stops appearing on the board.
    /// </summary>
    /// <param name="id">Habit to archive.</param>
    /// <param name="ct">Cancellation token.</param>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct = default)
    {
        await _service.ArchiveAsync(AppDefaults.DemoUserId, id, ct);

        return Ok(BaseResponseDTO<object>.SuccessResponse(new { }));
    }
}
