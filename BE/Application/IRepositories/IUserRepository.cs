using Domain.Entities;

namespace Application.IRepositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid userId, CancellationToken ct = default);
}
