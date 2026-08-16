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

/** The weight to pre-fill next time: the heaviest set of the session. */
export function topWeight(logged: LoggedExercise): number | undefined {
  const weights = logged.sets.map((s) => s.weight).filter((w): w is number => w !== undefined)
  return weights.length === 0 ? undefined : Math.max(...weights)
}
