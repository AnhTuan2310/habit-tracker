import AddHabitForm from './components/AddHabitForm'
import HabitCard from './components/HabitCard'
import OverrideNotice from './components/OverrideNotice'
import SyncBanner from './components/SyncBanner'
import Toolbar from './components/Toolbar'
import { useHabitBoard } from './hooks/useHabitBoard'

export default function App() {
  const {
    today,
    user,
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

  const hasAlerts = pending.length > 0 || overrides.length > 0 || (error && !offline)

  return (
    <div className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Habit Tracker</h1>
            <p className="mt-1 text-sm text-muted">Hôm nay {today}</p>
          </div>

          {/* No login yet, so this is the seeded user. It reads from /api/users/me
              rather than a constant so that adding auth changes the server only. */}
          <p className="text-sm text-muted">
            Xin chào,{' '}
            <span className="font-medium text-ink">{user ? user.name : 'bạn'}</span>
          </p>
        </header>

        {/* Everything lives on one raised card. The bone canvas behind it is what
            gives the page depth — content floating directly on the background had
            nothing holding it together. */}
        <main className="rounded-xl border border-edge bg-panel p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-7">
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

          {hasAlerts && (
            <div className="mt-5 space-y-3">
              <SyncBanner pending={pending} offline={offline} error={error} />
              <OverrideNotice
                overrides={overrides}
                habits={board?.habits}
                onDismiss={dismissOverrides}
              />
            </div>
          )}

          <div className="mt-6">
            <AddHabitForm onAdd={addHabit} />
          </div>

          {!board ? (
            <p className="mt-6 text-sm text-muted">Đang tải…</p>
          ) : board.habits.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Chưa có thói quen nào. Thêm một cái ở trên.</p>
          ) : (
            <div className="divide-y divide-edge">
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
        </main>

        <footer className="mt-5 px-1 text-xs leading-relaxed text-muted">
          Mỗi tab là một thiết bị riêng. Mở tab thứ hai, bật Ngoại tuyến ở một bên và tick cùng một
          thói quen ở cả hai để xem cách xử lý xung đột.
        </footer>
      </div>
    </div>
  )
}
