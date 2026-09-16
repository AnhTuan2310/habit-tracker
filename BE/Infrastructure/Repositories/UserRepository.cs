using Application.IRepositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<User?> GetByIdAsync(Guid userId, CancellationToken ct = default)
        => _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
}
