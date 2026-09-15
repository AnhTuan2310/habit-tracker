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

public record DayCellDTO(DateOnly Date, bool Done);
