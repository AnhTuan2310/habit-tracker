import { formatDayMonth, minutesSince } from '../lib/dates'
import { FAILED_AFTER_ATTEMPTS, STALE_AFTER_MS } from '../hooks/useHabitBoard'

/**
 * Answers the awkward question: how would someone find out that a tick from days
 * ago never reached the server?
 *
 * The queue is the source of truth for that, and it is surfaced here. The banner
 * does not time out and cannot be dismissed while anything is still unsent, so a
 * change cannot go missing quietly the way a toast notification would allow.
 */
export default function SyncBanner({ pending, offline, error }) {
  if (pending.length === 0) {
    return error && !offline ? (
      <div className="rounded-xl border border-failed/40 bg-failed/10 px-4 py-3 text-sm text-failed">
        Không lấy được dữ liệu mới: {error}
      </div>
    ) : null
  }

  const oldest = pending[0]
  const waited = minutesSince(oldest.queuedAt)
  const stale = Date.now() - oldest.queuedAt > STALE_AFTER_MS
  const failing = pending.filter((o) => (o.attempts ?? 0) >= FAILED_AFTER_ATTEMPTS)

  const tone = failing.length > 0 || stale ? 'failed' : 'pending'

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm ${
        tone === 'failed'
          ? 'border border-failed/40 bg-failed/10 text-failed'
          : 'border border-pending/40 bg-pending/10 text-pending'
      }`}
    >
      <strong>
        {pending.length} thay đổi chưa được máy chủ ghi nhận
      </strong>
      <span className="opacity-80">
        {' '}· cũ nhất là ngày {formatDayMonth(oldest.localDate)}, đã chờ{' '}
        {waited < 1 ? 'dưới 1 phút' : `${waited} phút`}
      </span>

      {offline && <div className="mt-1 opacity-80">Thiết bị đang ở chế độ ngoại tuyến.</div>}

      {!offline && failing.length > 0 && (
        <div className="mt-1 opacity-80">
          {failing.length} thay đổi đã thử lại {FAILED_AFTER_ATTEMPTS} lần trở lên. Lỗi gần nhất:{' '}
          {failing[0].lastError}
        </div>
      )}
    </div>
  )
}
