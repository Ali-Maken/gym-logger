import { Link, useNavigate } from 'react-router'
import {
  formatDaysAgo,
  start,
  useActiveSession,
  useLastFinishedAt,
  useSuggestion,
  useTemplates,
  type Template,
  type TemplateId,
} from '../../core/logbook'
import './home.css'

export function HomePage() {
  const templates = useTemplates()
  const suggested = useSuggestion()
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
          <TemplateCard key={t.id} template={t} suggested={t.id === suggested} onStart={handleStart} />
        ))}
      </div>
      <nav className="home-foot">
        <Link to="/history" className="home-foot-link lbl">
          History
        </Link>
      </nav>
    </main>
  )
}

function TemplateCard({
  template,
  suggested,
  onStart,
}: {
  template: Template
  suggested: boolean
  onStart: (id: TemplateId) => Promise<void>
}) {
  const finishedAt = useLastFinishedAt(template.id)
  return (
    <button
      type="button"
      className={suggested ? 'home-card home-card-suggested' : 'home-card'}
      onClick={() => void onStart(template.id)}
    >
      <span className="home-card-main">
        <span className="home-card-name">{template.name}</span>
        <span className="home-card-last mono">{formatDaysAgo(finishedAt, Date.now())}</span>
      </span>
      <span className={suggested ? 'home-chip home-chip-suggested' : 'home-chip lbl'}>
        {suggested ? 'Up next' : 'Start'}
      </span>
    </button>
  )
}
