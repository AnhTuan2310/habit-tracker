import { openDB } from 'idb'

const DB_NAME = 'habit-tracker'
const STORE = 'pending-ops'

/**
 * Actions are written here before they are sent, and only removed once the server
 * has answered for them. Closing the tab, losing the network or a failed request
 * therefore cannot lose a tick.
 *
 * IndexedDB is shared by every tab on this origin, so each record carries its
 * deviceId and every read is filtered by it. Without that, two tabs pretending to
 * be two devices would be draining each other's queue.
 */
const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    const store = db.createObjectStore(STORE, { keyPath: 'opId' })
    store.createIndex('byDevice', 'deviceId')
  },
})

export async function enqueue(op) {
  const db = await dbPromise
  await db.put(STORE, op)
}

export async function listFor(deviceId) {
  const db = await dbPromise
  const ops = await db.getAllFromIndex(STORE, 'byDevice', deviceId)
  return ops.sort((a, b) => a.queuedAt - b.queuedAt)
}

export async function remove(opId) {
  const db = await dbPromise
  await db.delete(STORE, opId)
}

export async function bumpAttempt(opId, message) {
  const db = await dbPromise
  const op = await db.get(STORE, opId)
  if (!op) return

  await db.put(STORE, { ...op, attempts: (op.attempts ?? 0) + 1, lastError: message })
}
