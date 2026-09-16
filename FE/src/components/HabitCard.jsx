import { Check, X } from '@phosphor-icons/react'
import { cellKey } from '../hooks/useHabitBoard'
import { formatDayMonth } from '../lib/dates'

export default function HabitCard({ habit, today, pendingKeys, failedKeys, onToggle, onArchive }) {
  const todayPending = pendingKeys.has(cellKey(habit.id, today))
  const todayFailed = failedKeys.has(cellKey(habit.id, today))

  const statusLabel = todayFailed ? 'lỗi gửi' : todayPending ? 'đang chờ' : 'đã đồng bộ'
  const statusClass = todayFailed
    ? 'bg-failed/10 text-failed'
    : todayPending
      ? 'bg-pending/12 text-pending'
      : 'bg-accent/10 text-accent'

  // "0 ngày liên tiếp" sitting next to "dài nhất 4" reads like a contradiction
  // unless the label says which question each number answers. The big number is
  // the run still going right now; the small one is the record.
  const streakLabel =
    habit.currentStreak > 0
      ? 'ngày liên tiếp tính tới hôm nay'
      : habit.longestStreak > 0
        ? 'ngày liên tiếp — chuỗi đã dừng'
        : 'ngày liên tiếp — chưa bắt đầu'

  const days = habit.recentDays
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  // Which devices settled the days on screen. Only worth naming when more than
  // one took part, otherwise it is noise on every single habit.
  const devices = [...new Set(days.map((d) => d.deviceId).filter(Boolean))]

  return (
    <div className="py-6">
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(habit.id, today, !habit.doneToday)}
          aria-label={`Đánh dấu ${habit.name}`}
          aria-pressed={habit.doneToday}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-xl transition active:scale-[0.95] ${
            habit.doneToday
              ? 'border-accent/30 bg-accent/10 text-accent'
              : 'border-edge bg-surface/60 text-muted hover:border-muted/50'
          }`}
        >
          {habit.doneToday ? <Check size={20} weight="bold" /> : habit.emoji || '○'}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-medium">{habit.name}</h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>

          {/* The streak is the entire point of the app, so it is the one number
              given real size. The rest stays as supporting detail. */}
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="text-3xl font-semibold leading-none tabular-nums">
              {habit.currentStreak}
            </span>

            <div className="min-w-0">
              <p className="text-sm text-muted">{streakLabel}</p>
              <p className="text-xs text-muted">
                dài nhất <span className="tabular-nums">{habit.longestStreak}</span> ngày ·{' '}
                <span className="tabular-nums">{habit.completionRatePercent}%</span> trong 30 ngày
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onArchive(habit.id)}
          title="Lưu trữ thói quen"
          aria-label={`Lưu trữ ${habit.name}`}
          className="shrink-0 rounded-md p-1.5 text-muted/70 transition hover:text-failed active:scale-[0.95]"
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      <div className="mt-4">
        {/* Two rows rather than one. Thirty cells across this card would be under
            17px wide, too small for a legible number — and without the number the
            only way to find a date is to hover every square, which costs a whole
            extra action just to aim. */}
        <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
          {days.map((cell) => {
            const pending = pendingKeys.has(cellKey(habit.id, cell.date))
            const failed = failedKeys.has(cellKey(habit.id, cell.date))
            const isToday = cell.date === today
            const dayNumber = Number(cell.date.slice(8, 10))

            const hint = [
              formatDayMonth(cell.date),
              cell.deviceId,
              pending ? 'đang chờ đồng bộ' : null,
              isToday ? 'hôm nay' : null,
            ]
              .filter(Boolean)
              .join(' · ')

            const fill = failed
              ? 'bg-failed text-white'
              : pending
                ? 'bg-pending text-white'
                : cell.done
                  ? 'bg-accent text-white'
                  : 'bg-surface text-muted hover:bg-muted/20'

            return (
              <button
                key={cell.date}
                onClick={() => onToggle(habit.id, cell.date, !cell.done)}
                title={hint}
                aria-label={hint}
                className={`grid aspect-square place-items-center rounded-[5px] text-[11px] tabular-nums transition active:scale-90 ${fill} ${
                  isToday ? 'ring-2 ring-ink/50' : ''
                }`}
              >
                {dayNumber}
              </button>
            )
          })}
        </div>

        {/* The cells carry the day of the month; these carry the month itself. */}
        <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted">
          <span className="tabular-nums">{formatDayMonth(firstDay.date)}</span>

          {devices.length > 1 && <span className="truncate">ghi từ {devices.join(', ')}</span>}

          <span className="tabular-nums">hôm nay {formatDayMonth(lastDay.date)}</span>
        </div>
      </div>
    </div>
  )
}
