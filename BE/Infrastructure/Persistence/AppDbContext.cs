using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    /// <summary>
    /// Backs <see cref="CheckIn.Seq"/>. Offline devices use it as a resume point,
    /// so it has to move forward on every write and never repeat.
    /// </summary>
    public const string ChangeSequence = "check_in_seq";

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<CheckIn> CheckIns => Set<CheckIn>();
    public DbSet<SyncOperation> SyncOperations => Set<SyncOperation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasSequence<long>(ChangeSequence).StartsAt(1).IncrementsBy(1);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    /// <summary>Reserves the next change number from the database sequence.</summary>
    public async Task<long> NextSequenceValueAsync(CancellationToken ct = default)
    {
        await using var command = Database.GetDbConnection().CreateCommand();
        command.CommandText = $"SELECT nextval('\"{ChangeSequence}\"')";

        await Database.OpenConnectionAsync(ct);
        try
        {
            var raw = await command.ExecuteScalarAsync(ct);
            return Convert.ToInt64(raw);
        }
        finally
        {
            await Database.CloseConnectionAsync();
        }
    }
}
