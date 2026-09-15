namespace Domain.Stats;

public record StreakResult(
    int CurrentStreak,
    int LongestStreak,
    int CompletedDaysInWindow,
    int CompletionRatePercent);

/// <summary>
/// Turns a list of completed days into the consistency numbers.
/// <para>
/// Deliberately pure: no database, no clock, no injected services. Everything it
/// needs is passed in, so the rules can be tested directly and read in one sitting.
/// </para>
/// <para>
/// The numbers are recomputed on every read rather than stored. A device that was
/// offline for three days syncs check-ins dated in the <em>past</em>; any value
/// written earlier was calculated without knowing those days existed and would be
/// silently wrong from that moment on.
/// </para>
/// </summary>
public static class StreakCalculator
{
    /// <summary>Completion rate is reported over this many days ending today.</summary>
    public const int CompletionWindowDays = 30;

    /// <param name="doneDates">Days marked done for one habit. Order and duplicates do not matter.</param>
    /// <param name="today">The user's own current date, sent by the client.</param>
    public static StreakResult Compute(IEnumerable<DateOnly> doneDates, DateOnly today)
    {
        var days = doneDates.Distinct().OrderBy(d => d).ToList();
        if (days.Count == 0)
        {
            return new StreakResult(0, 0, 0, 0);
        }

        var longest = 1;
        var run = 1;
        for (var i = 1; i < days.Count; i++)
        {
            run = days[i].DayNumber - days[i - 1].DayNumber == 1 ? run + 1 : 1;
            if (run > longest)
            {
                longest = run;
            }
        }

        var completed = days.ToHashSet();

        // Not ticking today does not break the streak until the day is over, so
        // when today is still empty the count starts from yesterday.
        var cursor = completed.Contains(today) ? today : today.AddDays(-1);
        var current = 0;
        while (completed.Contains(cursor))
        {
            current++;
            cursor = cursor.AddDays(-1);
        }

        var windowStart = today.AddDays(-(CompletionWindowDays - 1));
        var inWindow = days.Count(d => d >= windowStart && d <= today);
        var rate = (int)Math.Round(inWindow * 100.0 / CompletionWindowDays);

        return new StreakResult(current, longest, inWindow, rate);
    }
}
