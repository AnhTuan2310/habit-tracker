import { useState } from 'react'

export default function AddHabitForm({ onAdd }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || busy) return

    setBusy(true)
    try {
      await onAdd(name.trim(), emoji.trim())
      setName('')
      setEmoji('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={emoji}
        onChange={(e) => setEmoji(e.target.value)}
        placeholder="🎯"
        aria-label="Biểu tượng"
        className="w-14 rounded-lg border border-edge bg-panel px-3 py-2 text-center outline-none focus:border-muted"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Thêm thói quen mới…"
        aria-label="Tên thói quen"
        className="flex-1 rounded-lg border border-edge bg-panel px-3 py-2 outline-none focus:border-muted"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="rounded-lg border border-edge px-4 py-2 text-sm hover:border-muted disabled:opacity-40"
      >
        Thêm
      </button>
    </form>
  )
}
