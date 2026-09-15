using Application.IRepositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SyncOperationRepository : ISyncOperationRepository
{
    private readonly AppDbContext _db;

    public SyncOperationRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<HashSet<Guid>> GetExistingOpIdsAsync(Guid userId, IEnumerable<Guid> opIds, CancellationToken ct = default)
    {
        var ids = opIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new HashSet<Guid>();
        }

        var found = await _db.SyncOperations
            .Where(o => o.UserId == userId && ids.Contains(o.OpId))
            .Select(o => o.OpId)
            .ToListAsync(ct);

        return found.ToHashSet();
    }

    public async Task AddAsync(SyncOperation operation, CancellationToken ct = default)
        => await _db.SyncOperations.AddAsync(operation, ct);

    public Task SaveAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
