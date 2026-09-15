import { cellKey } from '../hooks/useHabitBoard'
import { formatDayMonth } from '../lib/dates'

export default function HabitCard({ habit, today, pendingKeys, failedKeys, onToggle, onArchive }) {
  const todayPending = pendingKeys.has(cellKey(habit.id, today))
  const todayFailed = failedKeys.has(cellKey(habit.id, today))

  return (
    <div className="rounded-xl border border-edge bg-panel p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(habit.id, today, !habit.doneToday)}
          aria-label={`Đánh dấu ${habit.name}`}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-xl transition ${
            habit.doneToday
              ? 'border-accent bg-accent/15 text-accent'
              : 'border-edge text-muted hover:border-muted'
          }`}
        >
          {habit.doneToday ? '✓' : habit.emoji || '○'}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-medium">{habit.name}</h2>
            {todayFailed ? (
              <span className="rounded bg-failed/20 px-1.5 py-0.5 text-xs text-failed">lỗi gửi</span>
            ) : todayPending ? (
              <span className="rounded bg-pending/20 px-1.5 py-0.5 text-xs text-pending">đang chờ</span>
            ) : (
              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs text-accent">đã đồng bộ</span>
            )}
          </div>

          <p className="mt-0.5 text-sm text-muted">
            Chuỗi hiện tại <strong className="text-ink">{habit.currentStreak}</strong> ngày · dài
            nhất <strong className="text-ink">{habit.longestStreak}</strong> ·{' '}
            {habit.completionRatePercent}% trong 30 ngày
          </p>
        </div>

        <button
          onClick={() => onArchive(habit.id)}
          title="Lưu trữ thói quen"
          className="shrink-0 rounded px-2 py-1 text-sm text-muted hover:text-failed"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {habit.recentDays.map((cell) => {
          const pending = pendingKeys.has(cellKey(habit.id, cell.date))
          const failed = failedKeys.has(cellKey(habit.id, cell.date))

          return (
            <button
              key={cell.date}
              onClick={() => onToggle(habit.id, cell.date, !cell.done)}
              title={`${formatDayMonth(cell.date)}${pending ? ' · đang chờ đồng bộ' : ''}`}
              className={`h-5 w-5 rounded-sm border transition ${
                failed
                  ? 'border-failed bg-failed/40'
                  : pending
                    ? 'border-pending bg-pending/40'
                    : cell.done
                      ? 'border-accent bg-accent/70'
                      : 'border-edge bg-edge/40 hover:border-muted'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
