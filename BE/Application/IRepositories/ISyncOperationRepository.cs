using Domain.Entities;

namespace Application.IRepositories;

public interface ISyncOperationRepository
{
    /// <summary>
    /// Which of these operation ids the server has already processed, fetched in
    /// one query rather than one per operation.
    /// </summary>
    Task<HashSet<Guid>> GetExistingOpIdsAsync(Guid userId, IEnumerable<Guid> opIds, CancellationToken ct = default);

    Task AddAsync(SyncOperation operation, CancellationToken ct = default);
    Task SaveAsync(CancellationToken ct = default);
}
