import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  exportJson,
  formatDuration,
  formatSessionDate,
  importJson,
  listFinished,
  previewImport,
  useSessions,
  useTemplates,
  type Session,
} from '../../core/logbook'
import './history.css'

export function HistoryPage() {
  const sessions = useSessions()
  const finished = useMemo(() => listFinished(sessions), [sessions])

  return (
    <main className="phone history">
      <header className="history-head">
        <Link to="/" className="history-back lbl">
          ‹ Home
        </Link>
        <h1 className="disp">History</h1>
      </header>
      <BackupPanel />
      {finished.length === 0 ? (
        <p className="history-empty">No finished sessions yet.</p>
      ) : (
        <div className="history-list">
          {finished.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      )}
    </main>
  )
}

function SessionRow({ session }: { session: Session }) {
  const templates = useTemplates()
  const name = templates.find((t) => t.id === session.templateId)?.name ?? session.templateId
  const exerciseCount = session.exercises.filter((e) => e.sets.length > 0).length
  return (
    <Link to={`/history/${session.id}`} className="history-row">
      <span className="history-row-main">
        <span className="history-row-date">{formatSessionDate(session.finishedAt!, Date.now())}</span>
        <span className="history-row-name">{name}</span>
      </span>
      <span className="history-row-meta mono">
        {formatDuration(session.startedAt, session.finishedAt!)} · {exerciseCount} ex
      </span>
    </Link>
  )
}

// Export is the only backup — keep it one tap. Restore is deliberately slower:
// paste/pick → validated summary → explicit replace-all confirm.
function BackupPanel() {
  const [copied, setCopied] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [restoreText, setRestoreText] = useState('')
  const [restored, setRestored] = useState(false)

  const preview = useMemo(() => {
    if (!restoreText.trim()) return null
    try {
      return { summary: previewImport(restoreText) }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }, [restoreText])

  async function handleCopy() {
    await navigator.clipboard.writeText(exportJson())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const stamp = new Date().toISOString().slice(0, 10)
    const url = URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `gym-logger-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(file: File | undefined) {
    if (file) setRestoreText(await file.text())
  }

  async function handleReplace() {
    await importJson(restoreText)
    setRestoreText('')
    setRestoreOpen(false)
    setRestored(true)
    setTimeout(() => setRestored(false), 3000)
  }

  return (
    <section className="backup">
      <span className="lbl">Backup — the only copy of your data</span>
      <div className="backup-actions">
        <button type="button" className="backup-btn" onClick={() => void handleCopy()}>
          {copied ? 'Copied ✓' : 'Copy JSON'}
        </button>
        <button type="button" className="backup-btn" onClick={handleDownload}>
          Save file
        </button>
        <button
          type="button"
          className={restoreOpen ? 'backup-btn backup-btn-active' : 'backup-btn'}
          onClick={() => setRestoreOpen((o) => !o)}
        >
          Restore…
        </button>
      </div>
      {restored && <p className="backup-ok">Restored ✓</p>}
      {restoreOpen && (
        <div className="restore">
          <textarea
            className="restore-input mono"
            rows={4}
            placeholder="Paste exported JSON…"
            value={restoreText}
            onChange={(e) => setRestoreText(e.target.value)}
          />
          <label className="backup-btn restore-file">
            Choose file
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </label>
          {preview && 'error' in preview && <p className="restore-error">{preview.error}</p>}
          {preview && 'summary' in preview && (
            <button type="button" className="restore-confirm" onClick={() => void handleReplace()}>
              {preview.summary} — replace current data
            </button>
          )}
        </div>
      )}
    </section>
  )
}
