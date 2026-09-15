using Domain.Enums;

namespace Application.DTOs.Sync;

/// <summary>
/// One round trip carries both directions: what the server did with the pushed
/// operations, and what changed on other devices meanwhile.
/// </summary>
public record SyncResponse(
    List<SyncOperationResultDTO> Results,
    List<CheckInStateDTO> Changes,
    long MaxSeq,
    DateTime ServerTimeUtc);

public record SyncOperationResultDTO(Guid OpId, SyncOutcome Outcome);

public record CheckInStateDTO(
    Guid HabitId,
    DateOnly LocalDate,
    CheckInStatus Status,
    DateTime ClientUpdatedAt,
    string DeviceId,
    bool ClockSkewDetected,
    long Seq);
