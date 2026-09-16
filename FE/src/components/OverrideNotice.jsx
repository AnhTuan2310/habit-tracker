import { ArrowsLeftRight } from '@phosphor-icons/react'
import { formatDayMonth } from '../lib/dates'

const ACTION = ['bỏ tick', 'tick']

/**
 * Tells the user when one of their own changes lost to another device.
 *
 * Without this the tick just reverts on screen with no explanation, which is the
 * one outcome guaranteed to make someone think the app lost their data. The
 * notice names the habit, the day, what they chose and which device overruled
 * them, and it stays until dismissed by hand.
 */
export default function OverrideNotice({ overrides, habits, onDismiss }) {
  if (overrides.length === 0) return null

  const nameOf = (id) => habits?.find((h) => h.id === id)?.name ?? 'thói quen đã lưu trữ'

  return (
    <div role="alert" className="flex items-start gap-2 border-l-2 border-pending py-2 pl-3 text-sm">
      <ArrowsLeftRight size={17} weight="bold" className="mt-0.5 shrink-0 text-pending" />

      <div className="min-w-0 flex-1">
        <p className="text-pending">
          <strong className="font-medium">{overrides.length} thay đổi của bạn</strong> đã bị thiết
          bị khác ghi đè
        </p>

        <ul className="mt-1 space-y-0.5 text-muted">
          {overrides.slice(-4).map((o) => (
            <li key={o.opId}>
              {nameOf(o.habitId)} ngày {formatDayMonth(o.localDate)} — bạn chọn{' '}
              <span className="text-ink">{ACTION[o.wanted]}</span>
              {o.winningDevice ? (
                <>
                  , <span className="text-ink">{o.winningDevice}</span> bấm sau nên giữ{' '}
                  <span className="text-ink">{ACTION[o.winningStatus]}</span>
                </>
              ) : (
                <>, một thiết bị khác đã bấm sau bạn</>
              )}
            </li>
          ))}
        </ul>

        {overrides.length > 4 && (
          <p className="mt-1 text-xs text-muted opacity-70">
            và {overrides.length - 4} thay đổi khác
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="shrink-0 rounded-md px-2 py-1 text-xs text-muted transition hover:text-ink active:scale-[0.97]"
      >
        Đã hiểu
      </button>
    </div>
  )
}
