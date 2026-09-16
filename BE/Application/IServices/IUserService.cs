using Application.DTOs.Users;

namespace Application.IServices;

public interface IUserService
{
    Task<CurrentUserDTO> GetCurrentAsync(Guid userId, CancellationToken ct = default);
}
