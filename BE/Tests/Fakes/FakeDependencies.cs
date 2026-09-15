using Application.Abstractions;
using Application.IRepositories;
using Domain.Entities;

namespace Tests.Fakes;

/// <summary>A clock the test moves by hand.</summary>
public class FakeClock : IClock
{
    public FakeClock(DateTime utcNow) => UtcNow = utcNow;

    public DateTime UtcNow { get; set; }
}

/// <summary>Stands in for the Postgres sequence.</summary>
public class FakeSequenceProvider : ISequenceProvider
{
    private long _current;

    public Task<long> NextAsync(CancellationToken ct = default) => Task.FromResult(++_current);
}

public class FakeHabitRepository : IHabitRepository
{
    private readonly List<Habit> _habits = new();

    public Habit Add(Guid userId, string name)
    {
        var habit = new Habit { Id = Guid.NewGuid(), UserId = userId, Name = name, CreatedAt = DateTime.UtcNow };
        _habits.Add(habit);
        return habit;
    }

    public Task<List<Habit>> GetActiveAsync(Guid userId, CancellationToken ct = default)
        => Task.FromResult(_habits.Where(h => h.UserId == userId && h.ArchivedAt == null).ToList());

    public Task<Habit?> GetByIdAsync(Guid userId, Guid habitId, CancellationToken ct = default)
        => Task.FromResult(_habits.FirstOrDefault(h => h.UserId == userId && h.Id == habitId));

    public Task<HashSet<Guid>> GetActiveIdsAsync(Guid userId, CancellationToken ct = default)
        => Task.FromResult(_habits.Where(h => h.UserId == userId && h.ArchivedAt == null).Select(h => h.Id).ToHashSet());

    public Task AddAsync(Habit habit, CancellationToken ct = default)
    {
        _habits.Add(habit);
        return Task.CompletedTask;
    }

    public Task SaveAsync(CancellationToken ct = default) => Task.CompletedTask;
}

/// <summary>
/// Holds check-ins in a list. It deliberately does not enforce the unique index:
/// the tests are there to prove the service settles conflicts on its own, rather
/// than leaning on the database to be the only thing stopping duplicates.
/// </summary>
public class FakeCheckInRepository : ICheckInRepository
{
    public List<CheckIn> Rows { get; } = new();

    public Task<List<CheckIn>> GetAllForUserAsync(Guid userId, CancellationToken ct = default)
        => Task.FromResult(Rows.Where(c => c.UserId == userId).ToList());

    public Task<CheckIn?> GetCellAsync(Guid userId, Guid habitId, DateOnly localDate, CancellationToken ct = default)
        => Task.FromResult(Rows.FirstOrDefault(c =>
            c.UserId == userId && c.HabitId == habitId && c.LocalDate == localDate));

    public Task<List<CheckIn>> GetChangesSinceAsync(Guid userId, long sinceSeq, CancellationToken ct = default)
        => Task.FromResult(Rows.Where(c => c.UserId == userId && c.Seq > sinceSeq).OrderBy(c => c.Seq).ToList());

    public Task AddAsync(CheckIn checkIn, CancellationToken ct = default)
    {
        Rows.Add(checkIn);
        return Task.CompletedTask;
    }

    public Task SaveAsync(CancellationToken ct = default) => Task.CompletedTask;
}

public class FakeSyncOperationRepository : ISyncOperationRepository
{
    public List<SyncOperation> Rows { get; } = new();

    public Task<HashSet<Guid>> GetExistingOpIdsAsync(Guid userId, IEnumerable<Guid> opIds, CancellationToken ct = default)
    {
        var wanted = opIds.ToHashSet();
        return Task.FromResult(Rows
            .Where(o => o.UserId == userId && wanted.Contains(o.OpId))
            .Select(o => o.OpId)
            .ToHashSet());
    }

    public Task AddAsync(SyncOperation operation, CancellationToken ct = default)
    {
        Rows.Add(operation);
        return Task.CompletedTask;
    }

    public Task SaveAsync(CancellationToken ct = default) => Task.CompletedTask;
}
