using Domain.Entities;

namespace Application.IRepositories;

public interface IHabitRepository
{
    Task<List<Habit>> GetActiveAsync(Guid userId, CancellationToken ct = default);
    Task<Habit?> GetByIdAsync(Guid userId, Guid habitId, CancellationToken ct = default);
    Task<HashSet<Guid>> GetActiveIdsAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(Habit habit, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
}
