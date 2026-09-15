namespace Domain.Entities;

/// <summary>
/// One habit the user checks off once a day.
/// </summary>
public class Habit
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Archived habits stay in the database so their past check-ins keep their
    /// meaning. Deleting the row would silently rewrite history.
    /// </summary>
    public DateTime? ArchivedAt { get; set; }

    public User? User { get; set; }
    public List<CheckIn> CheckIns { get; set; } = new();
}
