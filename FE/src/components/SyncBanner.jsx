import { Clock, WarningCircle } from '@phosphor-icons/react'
import { FAILED_AFTER_ATTEMPTS, STALE_AFTER_MS } from '../hooks/useHabitBoard'
import { formatDayMonth, minutesSince } from '../lib/dates'

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
      <div
        role="alert"
        className="flex items-start gap-2 border-l-2 border-failed py-2 pl-3 text-sm text-failed"
      >
        <WarningCircle size={17} weight="fill" className="mt-0.5 shrink-0" />
        <span>Không lấy được dữ liệu mới: {error}</span>
      </div>
    ) : null
  }

  const oldest = pending[0]
  const waited = minutesSince(oldest.queuedAt)
  const stale = Date.now() - oldest.queuedAt > STALE_AFTER_MS
  const failing = pending.filter((o) => (o.attempts ?? 0) >= FAILED_AFTER_ATTEMPTS)

  const tone = failing.length > 0 || stale ? 'failed' : 'pending'
  const toneClass = tone === 'failed' ? 'border-failed text-failed' : 'border-pending text-pending'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2 border-l-2 py-2 pl-3 text-sm ${toneClass}`}
    >
      {tone === 'failed' ? (
        <WarningCircle size={17} weight="fill" className="mt-0.5 shrink-0" />
      ) : (
        <Clock size={17} weight="fill" className="mt-0.5 shrink-0" />
      )}

      <div>
        <p>
          <strong className="font-medium">{pending.length} thay đổi</strong> chưa được máy chủ ghi
          nhận
          <span className="text-muted">
            {' '}
            · cũ nhất ngày {formatDayMonth(oldest.localDate)}, đã chờ{' '}
            {waited < 1 ? 'dưới 1 phút' : `${waited} phút`}
          </span>
        </p>

        {offline && <p className="mt-1 text-muted">Thiết bị đang ở chế độ ngoại tuyến.</p>}

        {!offline && failing.length > 0 && (
          <p className="mt-1 text-muted">
            {failing.length} thay đổi đã thử lại {FAILED_AFTER_ATTEMPTS} lần trở lên. Lỗi gần nhất:{' '}
            {failing[0].lastError}
          </p>
        )}
      </div>
    </div>
  )
}
