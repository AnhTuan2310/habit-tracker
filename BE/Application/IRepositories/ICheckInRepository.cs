using Domain.Entities;

namespace Application.IRepositories;

public interface ICheckInRepository
{
    /// <summary>
    /// Every check-in the user has, across all habits and all time.
    /// <para>
    /// Streaks are recomputed on read, and the longest streak can sit anywhere in
    /// history, so the whole series is needed. One query for all habits rather
    /// than one per habit. This is the known cost of the recompute-on-read choice.
    /// </para>
    /// </summary>
    Task<List<CheckIn>> GetAllForUserAsync(Guid userId, CancellationToken ct = default);

    Task<CheckIn?> GetCellAsync(Guid userId, Guid habitId, DateOnly localDate, CancellationToken ct = default);

    /// <summary>Changes newer than the given change number, for a device catching up.</summary>
    Task<List<CheckIn>> GetChangesSinceAsync(Guid userId, long sinceSeq, CancellationToken ct = default);

    Task AddAsync(CheckIn checkIn, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
}
