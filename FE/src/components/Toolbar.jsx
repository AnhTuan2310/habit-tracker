import { formatAgo } from '../lib/dates'
import { IconClock, IconRefresh, IconWifi, IconWifiOff } from './Icons'

/**
 * The controls that make the sync behaviour visible: which device this tab is,
 * whether it can reach the network, and how much is still waiting to go out.
 */
export default function Toolbar({
  deviceId,
  offline,
  syncing,
  lastSyncedAt,
  pendingCount,
  lastSeq,
  onToggleOffline,
  onSwitchDevice,
  onSyncNow,
}) {
  const rename = () => {
    const next = window.prompt('Tên thiết bị cho tab này', deviceId)
    if (next && next.trim()) {
      onSwitchDevice(next.trim())
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-edge pb-4 text-sm">
      <button
        onClick={rename}
        title="Đổi tên thiết bị của tab này"
        className="rounded-md px-1 py-1 text-muted transition hover:text-ink active:scale-[0.97]"
      >
        thiết bị <span className="font-medium text-ink">{deviceId}</span>
      </button>

      <button
        onClick={() => onToggleOffline(!offline)}
        aria-pressed={!offline}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition active:scale-[0.97] ${
          offline ? 'bg-failed/15 text-failed' : 'bg-accent/15 text-accent'
        }`}
      >
        {offline ? <IconWifiOff className="h-3.5 w-3.5" /> : <IconWifi className="h-3.5 w-3.5" />}
        {offline ? 'Ngoại tuyến' : 'Trực tuyến'}
      </button>

      <button
        onClick={onSyncNow}
        disabled={syncing}
        className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-muted transition hover:text-ink disabled:opacity-40 active:scale-[0.97]"
      >
        <IconRefresh className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
      </button>

      <span className="ml-auto flex items-center gap-3 text-xs tabular-nums text-muted">
        {pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-pending">
            <IconClock className="h-3.5 w-3.5" /> {pendingCount}
          </span>
        ) : (
          <span className="text-accent">đã đồng bộ</span>
        )}
        <span className="opacity-60">{formatAgo(lastSyncedAt)} · seq {lastSeq}</span>
      </span>
    </div>
  )
}