import { cellKey } from '../hooks/useHabitBoard'
import { formatDayMonth } from '../lib/dates'
import { IconCheck, IconX } from './Icons'

export default function HabitCard({ habit, today, pendingKeys, failedKeys, onToggle, onArchive }) {
  const todayPending = pendingKeys.has(cellKey(habit.id, today))
  const todayFailed = failedKeys.has(cellKey(habit.id, today))

  const statusLabel = todayFailed ? 'lỗi gửi' : todayPending ? 'đang chờ' : 'đã đồng bộ'
  const statusClass = todayFailed
    ? 'bg-failed/10 text-failed'
    : todayPending
      ? 'bg-pending/12 text-pending'
      : 'bg-accent/10 text-accent'

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
              : 'border-edge bg-panel text-muted hover:border-muted/50'
          }`}
        >
          {habit.doneToday ? <IconCheck className="h-5 w-5" /> : habit.emoji || '○'}
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
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl font-semibold leading-none tabular-nums">
              {habit.currentStreak}
            </span>
            <span className="text-sm text-muted">ngày liên tiếp</span>
            <span className="ml-auto text-xs tabular-nums text-muted">
              dài nhất {habit.longestStreak} · {habit.completionRatePercent}% trong 30 ngày
            </span>
          </div>
        </div>

        <button
          onClick={() => onArchive(habit.id)}
          title="Lưu trữ thói quen"
          aria-label={`Lưu trữ ${habit.name}`}
          className="shrink-0 rounded-md p-1.5 text-muted/70 transition hover:text-failed active:scale-[0.95]"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 sm:pl-[3.75rem]">
        {/* One row, one column per day, so the grid never wraps and the two date
            labels underneath keep meaning whatever window size is asked for. */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {days.map((cell) => {
            const pending = pendingKeys.has(cellKey(habit.id, cell.date))
            const failed = failedKeys.has(cellKey(habit.id, cell.date))
            const isToday = cell.date === today

            const hint = [
              formatDayMonth(cell.date),
              cell.deviceId,
              pending ? 'đang chờ đồng bộ' : null,
              isToday ? 'hôm nay' : null,
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <button
                key={cell.date}
                onClick={() => onToggle(habit.id, cell.date, !cell.done)}
                title={hint}
                className={`aspect-square rounded-[3px] transition active:scale-90 ${
                  isToday ? 'ring-1 ring-inset ring-ink/40' : ''
                } ${
                  failed
                    ? 'bg-failed/70'
                    : pending
                      ? 'bg-pending/60'
                      : cell.done
                        ? 'bg-accent/75'
                        : 'bg-edge hover:bg-muted/30'
                }`}
              />
            )
          })}
        </div>

        {/* Without these the grid is thirty anonymous squares and the only way to
            find out which day is which is to hover every one of them. */}
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-muted">
          <span className="tabular-nums">{formatDayMonth(firstDay.date)}</span>

          {devices.length > 1 && (
            <span className="truncate">ghi từ {devices.join(', ')}</span>
          )}

          <span className="tabular-nums">hôm nay {formatDayMonth(lastDay.date)}</span>
        </div>
      </div>
    </div>
  )
}
