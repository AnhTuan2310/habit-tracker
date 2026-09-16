import { useState } from 'react'
import HabitIconPicker from './HabitIconPicker'

export default function AddHabitForm({ onAdd }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('water_drop')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || busy) return

    setBusy(true)

    try {
      await onAdd(name.trim(), icon)
      setName('')
      setIcon('water_drop')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="border-b border-edge pb-4">
      <div className="flex items-center gap-3">
        <HabitIconPicker
          value={icon}
          onChange={setIcon}
        />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Thêm thói quen mới…"
          aria-label="Tên thói quen"
          className="
            flex-1 border-b border-transparent
            bg-transparent py-1.5 text-ink
            transition placeholder:text-muted
            focus:border-muted
          "
        />

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="
            shrink-0 rounded-md px-3 py-1.5
            text-sm font-medium text-accent
            transition hover:bg-accent/10
            active:scale-[0.97]
            disabled:pointer-events-none
            disabled:text-muted disabled:opacity-50
          "
        >
          Thêm
        </button>
      </div>
    </form>
  )
}