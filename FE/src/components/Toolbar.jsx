/**
 * The controls that make the sync behaviour visible: which device this tab is,
 * whether it can reach the network, and how much is still waiting to go out.
 */
export default function Toolbar({
  deviceId,
  offline,
  syncing,
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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-panel px-4 py-3">
      <button
        onClick={rename}
        title="Đổi tên thiết bị của tab này"
        className="rounded-lg border border-edge px-3 py-1.5 text-sm hover:border-muted"
      >
        <span className="text-muted">thiết bị:</span> <strong>{deviceId}</strong>
      </button>

      <button
        onClick={() => onToggleOffline(!offline)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
          offline ? 'bg-failed/20 text-failed' : 'bg-accent/15 text-accent'
        }`}
      >
        {offline ? '⛔ Ngoại tuyến' : '🌐 Trực tuyến'}
      </button>

      <button
        onClick={onSyncNow}
        disabled={syncing}
        className="rounded-lg border border-edge px-3 py-1.5 text-sm hover:border-muted disabled:opacity-40"
      >
        {syncing ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
      </button>

      <span className="ml-auto text-sm text-muted">
        {pendingCount > 0 ? (
          <span className="text-pending">⏳ {pendingCount} thay đổi đang chờ</span>
        ) : (
          <span className="text-accent">✓ Đã đồng bộ</span>
        )}
        <span className="ml-3 opacity-60">seq {lastSeq}</span>
      </span>
    </div>
  )
}
