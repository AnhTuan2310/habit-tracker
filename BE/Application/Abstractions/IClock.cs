namespace Application.Abstractions;

/// <summary>
/// The server's own clock, behind an interface so conflict rules that depend on
/// "now" can be tested at a fixed instant instead of whatever time the test ran.
/// </summary>
public interface IClock
{
    DateTime UtcNow { get; }
}
