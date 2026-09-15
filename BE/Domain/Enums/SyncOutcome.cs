namespace Domain.Enums;

/// <summary>
/// What the server did with one incoming sync operation.
/// </summary>
public enum SyncOutcome
{
    /// <summary>The operation changed the stored state.</summary>
    Applied = 0,

    /// <summary>Same OpId was already processed. The request was a retry.</summary>
    Duplicate = 1,

    /// <summary>A newer action for the same day was already stored, so this one lost.</summary>
    Superseded = 2
}
