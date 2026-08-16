import { Link, Navigate, useParams } from 'react-router'
import {
  formatDuration,
  formatLogLine,
  formatSessionDate,
  useExercises,
  useSessions,
  useTemplates,
} from '../../core/logbook'
import './history.css'

/** One finished session in the guide's log shape: name · setup · weight · reps · note. */
export function SessionDetailPage() {
  const { sessionId } = useParams()
  const sessions = useSessions()
  const templates = useTemplates()
  const exercises = useExercises()

  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return <Navigate to="/history" replace />

  const template = templates.find((t) => t.id === session.templateId)
  const logged = session.exercises.filter((e) => e.sets.length > 0)

  return (
    <main className="phone history">
      <header className="history-head">
        <Link to="/history" className="history-back lbl">
          ‹ History
        </Link>
        <h1 className="disp">{template?.name ?? session.templateId}</h1>
        <p className="detail-meta mono">
          {formatSessionDate(session.startedAt, Date.now())}
          {session.finishedAt !== undefined && ` · ${formatDuration(session.startedAt, session.finishedAt)}`}
        </p>
      </header>
      <div className="detail-log mono">
        {logged.map((le) => {
          const exercise = exercises[le.exerciseId]
          return (
            <p key={le.exerciseId} className="detail-line">
              {exercise ? formatLogLine(exercise, le) : le.exerciseId}
            </p>
          )
        })}
        {logged.length === 0 && <p className="history-empty">Nothing logged.</p>}
      </div>
      {session.note && <p className="detail-note">{session.note}</p>}
    </main>
  )
}
