/**
 * The user's own calendar date.
 *
 * Deliberately not `toISOString().slice(0, 10)`: that converts to UTC first, so
 * anyone ticking a habit late in the evening east of Greenwich would have it
 * recorded on the following day and watch their streak break for no reason.
 */
export function todayLocal(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDayMonth(isoDate) {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

export function minutesSince(timestamp) {
  return Math.floor((Date.now() - timestamp) / 60000)
}

/**
 * How long ago something happened, in words.
 *
 * Used to say how fresh the board is. What the server returns is a snapshot, and
 * another device may have changed something since. Saying how old the snapshot is
 * costs one line and takes the guesswork out of it.
 */
export function formatAgo(timestamp) {
  if (!timestamp) return 'chưa đồng bộ'

  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'vừa đồng bộ'
  if (seconds < 60) return `${seconds} giây trước`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`

  return `${Math.floor(minutes / 60)} giờ trước`
}
