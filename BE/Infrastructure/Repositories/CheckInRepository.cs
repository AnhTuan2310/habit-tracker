using Application.IRepositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CheckInRepository : ICheckInRepository
{
    private readonly AppDbContext _db;

    public CheckInRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<CheckIn>> GetAllForUserAsync(Guid userId, CancellationToken ct = default)
        => _db.CheckIns
            .Where(c => c.UserId == userId)
            .ToListAsync(ct);

    public Task<CheckIn?> GetCellAsync(Guid userId, Guid habitId, DateOnly localDate, CancellationToken ct = default)
        => _db.CheckIns.FirstOrDefaultAsync(
            c => c.UserId == userId && c.HabitId == habitId && c.LocalDate == localDate, ct);

    public Task<List<CheckIn>> GetChangesSinceAsync(Guid userId, long sinceSeq, CancellationToken ct = default)
        => _db.CheckIns
            .Where(c => c.UserId == userId && c.Seq > sinceSeq)
            .OrderBy(c => c.Seq)
            .ToListAsync(ct);

    public async Task AddAsync(CheckIn checkIn, CancellationToken ct = default)
        => await _db.CheckIns.AddAsync(checkIn, ct);

    public Task SaveAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
