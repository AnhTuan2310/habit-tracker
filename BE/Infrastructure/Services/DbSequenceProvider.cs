using Application.Abstractions;
using Infrastructure.Persistence;

namespace Infrastructure.Services;

/// <summary>
/// Takes change numbers from a Postgres sequence. The database is the only thing
/// that can hand out an increasing number that never repeats when several requests
/// are being processed at once.
/// </summary>
public class DbSequenceProvider : ISequenceProvider
{
    private readonly AppDbContext _db;

    public DbSequenceProvider(AppDbContext db)
    {
        _db = db;
    }

    public Task<long> NextAsync(CancellationToken ct = default)
        => _db.NextSequenceValueAsync(ct);
}
