import AddHabitForm from './components/AddHabitForm'
import HabitCard from './components/HabitCard'
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
    lastSeq,
    toggle,
    addHabit,
    archive,
    setOffline,
    switchDevice,
    flush,
  } = useHabitBoard()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Habit Tracker</h1>
        <p className="text-sm text-muted">Hôm nay {today}</p>
      </header>

      <div className="space-y-4">
        <Toolbar
          deviceId={deviceId}
          offline={offline}
          syncing={syncing}
          pendingCount={pending.length}
          lastSeq={lastSeq}
          onToggleOffline={setOffline}
          onSwitchDevice={switchDevice}
          onSyncNow={flush}
        />

        <SyncBanner pending={pending} offline={offline} error={error} />

        <AddHabitForm onAdd={addHabit} />

        {!board ? (
          <p className="text-muted">Đang tải…</p>
        ) : board.habits.length === 0 ? (
          <p className="text-muted">Chưa có thói quen nào. Thêm một cái ở trên.</p>
        ) : (
          <div className="space-y-3">
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
      </div>

      <footer className="mt-8 text-xs text-muted">
        Mỗi tab là một thiết bị riêng. Mở tab thứ hai, bật Ngoại tuyến ở một bên và
        tick cùng một thói quen ở cả hai để xem cách xử lý xung đột.
      </footer>
    </div>
  )
}
