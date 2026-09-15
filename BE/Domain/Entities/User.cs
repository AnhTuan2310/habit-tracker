namespace Domain.Entities;

/// <summary>
/// The app ships with one seeded user and no login. The column exists so every
/// query is already scoped by owner; adding real accounts later does not change
/// the shape of the data.
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public List<Habit> Habits { get; set; } = new();
}
