import { useNavigate } from 'react-router'
import { start, useActiveSession, useTemplates, type TemplateId } from '../../core/logbook'
import './home.css'

// Interim home: template list + start/resume. The suggestion rule and
// last-finished labels land in build step 5.

export function HomePage() {
  const templates = useTemplates()
  const active = useActiveSession()
  const navigate = useNavigate()

  async function handleStart(id: TemplateId) {
    await start(id)
    navigate('/session')
  }

  return (
    <main className="phone home">
      <header className="home-head">
        <h1 className="disp">Gym Logger</h1>
      </header>
      {active && (
        <button type="button" className="home-resume" onClick={() => navigate('/session')}>
          Resume session in progress
        </button>
      )}
      <div className="home-cards">
        {templates.map((t) => (
          <button type="button" key={t.id} className="home-card" onClick={() => void handleStart(t.id)}>
            <span className="home-card-name">{t.name}</span>
            <span className="lbl">Start</span>
          </button>
        ))}
      </div>
    </main>
  )
}
