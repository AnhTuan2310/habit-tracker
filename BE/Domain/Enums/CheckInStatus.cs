namespace Domain.Enums;

/// <summary>
/// State of one habit on one day.
/// <para>
/// Undone is stored as a real row, not as a missing row. An "undo" made on an
/// offline device has to travel to the server and be able to win over a "done"
/// coming from another device. A deleted row carries no timestamp, so it could
/// never win that comparison.
/// </para>
/// </summary>
public enum CheckInStatus
{
    Undone = 0,
    Done = 1
}
