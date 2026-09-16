using Application.DTOs.Habits;
using Application.IRepositories;
using Application.IServices;
using Domain.Entities;
using Domain.Enums;
using Domain.Stats;
using static Domain.Constants.MessageConstant;

namespace Application.Services;

public class HabitService : IHabitService
{
    private readonly IHabitRepository _habits;
    private readonly ICheckInRepository _checkIns;

    public HabitService(IHabitRepository habits, ICheckInRepository checkIns)
    {
        _habits = habits;
        _checkIns = checkIns;
    }

    public async Task<HabitBoardDTO> GetBoardAsync(Guid userId, DateOnly today, int windowDays, CancellationToken ct = default)
    {
        var habits = await _habits.GetActiveAsync(userId, ct);
        var checkIns = await _checkIns.GetAllForUserAsync(userId, ct);

        var byHabit = checkIns
            .GroupBy(c => c.HabitId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var windowStart = today.AddDays(-(windowDays - 1));
        var summaries = new List<HabitSummaryDTO>(habits.Count);

        foreach (var habit in habits)
        {
            var rows = byHabit.TryGetValue(habit.Id, out var found) ? found : new List<CheckIn>();

            // One row per day is guaranteed by the unique index, so this cannot throw.
            var byDate = rows.ToDictionary(c => c.LocalDate);

            // Only Done days count towards consistency. Undone rows are kept in the
            // table as tombstones for conflict resolution, not as progress.
            var doneDates = rows
                .Where(c => c.Status == CheckInStatus.Done)
                .Select(c => c.LocalDate)
                .ToHashSet();

            var streak = StreakCalculator.Compute(doneDates, today);

            var recentDays = new List<DayCellDTO>(windowDays);
            for (var date = windowStart; date <= today; date = date.AddDays(1))
            {
                byDate.TryGetValue(date, out var row);
                recentDays.Add(new DayCellDTO(date, row?.Status == CheckInStatus.Done, row?.DeviceId));
            }

            summaries.Add(new HabitSummaryDTO(
                habit.Id,
                habit.Name,
                habit.Emoji,
                doneDates.Contains(today),
                streak.CurrentStreak,
                streak.LongestStreak,
                streak.CompletedDaysInWindow,
                streak.CompletionRatePercent,
                recentDays));
        }

        var maxSeq = checkIns.Count == 0 ? 0 : checkIns.Max(c => c.Seq);

        return new HabitBoardDTO(today, windowDays, maxSeq, summaries);
    }

    public async Task<Guid> CreateAsync(Guid userId, CreateHabitRequest request, CancellationToken ct = default)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length == 0)
        {
            throw new ArgumentException(HabitMessage.NAME_REQUIRED);
        }

        var habit = new Habit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            Emoji = request.Emoji?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _habits.AddAsync(habit, ct);
        await _habits.SaveAsync(ct);

        return habit.Id;
    }

    public async Task ArchiveAsync(Guid userId, Guid habitId, CancellationToken ct = default)
    {
        var habit = await _habits.GetByIdAsync(userId, habitId, ct)
                    ?? throw new KeyNotFoundException(HabitMessage.NOT_FOUND);

        // Archive rather than delete: the past check-ins stay meaningful.
        habit.ArchivedAt = DateTime.UtcNow;
        await _habits.SaveAsync(ct);
    }
}
