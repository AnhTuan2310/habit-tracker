using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Log of every sync operation the server has accepted, keyed by an id the
/// client generates before it first tries to send.
/// <para>
/// This is the second, independent layer of duplicate protection. The unique
/// index on <see cref="CheckIn"/> stops two devices from creating two rows for
/// one day; this table stops the <em>same</em> action from being processed twice
/// when a request is retried after a timeout, where the client never learned
/// whether the first attempt reached the server.
/// </para>
/// </summary>
public class SyncOperation
{
    /// <summary>Generated on the client, stable across every retry of that action.</summary>
    public Guid OpId { get; set; }

    public Guid UserId { get; set; }
    public Guid HabitId { get; set; }
    public DateOnly LocalDate { get; set; }
    public CheckInStatus Status { get; set; }
    public DateTime ClientUpdatedAt { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public DateTime ReceivedAt { get; set; }
    public SyncOutcome Outcome { get; set; }
}
