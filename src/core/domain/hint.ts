import type { Exercise, LoggedExercise } from './types'

/**
 * "↑ add weight" when every set logged last time hit or beat today's target reps.
 * Reps-only, ignoring set-count differences between templates, so the hint
 * survives the Week 1 → A/B graduation. Never on seconds or tick exercises.
 */
export function shouldSuggestWeightIncrease(
  exercise: Exercise,
  last: LoggedExercise | undefined,
  targetReps: number,
): boolean {
  if (exercise.measure !== 'weightReps') return false
  if (!last || last.sets.length === 0) return false
  return last.sets.every((set) => set.value >= targetReps)
}
