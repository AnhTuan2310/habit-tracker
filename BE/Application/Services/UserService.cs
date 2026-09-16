using Application.DTOs.Users;
using Application.IRepositories;
using Application.IServices;
using static Domain.Constants.MessageConstant;

namespace Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _users;

    public UserService(IUserRepository users)
    {
        _users = users;
    }

    public async Task<CurrentUserDTO> GetCurrentAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct)
                   ?? throw new KeyNotFoundException(CommonMessage.NOT_FOUND);

        return new CurrentUserDTO(user.Id, user.Name);
    }
}
