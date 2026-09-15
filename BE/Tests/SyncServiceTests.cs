using Application.DTOs.Sync;
using Application.Services;
using Domain.Constants;
using Domain.Entities;
using Domain.Enums;
using Tests.Fakes;

namespace Tests;

public class SyncServiceTests
{
    private static readonly Guid UserId = AppDefaults.DemoUserId;
    private static readonly DateOnly Day = new(2026, 9, 15);
    private static readonly DateTime Now = new(2026, 9, 15, 12, 0, 0, DateTimeKind.Utc);

    private readonly FakeHabitRepository _habits = new();
    private readonly FakeCheckInRepository _checkIns = new();
    private readonly FakeSyncOperationRepository _operations = new();
    private readonly FakeClock _clock = new(Now);
    private readonly SyncService _service;
    private readonly Habit _habit;

    public SyncServiceTests()
    {
        _habit = _habits.Add(UserId, "Uống đủ nước");
        _service = new SyncService(_habits, _checkIns, _operations, new FakeSequenceProvider(), _clock);
    }

    private static SyncRequest Batch(string deviceId, params SyncOperationRequest[] operations)
        => new() { DeviceId = deviceId, SinceSeq = 0, Operations = operations.ToList() };

    private SyncOperationRequest Op(CheckInStatus status, DateTime clientUpdatedAt, Guid? opId = null)
        => new()
        {
            OpId = opId ?? Guid.NewGuid(),
            HabitId = _habit.Id,
            LocalDate = Day,
            Status = status,
            ClientUpdatedAt = clientUpdatedAt
        };

    [Fact]
    public async Task First_check_in_is_applied()
    {
        var result = await _service.SyncAsync(UserId, Batch("phone", Op(CheckInStatus.Done, Now)));

        Assert.Equal(SyncOutcome.Applied, result.Results.Single().Outcome);
        Assert.Equal(CheckInStatus.Done, _checkIns.Rows.Single().Status);
    }

    [Fact]
    public async Task Resending_the_same_operation_changes_nothing()
    {
        // The retry case: the client timed out and never learned the first attempt
        // had already landed, so it sends the identical operation again.
        var op = Op(CheckInStatus.Done, Now);

        await _service.SyncAsync(UserId, Batch("phone", op));
        var second = await _service.SyncAsync(UserId, Batch("phone", op));

        Assert.Equal(SyncOutcome.Duplicate, second.Results.Single().Outcome);
        Assert.Single(_checkIns.Rows);
    }

    [Fact]
    public async Task Two_devices_ticking_the_same_day_produce_one_row()
    {
        await _service.SyncAsync(UserId, Batch("phone", Op(CheckInStatus.Done, Now.AddMinutes(-10))));
        await _service.SyncAsync(UserId, Batch("tablet", Op(CheckInStatus.Done, Now.AddMinutes(-5))));

        Assert.Single(_checkIns.Rows);
    }

    [Fact]
    public async Task The_later_action_wins_even_when_it_arrives_first()
    {
        // The tablet acted later but synced first; the phone was offline at the gym
        // and only handed over its older action afterwards.
        await _service.SyncAsync(UserId, Batch("tablet", Op(CheckInStatus.Done, Now.AddMinutes(-5))));
        var late = await _service.SyncAsync(UserId, Batch("phone", Op(CheckInStatus.Undone, Now.AddMinutes(-30))));

        Assert.Equal(SyncOutcome.Superseded, late.Results.Single().Outcome);
        Assert.Equal(CheckInStatus.Done, _checkIns.Rows.Single().Status);
        Assert.Equal("tablet", _checkIns.Rows.Single().DeviceId);
    }

    [Fact]
    public async Task One_device_undoing_later_beats_an_earlier_done()
    {
        // The exact case the brief asks about: done on one device, undone on the
        // other. Whoever acted last is the one who meant it.
        await _service.SyncAsync(UserId, Batch("phone", Op(CheckInStatus.Done, Now.AddMinutes(-30))));
        var undo = await _service.SyncAsync(UserId, Batch("tablet", Op(CheckInStatus.Undone, Now.AddMinutes(-1))));

        Assert.Equal(SyncOutcome.Applied, undo.Results.Single().Outcome);
        Assert.Equal(CheckInStatus.Undone, _checkIns.Rows.Single().Status);
    }

    [Fact]
    public async Task A_wildly_wrong_client_clock_is_clamped()
    {
        // A device set to next year would otherwise win every conflict forever.
        var result = await _service.SyncAsync(UserId, Batch("broken", Op(CheckInStatus.Done, Now.AddYears(1))));

        var stored = _checkIns.Rows.Single();
        Assert.Equal(SyncOutcome.Applied, result.Results.Single().Outcome);
        Assert.True(stored.ClockSkewDetected);
        Assert.Equal(Now, stored.ClientUpdatedAt);
    }

