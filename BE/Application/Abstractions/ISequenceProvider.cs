namespace Application.Abstractions;

/// <summary>
/// Hands out the ever increasing change numbers stored on each check-in.
/// Behind an interface so the sync rules can be tested without a database.
/// </summary>
public interface ISequenceProvider
{
    Task<long> NextAsync(CancellationToken ct = default);
}
