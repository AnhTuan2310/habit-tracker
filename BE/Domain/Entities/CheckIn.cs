using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Current state of one (habit, day) cell.
/// <para>
/// There is exactly one row per (UserId, HabitId, LocalDate), enforced by a
/// unique index. That single constraint is the main defence against duplicates:
/// no matter how many devices tick the same habit for the same day, and no
/// matter how many times a request is retried, the data cannot grow a second row.
/// </para>
/// </summary>
public class CheckIn
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid HabitId { get; set; }

    /// <summary>
    /// The calendar day the user meant, decided by the client.
    /// <para>
    /// The server never derives this from its own clock. A user ticking at 23:50
    /// whose request arrives after midnight would otherwise have the check-in
    /// land on the wrong day and break their streak for no reason.
    /// </para>
    /// </summary>
    public DateOnly LocalDate { get; set; }

    public CheckInStatus Status { get; set; }

    /// <summary>
    /// UTC instant when the user pressed the button. This is what decides who
    /// wins when two devices touch the same day.
    /// </summary>
    public DateTime ClientUpdatedAt { get; set; }

    /// <summary>UTC instant the server stored it. Kept for auditing and for clamping.</summary>
    public DateTime ServerReceivedAt { get; set; }

    /// <summary>Which device sent the winning action. Shown in the UI.</summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// True when the client clock ran further ahead than the allowed skew and the
    /// server had to clamp <see cref="ClientUpdatedAt"/>.
    /// </summary>
    public bool ClockSkewDetected { get; set; }

    /// <summary>
    /// Monotonic change number from a database sequence, bumped on every write.
    /// A device that was offline asks for everything above the last Seq it saw.
    /// A timestamp would not do: two rows can share one, and then a change is
    /// skipped or replayed forever.
    /// </summary>
    public long Seq { get; set; }

    public Habit? Habit { get; set; }
}
