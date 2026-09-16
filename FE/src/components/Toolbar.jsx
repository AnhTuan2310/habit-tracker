import { formatAgo } from '../lib/dates'
import { IconClock, IconSync, IconWifi, IconWifiOff } from './Icons'

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
          offline ? 'bg-failed/12 text-failed' : 'bg-accent/12 text-accent'
        }`}
      >
        {offline ? <IconWifiOff size={16} /> : <IconWifi size={16} />}
        {offline ? 'Ngoại tuyến' : 'Trực tuyến'}
      </button>

      <button
        onClick={onSyncNow}
        disabled={syncing}
        className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-muted transition hover:text-ink active:scale-[0.97] disabled:opacity-40"
      >
        <IconSync size={16} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
      </button>

      <span className="ml-auto flex items-center gap-3 text-xs text-muted">
        {pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1 tabular-nums text-pending">
            <IconClock size={15} /> {pendingCount}
          </span>
        ) : (
          <span className="text-accent">đã đồng bộ</span>
        )}
        <span className="opacity-70">{formatAgo(lastSyncedAt)}</span>
        <span className="tabular-nums opacity-50">seq {lastSeq}</span>
      </span>
    </div>
  )
}
