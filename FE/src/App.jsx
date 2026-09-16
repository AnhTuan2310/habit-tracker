import AddHabitForm from './components/AddHabitForm'
import HabitCard from './components/HabitCard'
import OverrideNotice from './components/OverrideNotice'
import SyncBanner from './components/SyncBanner'
import Toolbar from './components/Toolbar'
import { useHabitBoard } from './hooks/useHabitBoard'

export default function App() {
  const {
    today,
    board,
    deviceId,
    offline,
    syncing,
    error,
    pending,
    pendingKeys,
    failedKeys,
    overrides,
    lastSyncedAt,
    lastSeq,
    toggle,
    addHabit,
    archive,
    setOffline,
    switchDevice,
    dismissOverrides,
    flush,
  } = useHabitBoard()

  const alerts = (
    <>
      <SyncBanner pending={pending} offline={offline} error={error} />
      <OverrideNotice overrides={overrides} habits={board?.habits} onDismiss={dismissOverrides} />
    </>
  )

  const hasAlerts = pending.length > 0 || overrides.length > 0 || (error && !offline)

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {/* Uneven spacing on purpose: the toolbar belongs to the header, the alerts
          need air around them, and the habit list is the body of the page. */}
      <header>
        <h1 className="text-[28px] font-semibold leading-tight">Habit Tracker</h1>
        <p className="mt-1 text-sm text-muted">Hôm nay {today}</p>
      </header>

      <div className="mt-5">
        <Toolbar
          deviceId={deviceId}
          offline={offline}
          syncing={syncing}
          lastSyncedAt={lastSyncedAt}
          pendingCount={pending.length}
          lastSeq={lastSeq}
          onToggleOffline={setOffline}
          onSwitchDevice={switchDevice}
          onSyncNow={flush}
        />
      </div>

      {hasAlerts && <div className="mt-6 space-y-3">{alerts}</div>}

      <div className="mt-8">
        <AddHabitForm onAdd={addHabit} />
      </div>

      {!board ? (
        <p className="mt-8 text-sm text-muted">Đang tải…</p>
      ) : board.habits.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Chưa có thói quen nào. Thêm một cái ở trên.</p>
      ) : (
        <div className="mt-2 divide-y divide-edge">
          {board.habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              today={today}
              pendingKeys={pendingKeys}
              failedKeys={failedKeys}
              onToggle={toggle}
              onArchive={archive}
            />
          ))}
        </div>
      )}

      <footer className="mt-12 border-t border-edge pt-5 text-xs leading-relaxed text-muted">
        Mỗi tab là một thiết bị riêng. Mở tab thứ hai, bật Ngoại tuyến ở một bên và tick cùng một
        thói quen ở cả hai để xem cách xử lý xung đột.
      </footer>
    </div>
  )
}
