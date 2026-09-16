import { IconCheck, IconClose } from './Icons'
import { HABIT_ICONS } from '../icons/habitIcons'
import { cellKey } from '../hooks/useHabitBoard'
import { formatDayMonth } from '../lib/dates'

export default function HabitCard({
  habit,
  today,
  pendingKeys,
  failedKeys,
  onToggle,
  onArchive,
}) {
  console.log('HABIT:', habit)
  const todayPending = pendingKeys.has(cellKey(habit.id, today));
  const todayFailed = failedKeys.has(cellKey(habit.id, today));

  const statusLabel = todayFailed
    ? "Lỗi gửi"
    : todayPending
      ? "Đang chờ"
      : "Đã đồng bộ";
  const statusClass = todayFailed
    ? "bg-failed/10 text-failed"
    : todayPending
      ? "bg-pending/12 text-pending"
      : "bg-accent/10 text-accent";

  // "0 ngày liên tiếp" sitting next to "dài nhất 4" reads like a contradiction
  // unless the label says which question each number answers. The big number is
  // the run still going right now; the small one is the record.
  const streakLabel =
    habit.currentStreak > 0
      ? "ngày liên tiếp tính tới hôm nay"
      : habit.longestStreak > 0
        ? "ngày liên tiếp — Chuỗi đã dừng"
        : "ngày liên tiếp — Chưa bắt đầu";

  const days = habit.recentDays;
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  // Which devices settled the days on screen. Only worth naming when more than
  // one took part, otherwise it is noise on every single habit.
  const devices = [...new Set(days.map((d) => d.deviceId).filter(Boolean))];

  return (
    <div className="py-6">
      <div className="flex items-start justify-between gap-4">
        {/* Left: habit identity + stats */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface"
          >
            {HABIT_ICONS[habit.emoji] ? (
              <img src={HABIT_ICONS[habit.emoji]} alt="" className="h-5 w-5" />
            ) : (
              <span className="text-muted">•</span>
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-medium">{habit.name}</h2>

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>

            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold leading-none tabular-nums">
                {habit.currentStreak}
              </span>

              <span className="text-sm text-muted">{streakLabel}</span>
            </p>

            <p className="mt-1.5 text-xs text-muted">
              Chuỗi dài nhất:{" "}
              <span className="tabular-nums">{habit.longestStreak}</span> ngày ·
              Đã thực hiện{" "}
              <span className="tabular-nums">
                {habit.completionRatePercent}%
              </span>{" "}
              trong 30 ngày
            </p>
          </div>
        </div>

        {/* Right: today's action + archive */}
        <div className="flex shrink-0 items-start gap-2">
          <button
            onClick={() => onToggle(habit.id, today, !habit.doneToday)}
            aria-pressed={habit.doneToday}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition active:scale-[0.98] ${
              habit.doneToday
                ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
                : "border-edge bg-surface/60 text-ink hover:border-muted/50"
            }`}
          >
            {habit.doneToday ? (
              <IconCheck size={16} />
            ) : (
              <span className="h-4 w-4 rounded-4px border border-muted/60" />
            )}

            {habit.doneToday ? "Đã xong hôm nay" : "Đánh dấu hôm nay"}
          </button>

          <button
            onClick={() => onArchive(habit.id)}
            title="Xóa thói quen"
            aria-label={`Xóa ${habit.name}`}
            className="shrink-0 rounded-md p-1.5 text-muted/70 transition hover:text-failed active:scale-[0.95]"
          >
            <IconClose size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        {/* Two rows rather than one. Thirty cells across this card would be under
            17px wide, too small for a legible number — and without the number the
            only way to find a date is to hover every square, which costs a whole
            extra action just to aim. */}
        <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
          {days.map((cell) => {
            const pending = pendingKeys.has(cellKey(habit.id, cell.date));
            const failed = failedKeys.has(cellKey(habit.id, cell.date));
            const isToday = cell.date === today;
            const dayNumber = Number(cell.date.slice(8, 10));

            const hint = [
              formatDayMonth(cell.date),
              cell.deviceId,
              pending ? "đang chờ đồng bộ" : null,
              isToday ? "hôm nay" : null,
            ]
              .filter(Boolean)
              .join(" · ");

            const fill = failed
              ? "bg-failed text-white"
              : pending
                ? "bg-pending text-white"
                : cell.done
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:bg-muted/20";

            return (
              <button
                key={cell.date}
                onClick={() => onToggle(habit.id, cell.date, !cell.done)}
                title={hint}
                aria-label={hint}
                className={`grid aspect-square place-items-center rounded-[5px] text-[11px] tabular-nums transition active:scale-90 ${fill} ${
                  isToday ? "ring-2 ring-ink/50" : ""
                }`}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>

        {/* The cells carry the day of the month; these carry the month itself. */}
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted">
          <span className="tabular-nums">{formatDayMonth(firstDay.date)}</span>

          {devices.length > 1 && (
            <span className="truncate">
              Được thao tác từ các thiết bị: {devices.join(", ")}
            </span>
          )}

          <span className="tabular-nums">
            Hôm nay {formatDayMonth(lastDay.date)}
          </span>
        </div>
      </div>
    </div>
  );
}
