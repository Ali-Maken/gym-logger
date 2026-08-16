import { describe, expect, it } from 'vitest'
import { shouldSuggestWeightIncrease } from '../hint'
import type { Exercise, LoggedExercise } from '../types'

const legPress: Exercise = { id: 'leg-press', name: 'Leg press', group: 'legs', measure: 'weightReps' }
const plank: Exercise = { id: 'plank', name: 'Plank', group: 'core', measure: 'seconds' }
const walk: Exercise = { id: 'incline-walk', name: 'Incline walk', group: 'cardio', measure: 'tick' }

const logged = (...values: number[]): LoggedExercise => ({
  exerciseId: 'leg-press',
  sets: values.map((value) => ({ value, weight: 45 })),
})

describe('shouldSuggestWeightIncrease', () => {
  it('never fires without history', () => {
    expect(shouldSuggestWeightIncrease(legPress, undefined, 12)).toBe(false)
  })

  it('never fires on seconds or tick exercises', () => {
    expect(shouldSuggestWeightIncrease(plank, logged(30, 30, 30), 30)).toBe(false)
    expect(shouldSuggestWeightIncrease(walk, logged(15), 15)).toBe(false)
  })

  it('fires when every last-time set hit or beat the target reps', () => {
    expect(shouldSuggestWeightIncrease(legPress, logged(12, 12, 12), 12)).toBe(true)
    expect(shouldSuggestWeightIncrease(legPress, logged(13, 12), 12)).toBe(true)
  })

  it('does not fire when any set fell short', () => {
    expect(shouldSuggestWeightIncrease(legPress, logged(12, 12, 10), 12)).toBe(false)
  })

  it('ignores set-count differences between templates', () => {
    // 2 sets logged under Week 1, judged against a 3-set A/B entry: reps-only
    expect(shouldSuggestWeightIncrease(legPress, logged(12, 12), 12)).toBe(true)
  })

  it('does not fire on an empty set list', () => {
    expect(shouldSuggestWeightIncrease(legPress, logged(), 12)).toBe(false)
  })
})
