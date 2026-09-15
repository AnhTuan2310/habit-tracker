using Application.IRepositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class HabitRepository : IHabitRepository
{
    private readonly AppDbContext _db;

    public HabitRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<Habit>> GetActiveAsync(Guid userId, CancellationToken ct = default)
        => _db.Habits
            .Where(h => h.UserId == userId && h.ArchivedAt == null)
            .OrderBy(h => h.CreatedAt)
            .ToListAsync(ct);

    public Task<Habit?> GetByIdAsync(Guid userId, Guid habitId, CancellationToken ct = default)
        => _db.Habits.FirstOrDefaultAsync(h => h.UserId == userId && h.Id == habitId, ct);

    public async Task<HashSet<Guid>> GetActiveIdsAsync(Guid userId, CancellationToken ct = default)
    {
        var ids = await _db.Habits
            .Where(h => h.UserId == userId && h.ArchivedAt == null)
            .Select(h => h.Id)
            .ToListAsync(ct);

        return ids.ToHashSet();
    }

    public async Task AddAsync(Habit habit, CancellationToken ct = default)
        => await _db.Habits.AddAsync(habit, ct);

    public Task SaveAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
