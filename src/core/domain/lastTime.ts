import type { LoggedExercise, Session } from './types'

/**
 * The killer feature: what did I do last time on this exact exercise?
 * Variants are separate exercises, so lookup by id already isolates their histories.
 * Only finished sessions with at least one logged set count.
 */
export function selectLastTime(sessions: Session[], exerciseId: string): LoggedExercise | undefined {
  let best: { finishedAt: number; logged: LoggedExercise } | undefined
  for (const session of sessions) {
    if (session.finishedAt === undefined) continue
    const logged = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (!logged || logged.sets.length === 0) continue
    // >= so a same-millisecond tie resolves to the later session in the list
    if (!best || session.finishedAt >= best.finishedAt) best = { finishedAt: session.finishedAt, logged }
  }
  return best?.logged
}
