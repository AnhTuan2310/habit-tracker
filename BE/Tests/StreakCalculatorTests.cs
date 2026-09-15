using Domain.Stats;

namespace Tests;

public class StreakCalculatorTests
{
    private static readonly DateOnly Today = new(2026, 9, 15);

    private static DateOnly[] DaysBack(params int[] offsets)
        => offsets.Select(o => Today.AddDays(-o)).ToArray();

    [Fact]
    public void No_history_gives_zeroes()
    {
        var result = StreakCalculator.Compute(Array.Empty<DateOnly>(), Today);

        Assert.Equal(0, result.CurrentStreak);
        Assert.Equal(0, result.LongestStreak);
        Assert.Equal(0, result.CompletionRatePercent);
    }

    [Fact]
    public void Unbroken_run_ending_today_is_the_current_streak()
    {
        var result = StreakCalculator.Compute(DaysBack(0, 1, 2, 3), Today);

        Assert.Equal(4, result.CurrentStreak);
        Assert.Equal(4, result.LongestStreak);
    }

    [Fact]
    public void Empty_today_does_not_break_the_streak_yet()
    {
        // The user has not ticked today, but the day is not over. A run that ended
        // yesterday must still count, otherwise the streak would appear to reset
        // every morning.
        var result = StreakCalculator.Compute(DaysBack(1, 2, 3), Today);

        Assert.Equal(3, result.CurrentStreak);
    }

    [Fact]
    public void A_missed_day_ends_the_current_streak()
    {
        // Today and the day before yesterday, but yesterday is missing.
        var result = StreakCalculator.Compute(DaysBack(0, 2, 3, 4), Today);

        Assert.Equal(1, result.CurrentStreak);
        Assert.Equal(3, result.LongestStreak);
    }

    [Fact]
    public void Longest_streak_can_sit_in_the_past()
    {
        var result = StreakCalculator.Compute(DaysBack(0, 5, 6, 7, 8, 9), Today);

        Assert.Equal(1, result.CurrentStreak);
        Assert.Equal(5, result.LongestStreak);
    }

    [Fact]
    public void Repeated_days_are_counted_once()
    {
        // Two devices syncing the same day must not inflate the streak. The unique
        // index stops this at the database, but the calculation must not depend on
        // that being the only line of defence.
        var dates = new[] { Today, Today, Today.AddDays(-1), Today.AddDays(-1) };

        var result = StreakCalculator.Compute(dates, Today);

        Assert.Equal(2, result.CurrentStreak);
        Assert.Equal(2, result.LongestStreak);
        Assert.Equal(2, result.CompletedDaysInWindow);
    }

    [Fact]
    public void Order_of_arrival_does_not_matter()
    {
        // Offline devices send days out of order; the result must not depend on it.
        var shuffled = new[] { Today.AddDays(-2), Today, Today.AddDays(-1) };

        var result = StreakCalculator.Compute(shuffled, Today);

        Assert.Equal(3, result.CurrentStreak);
    }

    [Fact]
    public void Completion_rate_is_measured_over_the_window()
    {
        var fifteenDays = Enumerable.Range(0, 15).Select(o => Today.AddDays(-o));

        var result = StreakCalculator.Compute(fifteenDays, Today);

        Assert.Equal(15, result.CompletedDaysInWindow);
        Assert.Equal(50, result.CompletionRatePercent);
    }

    [Fact]
    public void Days_older_than_the_window_do_not_count_towards_the_rate()
    {
        // Days at today-41 and today-40 are adjacent to each other but far outside
        // the 30 day window: they still hold the longest streak of 2, while the
        // completion rate sees only today.
        var result = StreakCalculator.Compute(DaysBack(0, 40, 41), Today);

        Assert.Equal(1, result.CompletedDaysInWindow);
        Assert.Equal(2, result.LongestStreak);
        Assert.Equal(1, result.CurrentStreak);
    }
}
