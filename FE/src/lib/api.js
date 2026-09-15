/**
 * Every call goes through here, which gives the demo one honest place to cut the
 * network. This is a simulation: a real offline app would be cut off by the
 * browser or a service worker. Faking it at this layer keeps the scenario
 * reproducible on demand instead of requiring the reviewer to disable wifi.
 */
let offline = false

export const isOffline = () => offline
export const setOffline = (value) => {
  offline = value
}

class OfflineError extends Error {
  constructor() {
    super('Thiết bị đang ngoại tuyến')
    this.name = 'OfflineError'
  }
}

async function request(path, options = {}) {
  if (offline) {
    throw new OfflineError()
  }

  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const body = await res.json().catch(() => null)

  if (!res.ok || body?.success === false) {
    throw new Error(body?.message ?? `Máy chủ trả về ${res.status}`)
  }

  return body.data
}

export const getBoard = (today, days) =>
  request(`/api/habits?today=${today}&days=${days}`)

export const createHabit = (name, emoji) =>
  request('/api/habits', { method: 'POST', body: JSON.stringify({ name, emoji }) })

export const archiveHabit = (id) =>
  request(`/api/habits/${id}`, { method: 'DELETE' })

export const pushSync = (payload) =>
  request('/api/sync', { method: 'POST', body: JSON.stringify(payload) })
