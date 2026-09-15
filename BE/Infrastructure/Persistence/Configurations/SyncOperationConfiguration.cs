using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class SyncOperationConfiguration : IEntityTypeConfiguration<SyncOperation>
{
    public void Configure(EntityTypeBuilder<SyncOperation> builder)
    {
        // The client generates OpId, so it is the natural primary key. Inserting
        // the same operation twice fails on the key instead of creating a copy.
        builder.HasKey(o => o.OpId);
        builder.Property(o => o.OpId).ValueGeneratedNever();

        builder.Property(o => o.DeviceId).HasMaxLength(64).IsRequired();
        builder.Property(o => o.Status).HasConversion<int>();
        builder.Property(o => o.Outcome).HasConversion<int>();

        builder.HasIndex(o => new { o.UserId, o.ReceivedAt });
    }
}
