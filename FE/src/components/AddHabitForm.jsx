import { useState } from 'react'

/**
 * A short list of ready-made icons beats an empty box: most people do not have an
 * emoji keyboard to hand, and an unlabelled text field that wants a symbol is a
 * dead end. Typing one still works for anything not on the list.
 */
const SUGGESTED = ['💧', '🏃', '📚', '🧘', '🌙', '🥗', '💊', '🧹', '✍️', '🎯']

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
    <form onSubmit={submit} className="border-b border-edge pb-4">
      <div className="flex items-center gap-3">
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
          className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/10 active:scale-[0.97] disabled:pointer-events-none disabled:text-muted disabled:opacity-50"
        >
          Thêm
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1 pl-1">
        <span className="mr-1 text-xs text-muted">biểu tượng:</span>
        {SUGGESTED.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => setEmoji(emoji === choice ? '' : choice)}
            aria-pressed={emoji === choice}
            className={`grid h-7 w-7 place-items-center rounded-md text-base transition active:scale-90 ${
              emoji === choice ? 'bg-accent/15 ring-1 ring-accent/40' : 'hover:bg-muted/15'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </form>
  )
}
