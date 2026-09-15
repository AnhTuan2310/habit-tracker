import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../lib/api'
import * as queue from '../lib/queue'
import { getDeviceId, getLastSeq, renameDevice, setLastSeq } from '../lib/device'
import { todayLocal } from '../lib/dates'

const WINDOW_DAYS = 30
const RETRY_MS = 15000

/** After this long in the queue, an unsent change is called out in the UI. */
export const STALE_AFTER_MS = 2 * 60 * 1000

/** Attempts before a change is shown as failed rather than merely waiting. */
export const FAILED_AFTER_ATTEMPTS = 3

export const cellKey = (habitId, localDate) => `${habitId}|${localDate}`

export function useHabitBoard() {
  const [deviceId, setDeviceId] = useState(getDeviceId)
  const [board, setBoard] = useState(null)
  const [pending, setPending] = useState([])
  const [offline, setOfflineFlag] = useState(api.isOffline)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  const lastSeq = useRef(getLastSeq())
  const today = todayLocal()

  const refreshQueue = useCallback(async () => {
    setPending(await queue.listFor(deviceId))
  }, [deviceId])

  const loadBoard = useCallback(async () => {
    try {
      const data = await api.getBoard(today, WINDOW_DAYS)
      setBoard(data)
      lastSeq.current = Math.max(lastSeq.current, data.maxSeq)
      setLastSeq(lastSeq.current)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [today])

  /**
   * Hands the queue to the server and takes back whatever other devices changed.
   *
   * Every operation the server answers for is dropped from the queue, whatever the
   * outcome. Applied, Duplicate and Superseded all mean the same thing to the
   * client: the server has seen this action and there is nothing left to resend.
   */
  const flush = useCallback(async () => {
    const ops = await queue.listFor(deviceId)
    setSyncing(true)

    try {
      const result = await api.pushSync({
        deviceId,
        sinceSeq: lastSeq.current,
        operations: ops.map((o) => ({
          opId: o.opId,
          habitId: o.habitId,
          localDate: o.localDate,
          status: o.status,
          clientUpdatedAt: o.clientUpdatedAt,
        })),
      })

      lastSeq.current = Math.max(lastSeq.current, result.maxSeq)
      setLastSeq(lastSeq.current)

      await Promise.all(result.results.map((r) => queue.remove(r.opId)))
      setError(null)
      await loadBoard()
    } catch (e) {
      setError(e.message)
      await Promise.all(ops.map((o) => queue.bumpAttempt(o.opId, e.message)))
    } finally {
      setSyncing(false)
      await refreshQueue()
    }
  }, [deviceId, loadBoard, refreshQueue])

  /**
   * Records the tick locally and paints it immediately, then tries to send.
   *
   * The day cell updates at once, but the streak numbers do not: those are the
   * server's answer and stay as they were until it confirms. Recomputing them in
   * the browser would mean writing the same rule twice, in two languages, and
   * quietly disagreeing the first time one of them changed.
   */
  const toggle = useCallback(
    async (habitId, localDate, done) => {
      await queue.enqueue({
        opId: crypto.randomUUID(),
        deviceId,
        habitId,
        localDate,
        status: done ? 1 : 0,
        clientUpdatedAt: new Date().toISOString(),
        queuedAt: Date.now(),
        attempts: 0,
        lastError: null,
      })

      setBoard((current) => applyLocally(current, habitId, localDate, done))
      await refreshQueue()
      flush()
    },
    [deviceId, flush, refreshQueue],
  )

  const addHabit = useCallback(
    async (name, emoji) => {
      await api.createHabit(name, emoji)
      await loadBoard()
    },
    [loadBoard],
  )

  const archive = useCallback(
    async (habitId) => {
      await api.archiveHabit(habitId)
      await loadBoard()
    },
    [loadBoard],
  )

  const setOffline = useCallback(
    (value) => {
      api.setOffline(value)
      setOfflineFlag(value)
      if (!value) {
        flush()
      }
    },
    [flush],
  )

  const switchDevice = useCallback(
    (name) => {
      renameDevice(name)
      lastSeq.current = 0
      setDeviceId(name)
    },
    [],
  )

  useEffect(() => {
    loadBoard()
    refreshQueue()
  }, [loadBoard, refreshQueue])

  // A failed sync must not need the user to press anything to recover.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!api.isOffline()) {
        flush()
      }
    }, RETRY_MS)

    return () => clearInterval(timer)
  }, [flush])

  const pendingKeys = useMemo(
    () => new Set(pending.map((o) => cellKey(o.habitId, o.localDate))),
    [pending],
  )

  const failedKeys = useMemo(
    () =>
      new Set(
        pending
          .filter((o) => (o.attempts ?? 0) >= FAILED_AFTER_ATTEMPTS)
          .map((o) => cellKey(o.habitId, o.localDate)),
      ),
    [pending],
  )

  const oldestPending = pending.length > 0 ? pending[0] : null

  return {
    today,
    board,
    deviceId,
    offline,
    syncing,
    error,
    pending,
    pendingKeys,
    failedKeys,
    oldestPending,
    lastSeq: lastSeq.current,
    toggle,
    addHabit,
    archive,
    setOffline,
    switchDevice,
    flush,
  }
}

function applyLocally(board, habitId, localDate, done) {
  if (!board) return board

  return {
    ...board,
    habits: board.habits.map((habit) => {
      if (habit.id !== habitId) return habit

      return {
        ...habit,
        doneToday: localDate === board.today ? done : habit.doneToday,
        recentDays: habit.recentDays.map((cell) =>
          cell.date === localDate ? { ...cell, done } : cell,
        ),
      }
    }),
  }
}