    [Fact]
    public async Task A_clamped_action_no_longer_outranks_a_genuine_later_one()
    {
        await _service.SyncAsync(UserId, Batch("broken", Op(CheckInStatus.Done, Now.AddYears(1))));
        _clock.UtcNow = Now.AddMinutes(1);

        var honest = await _service.SyncAsync(UserId, Batch("phone", Op(CheckInStatus.Undone, Now.AddSeconds(30))));

        Assert.Equal(SyncOutcome.Applied, honest.Results.Single().Outcome);
        Assert.Equal(CheckInStatus.Undone, _checkIns.Rows.Single().Status);
    }

    [Fact]
    public async Task Identical_timestamps_are_settled_the_same_way_every_time()
    {
        // Rare, but it must not come down to arrival order, or two servers replaying
        // the same data would disagree.
        await _service.SyncAsync(UserId, Batch("aaa", Op(CheckInStatus.Done, Now)));
        var tie = await _service.SyncAsync(UserId, Batch("bbb", Op(CheckInStatus.Undone, Now)));

        Assert.Equal(SyncOutcome.Applied, tie.Results.Single().Outcome);
        Assert.Equal("bbb", _checkIns.Rows.Single().DeviceId);
    }

    [Fact]
    public async Task Two_operations_for_one_day_inside_a_single_batch_settle_correctly()
    {
        // A device that was offline queues a tick and then an untick, and hands both
        // over in the same request.
        var result = await _service.SyncAsync(UserId, Batch("phone",
            Op(CheckInStatus.Done, Now.AddMinutes(-20)),
            Op(CheckInStatus.Undone, Now.AddMinutes(-10))));

        Assert.All(result.Results, r => Assert.Equal(SyncOutcome.Applied, r.Outcome));
        Assert.Single(_checkIns.Rows);
        Assert.Equal(CheckInStatus.Undone, _checkIns.Rows.Single().Status);
    }

    [Fact]
    public async Task Out_of_order_operations_inside_one_batch_do_not_resurrect_old_state()
    {
        var result = await _service.SyncAsync(UserId, Batch("phone",
            Op(CheckInStatus.Undone, Now.AddMinutes(-10)),
            Op(CheckInStatus.Done, Now.AddMinutes(-20))));

        Assert.Equal(SyncOutcome.Applied, result.Results[0].Outcome);
        Assert.Equal(SyncOutcome.Superseded, result.Results[1].Outcome);
        Assert.Equal(CheckInStatus.Undone, _checkIns.Rows.Single().Status);
    }

    [Fact]
    public async Task A_device_catching_up_receives_what_it_missed()
    {
        await _service.SyncAsync(UserId, Batch("phone", Op(CheckInStatus.Done, Now.AddMinutes(-5))));

        var catchUp = await _service.SyncAsync(UserId, new SyncRequest
        {
            DeviceId = "tablet",
            SinceSeq = 0,
            Operations = new List<SyncOperationRequest>()
        });

        Assert.Single(catchUp.Changes);
        Assert.Equal(CheckInStatus.Done, catchUp.Changes.Single().Status);
        Assert.True(catchUp.MaxSeq > 0);
    }

    [Fact]
    public async Task A_device_already_up_to_date_receives_nothing()
    {
        await _service.SyncAsync(UserId, Batch("phone", Op(CheckInStatus.Done, Now.AddMinutes(-5))));
        var seq = _checkIns.Rows.Single().Seq;

        var catchUp = await _service.SyncAsync(UserId, new SyncRequest
        {
            DeviceId = "tablet",
            SinceSeq = seq,
            Operations = new List<SyncOperationRequest>()
        });

        Assert.Empty(catchUp.Changes);
        Assert.Equal(seq, catchUp.MaxSeq);
    }

    [Fact]
    public async Task An_unknown_habit_is_rejected()
    {
        var request = Batch("phone", new SyncOperationRequest
        {
            OpId = Guid.NewGuid(),
            HabitId = Guid.NewGuid(),
            LocalDate = Day,
            Status = CheckInStatus.Done,
            ClientUpdatedAt = Now
        });

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.SyncAsync(UserId, request));
    }

    [Fact]
    public async Task A_batch_without_a_device_id_is_rejected()
    {
        var request = Batch("   ", Op(CheckInStatus.Done, Now));

        await Assert.ThrowsAsync<ArgumentException>(() => _service.SyncAsync(UserId, request));
    }
}
