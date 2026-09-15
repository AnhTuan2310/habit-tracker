using Domain.Constants;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

/// <summary>
/// Creates the single user and the five habits the assignment names, so the app
/// is usable the moment it starts with nothing to type in first.
/// </summary>
public static class DbSeeder
{
    private static readonly (string Emoji, string Name)[] DefaultHabits =
    {
        ("💧", "Uống đủ nước"),
        ("🏃", "Tập thể dục"),
        ("📚", "Đọc sách"),
        ("🧘", "Thiền"),
        ("🌙", "Ngủ đúng giờ")
    };

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct))
        {
            return;
        }

        var now = DateTime.UtcNow;

        db.Users.Add(new User
        {
            Id = AppDefaults.DemoUserId,
            Name = "Demo",
            CreatedAt = now
        });

        for (var i = 0; i < DefaultHabits.Length; i++)
        {
            var (emoji, name) = DefaultHabits[i];
            db.Habits.Add(new Habit
            {
                Id = Guid.NewGuid(),
                UserId = AppDefaults.DemoUserId,
                Name = name,
                Emoji = emoji,
                // Spaced apart so ordering by CreatedAt is stable. Seeding them all
                // on the same instant left the list in a different order each load.
                CreatedAt = now.AddSeconds(i)
            });
        }

        await db.SaveChangesAsync(ct);
    }
}
