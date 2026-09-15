using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CheckInConfiguration : IEntityTypeConfiguration<CheckIn>
{
    public void Configure(EntityTypeBuilder<CheckIn> builder)
    {
        builder.HasKey(c => c.Id);

        // The rule that makes duplicates structurally impossible: one row per day.
        builder.HasIndex(c => new { c.UserId, c.HabitId, c.LocalDate }).IsUnique();

        // Offline devices catch up by asking for everything above their last Seq.
        builder.HasIndex(c => c.Seq);

        builder.Property(c => c.DeviceId).HasMaxLength(64).IsRequired();
        builder.Property(c => c.Status).HasConversion<int>();

        builder.HasOne(c => c.Habit)
            .WithMany(h => h.CheckIns)
            .HasForeignKey(c => c.HabitId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
