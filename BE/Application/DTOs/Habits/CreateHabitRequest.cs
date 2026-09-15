namespace Application.DTOs.Habits;

public class CreateHabitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
}
