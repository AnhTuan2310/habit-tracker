using Application.DTOs.Habits;

namespace Application.IServices;

public interface IHabitService
{
    Task<HabitBoardDTO> GetBoardAsync(Guid userId, DateOnly today, int windowDays, CancellationToken ct = default);
    Task<Guid> CreateAsync(Guid userId, CreateHabitRequest request, CancellationToken ct = default);
    Task ArchiveAsync(Guid userId, Guid habitId, CancellationToken ct = default);
}
