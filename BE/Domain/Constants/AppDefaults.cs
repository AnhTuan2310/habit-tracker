namespace Domain.Constants;

public static class AppDefaults
{
    /// <summary>
    /// The app has no login yet, so every request acts as this seeded user.
    /// Kept as a constant in one place: swapping it for a real authenticated id
    /// later is a change to the controllers only, not to the services or the schema.
    /// </summary>
    public static readonly Guid DemoUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    /// <summary>How many days the calendar grid and the completion rate cover.</summary>
    public const int DefaultWindowDays = 30;

    /// <summary>
    /// How far ahead of the server a client clock may run before its timestamp is
    /// clamped.
    /// <para>
    /// Conflicts are decided by the time the user pressed the button, which the
    /// client reports. A device whose clock is set to next year would otherwise win
    /// every conflict forever. Clamping bounds the damage without throwing the
    /// action away: the tick still lands on the day the user meant.
    /// </para>
    /// </summary>
    public static readonly TimeSpan MaxClientClockSkew = TimeSpan.FromMinutes(5);

    /// <summary>Upper bound on one sync batch, so a broken client cannot send an unbounded request.</summary>
    public const int MaxOperationsPerSync = 500;
}
