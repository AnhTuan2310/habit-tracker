const KEY = 'habit-tracker.deviceId'
const SEQ_KEY = 'habit-tracker.lastSeq'

/**
 * The device id lives in sessionStorage, not localStorage, so every browser tab
 * is its own device. That is what makes the two-device scenario reproducible:
 * open a second tab and you are a second device, with no extra setup.
 */
export function getDeviceId() {
  let id = sessionStorage.getItem(KEY)
  if (!id) {
    id = `device-${crypto.randomUUID().slice(0, 4)}`
    sessionStorage.setItem(KEY, id)
  }
  return id
}

export function renameDevice(id) {
  sessionStorage.setItem(KEY, id)
  sessionStorage.removeItem(SEQ_KEY)
}

/** How far this device has caught up. Per device, so it is stored per tab too. */
export function getLastSeq() {
  return Number(sessionStorage.getItem(SEQ_KEY) ?? 0)
}

export function setLastSeq(seq) {
  sessionStorage.setItem(SEQ_KEY, String(seq))
}
