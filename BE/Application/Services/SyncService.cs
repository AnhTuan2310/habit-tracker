using Application.Abstractions;
using Application.DTOs.Sync;
using Application.IRepositories;
using Application.IServices;
using Domain.Constants;
using Domain.Entities;
using Domain.Enums;
using static Domain.Constants.MessageConstant;

namespace Application.Services;

/// <summary>
/// Accepts batches of check-in actions from devices that may be offline, retrying,
/// or contradicting each other, and settles them into one state per day.
/// <para>
/// Duplicates are stopped twice, on purpose, because they arrive in two different
/// shapes:
/// </para>
/// <list type="number">
///   <item>
///     The same action sent twice, after a timeout where the client never learned
///     whether the first attempt landed. Caught by <c>OpId</c>, which the client
///     generates once and reuses on every retry.
///   </item>
///   <item>
///     Two devices ticking the same habit on the same day. These are not two
///     check-ins at all, they are two opinions about one cell. There is exactly one
///     row per (habit, day), so the data cannot grow a duplicate; the timestamps
///     decide which opinion survives.
///   </item>
/// </list>
/// </summary>
public class SyncService : ISyncService
{
    private readonly IHabitRepository _habits;
    private readonly ICheckInRepository _checkIns;
    private readonly ISyncOperationRepository _operations;
    private readonly ISequenceProvider _sequence;
    private readonly IClock _clock;

    public SyncService(
        IHabitRepository habits,
        ICheckInRepository checkIns,
        ISyncOperationRepository operations,
        ISequenceProvider sequence,
        IClock clock)
    {
        _habits = habits;
        _checkIns = checkIns;
        _operations = operations;
        _sequence = sequence;
        _clock = clock;
    }

    public async Task<SyncResponse> SyncAsync(Guid userId, SyncRequest request, CancellationToken ct = default)
    {
        var deviceId = request.DeviceId?.Trim() ?? string.Empty;
        if (deviceId.Length == 0)
        {
            throw new ArgumentException(SyncMessage.DEVICE_REQUIRED);
        }

        if (request.Operations.Count > AppDefaults.MaxOperationsPerSync)
        {
            throw new ArgumentException(string.Format(SyncMessage.TOO_MANY_OPERATIONS, AppDefaults.MaxOperationsPerSync));
        }

        var now = _clock.UtcNow;
        var activeHabits = await _habits.GetActiveIdsAsync(userId, ct);
        var alreadyProcessed = await _operations.GetExistingOpIdsAsync(userId, request.Operations.Select(o => o.OpId), ct);

        var results = new List<SyncOperationResultDTO>(request.Operations.Count);

        // Two operations in one batch can target the same cell, for example a tick
        // and an untick made while offline. Nothing is written to the database until
        // the end, so the running state is tracked here; reading the cell again
        // would otherwise miss the change made moments earlier in this same loop.
        var touched = new Dictionary<(Guid HabitId, DateOnly LocalDate), CheckIn>();

        foreach (var op in request.Operations)
        {
            if (alreadyProcessed.Contains(op.OpId))
            {
                results.Add(new SyncOperationResultDTO(op.OpId, SyncOutcome.Duplicate));
                continue;
            }

            if (!activeHabits.Contains(op.HabitId))
            {
                throw new KeyNotFoundException(SyncMessage.UNKNOWN_HABIT);
            }

            var clockSkewed = op.ClientUpdatedAt > now + AppDefaults.MaxClientClockSkew;
            var effectiveAt = clockSkewed ? now : op.ClientUpdatedAt;

            var key = (op.HabitId, op.LocalDate);
            if (!touched.TryGetValue(key, out var cell))
            {
                cell = await _checkIns.GetCellAsync(userId, op.HabitId, op.LocalDate, ct);
            }

            SyncOutcome outcome;

            if (cell is null)
            {
                cell = new CheckIn
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    HabitId = op.HabitId,
                    LocalDate = op.LocalDate,
                    Status = op.Status,
                    ClientUpdatedAt = effectiveAt,
                    ServerReceivedAt = now,
                    DeviceId = deviceId,
                    ClockSkewDetected = clockSkewed,
                    Seq = await _sequence.NextAsync(ct)
                };

                await _checkIns.AddAsync(cell, ct);
                outcome = SyncOutcome.Applied;
            }
            else if (Wins(effectiveAt, deviceId, cell))
            {
                cell.Status = op.Status;
                cell.ClientUpdatedAt = effectiveAt;
                cell.ServerReceivedAt = now;
                cell.DeviceId = deviceId;
                cell.ClockSkewDetected = clockSkewed;
                cell.Seq = await _sequence.NextAsync(ct);

                outcome = SyncOutcome.Applied;
            }
            else
            {
                // A newer action for this day already won. The operation is still
                // recorded so a retry of it stays a no-op, and so the device can be
                // told its change lost rather than silently disappearing.
                outcome = SyncOutcome.Superseded;
            }

            touched[key] = cell;

            await _operations.AddAsync(new SyncOperation
            {
                OpId = op.OpId,
                UserId = userId,
                HabitId = op.HabitId,
                LocalDate = op.LocalDate,
                Status = op.Status,
                ClientUpdatedAt = effectiveAt,
                DeviceId = deviceId,
                ReceivedAt = now,
                Outcome = outcome
            }, ct);

            results.Add(new SyncOperationResultDTO(op.OpId, outcome));
        }

        await _checkIns.SaveAsync(ct);
        await _operations.SaveAsync(ct);

        var changes = await _checkIns.GetChangesSinceAsync(userId, request.SinceSeq, ct);
        var maxSeq = changes.Count == 0 ? request.SinceSeq : changes.Max(c => c.Seq);

        return new SyncResponse(
            results,
            changes.Select(ToStateDto).ToList(),
            maxSeq,
            now);
    }

    /// <summary>
    /// Last write wins, measured by when the user acted rather than when the data
    /// reached the server. A phone that ticked at the gym and synced an hour later
    /// should not beat a tablet the user actually used afterwards.
    /// </summary>
    private static bool Wins(DateTime incomingAt, string incomingDevice, CheckIn current)
    {
        if (incomingAt != current.ClientUpdatedAt)
        {
            return incomingAt > current.ClientUpdatedAt;
        }

        // Identical instants are rare but must not be settled by luck: the same
        // inputs have to produce the same state on every replay.
        return string.CompareOrdinal(incomingDevice, current.DeviceId) > 0;
    }

    private static CheckInStateDTO ToStateDto(CheckIn c) => new(
        c.HabitId,
        c.LocalDate,
        c.Status,
        c.ClientUpdatedAt,
        c.DeviceId,
        c.ClockSkewDetected,
        c.Seq);
}
