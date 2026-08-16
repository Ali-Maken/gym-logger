import { useState } from 'react'
import { setPref } from '../../core/logbook'
import { SESSION_VIEWS } from './views/registry'
import './switcher.css'

// Session-screen layout switcher (container chrome, not part of any layout).
// Collapsed to a small pill; the chosen layout persists via prefs.

export function LayoutSwitcher({ current }: { current: string }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button type="button" className="lsw mono" onClick={() => setOpen(true)} aria-label="change session layout">
        {SESSION_VIEWS[current].name} ▾
      </button>
    )
  }
  return (
    <div className="lsw lsw-open" role="menu" aria-label="session layout">
      {Object.entries(SESSION_VIEWS).map(([id, { name }]) => (
        <button
          type="button"
          key={id}
          className={`mono ${id === current ? 'on' : ''}`}
          onClick={() => {
            void setPref('sessionView', id)
            setOpen(false)
          }}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
