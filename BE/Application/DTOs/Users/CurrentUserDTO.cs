namespace Application.DTOs.Users;

/// <summary>
/// Who the app thinks is using it.
/// <para>
/// There is no login yet, so this always resolves to the seeded user. It exists
/// as its own endpoint rather than a field on the board because this is exactly
/// the seam authentication will plug into: the shape the client consumes stays
/// the same, only where the id comes from changes.
/// </para>
/// </summary>
public record CurrentUserDTO(Guid Id, string Name);
