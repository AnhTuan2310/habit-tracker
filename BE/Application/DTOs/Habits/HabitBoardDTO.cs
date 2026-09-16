namespace Application.DTOs.Habits;

/// <summary>
/// Everything the main screen needs, in one response.
/// <para>
/// <c>MaxSeq</c> is the highest change number the client has now seen. It sends
/// that value back later to ask only for what changed since.
/// </para>
/// </summary>
public record HabitBoardDTO(
    DateOnly Today,
    int WindowDays,
    long MaxSeq,
    List<HabitSummaryDTO> Habits);

public record HabitSummaryDTO(
    Guid Id,
    string Name,
    string Emoji,
    bool DoneToday,
    int CurrentStreak,
    int LongestStreak,
    int CompletedDaysInWindow,
    int CompletionRatePercent,
    List<DayCellDTO> RecentDays);

/// <param name="Date">The day this cell stands for.</param>
/// <param name="Done">Whether the habit was completed that day.</param>
/// <param name="DeviceId">
/// Which device settled this day, or null if nothing was ever recorded for it.
/// <para>
/// This is the device whose action won, not every device that touched the day. A
/// tick from the tablet that the phone later undid and the tablet then redid
/// leaves only the tablet here. The full history of attempts lives in
/// <c>SyncOperations</c>.
/// </para>
/// </param>
public record DayCellDTO(DateOnly Date, bool Done, string? DeviceId);
