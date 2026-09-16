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
    <form onSubmit={submit} className="flex items-center gap-3 border-b border-edge pb-4">
      <input
        value={emoji}
        onChange={(e) => setEmoji(e.target.value)}
        placeholder="🎯"
        aria-label="Biểu tượng"
        maxLength={2}
        className="w-10 border-b border-transparent bg-transparent py-1.5 text-center text-lg transition placeholder:opacity-40 focus:border-muted"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Thêm thói quen mới…"
        aria-label="Tên thói quen"
        className="flex-1 border-b border-transparent bg-transparent py-1.5 text-ink transition placeholder:text-muted focus:border-muted"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:pointer-events-none disabled:text-muted disabled:opacity-50 active:scale-[0.97]"
      >
        Thêm
      </button>
    </form>
  )
}