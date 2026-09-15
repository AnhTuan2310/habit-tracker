using Application.DTOs.Sync;

namespace Application.IServices;

public interface ISyncService
{
    Task<SyncResponse> SyncAsync(Guid userId, SyncRequest request, CancellationToken ct = default);
}
