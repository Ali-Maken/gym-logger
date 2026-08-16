import type { Exercise, LoggedExercise, TemplateEntry } from './types'

/** Today's dose for a session row: '3 × 12', '3 × 30s', '15 min'. */
export function formatTarget(exercise: Exercise, entry: TemplateEntry): string {
  switch (exercise.measure) {
    case 'weightReps':
      return `${entry.sets} × ${entry.target}`
    case 'seconds':
      return `${entry.sets} × ${entry.target}s`
    case 'tick':
      return `${entry.target} min`
  }
}

/** Last session's result for a session row: '45kg · 12/12/10', '30/30/25s', '15 min', 'never'. */
export function formatLastResult(exercise: Exercise, last: LoggedExercise | undefined): string {
  if (!last || last.sets.length === 0) return 'never'
  const values = last.sets.map((s) => s.value)
  switch (exercise.measure) {
    case 'weightReps': {
      const weight = topWeight(last)
      const reps = values.join('/')
      return weight === undefined ? reps : `${weight}kg · ${reps}`
    }
    case 'seconds':
      return `${values.join('/')}s`
    case 'tick':
      return `${values[0]} min`
  }
}

/**
 * One line in the guide's log shape: name · setup · weight · values · note.
 * Round-trips 'Plank  30 / 30 / 25s' and 'Walk  incline 6  15 min' faithfully.
 */
export function formatLogLine(exercise: Exercise, logged: LoggedExercise): string {
  const values = logged.sets.map((s) => s.value)
  const parts: (string | undefined)[] = [exercise.name, logged.setup]
  switch (exercise.measure) {
    case 'weightReps': {
      const weight = topWeight(logged)
      parts.push(weight === undefined ? undefined : `${weight}kg`, values.join(' / '))
      break
    }
    case 'seconds':
      parts.push(`${values.join(' / ')}s`)
      break
    case 'tick':
      parts.push(`${values[0]} min`)
      break
  }
  parts.push(logged.note)
  return parts.filter((p) => p !== undefined && p !== '').join('  ')
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** History-row date: 'Sun 17 Aug', with the year appended once it differs from now's. */
export function formatSessionDate(ts: number, now: number): string {
  const d = new Date(ts)
  const base = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  return d.getFullYear() === new Date(now).getFullYear() ? base : `${base} ${d.getFullYear()}`
}

/** Compact range for the import summary: 'Aug 1–16', 'Aug 28 – Sep 3', 'Dec 30 2025 – Jan 2 2026'. */
export function formatDateRange(fromTs: number, toTs: number): string {
  const from = new Date(fromTs)
  const to = new Date(toTs)
  const sameYear = from.getFullYear() === to.getFullYear()
  const year = (d: Date) => (sameYear ? '' : ` ${d.getFullYear()}`)
  if (sameYear && from.getMonth() === to.getMonth()) {
    const days = from.getDate() === to.getDate() ? `${from.getDate()}` : `${from.getDate()}–${to.getDate()}`
    return `${MONTHS[from.getMonth()]} ${days}`
  }
  return `${MONTHS[from.getMonth()]} ${from.getDate()}${year(from)} – ${MONTHS[to.getMonth()]} ${to.getDate()}${year(to)}`
}

/** Session duration: '48 min', '1 h 05 min'. */
export function formatDuration(startedAt: number, finishedAt: number): string {
  const minutes = Math.max(0, Math.round((finishedAt - startedAt) / 60_000))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}

/** Home-card recency label: 'never', 'today', 'yesterday', 'N days ago'. Calendar days, local time. */
export function formatDaysAgo(finishedAt: number | undefined, now: number): string {
  if (finishedAt === undefined) return 'never'
  const days = localDayIndex(now) - localDayIndex(finishedAt)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

/* Rounding absorbs the timezone offset and DST shifts in the local-midnight timestamp. */
function localDayIndex(ts: number): number {
  const d = new Date(ts)
  return Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000)
}

/** The weight to pre-fill next time: the heaviest set of the session. */
export function topWeight(logged: LoggedExercise): number | undefined {
  const weights = logged.sets.map((s) => s.weight).filter((w): w is number => w !== undefined)
  return weights.length === 0 ? undefined : Math.max(...weights)
}
