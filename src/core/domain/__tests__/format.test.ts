import { describe, expect, it } from 'vitest'
import { formatLastResult, formatLogLine, formatTarget, topWeight } from '../format'
import type { Exercise, LoggedExercise } from '../types'

const legPress: Exercise = { id: 'leg-press', name: 'Leg press', group: 'legs', measure: 'weightReps' }
const plank: Exercise = { id: 'plank', name: 'Plank', group: 'core', measure: 'seconds' }
const walk: Exercise = { id: 'incline-walk', name: 'Incline walk', group: 'cardio', measure: 'tick' }

describe('formatTarget', () => {
  it('formats each measure', () => {
    expect(formatTarget(legPress, { exerciseId: 'leg-press', sets: 3, target: 12 })).toBe('3 × 12')
    expect(formatTarget(plank, { exerciseId: 'plank', sets: 3, target: 30 })).toBe('3 × 30s')
    expect(formatTarget(walk, { exerciseId: 'incline-walk', sets: 1, target: 15 })).toBe('15 min')
  })
})

describe('formatLastResult', () => {
  it('shows never without history', () => {
    expect(formatLastResult(legPress, undefined)).toBe('never')
    expect(formatLastResult(legPress, { exerciseId: 'leg-press', sets: [] })).toBe('never')
  })

  it('shows top weight and reps per set', () => {
    const last: LoggedExercise = {
      exerciseId: 'leg-press',
      sets: [
        { value: 12, weight: 40 },
        { value: 12, weight: 45 },
        { value: 10, weight: 45 },
      ],
    }
    expect(formatLastResult(legPress, last)).toBe('45kg · 12/12/10')
  })

  it('shows seconds and minutes forms', () => {
    const plankLast: LoggedExercise = { exerciseId: 'plank', sets: [{ value: 30 }, { value: 30 }, { value: 25 }] }
    expect(formatLastResult(plank, plankLast)).toBe('30/30/25s')
    expect(formatLastResult(walk, { exerciseId: 'incline-walk', sets: [{ value: 15 }] })).toBe('15 min')
  })

  it('omits the weight part when no weight was logged', () => {
    expect(formatLastResult(legPress, { exerciseId: 'leg-press', sets: [{ value: 12 }, { value: 12 }] })).toBe('12/12')
  })
})

describe('formatLogLine (the guide log shape)', () => {
  it('round-trips the plank line', () => {
    const logged: LoggedExercise = { exerciseId: 'plank', sets: [{ value: 30 }, { value: 30 }, { value: 25 }] }
    expect(formatLogLine(plank, logged)).toBe('Plank  30 / 30 / 25s')
  })

  it('round-trips the walk line with setup', () => {
    const logged: LoggedExercise = { exerciseId: 'incline-walk', setup: 'incline 6', sets: [{ value: 15 }] }
    expect(formatLogLine(walk, logged)).toBe('Incline walk  incline 6  15 min')
  })

  it('renders the full weightReps shape: name · setup · weight · reps · note', () => {
    const logged: LoggedExercise = {
      exerciseId: 'leg-press',
      setup: 'seat 4',
      sets: [
        { value: 12, weight: 45 },
        { value: 12, weight: 45 },
        { value: 12, weight: 45 },
      ],
      note: 'easy, +weight next',
    }
    expect(formatLogLine(legPress, logged)).toBe('Leg press  seat 4  45kg  12 / 12 / 12  easy, +weight next')
  })
})

describe('topWeight', () => {
  it('picks the heaviest set and handles missing weights', () => {
    expect(topWeight({ exerciseId: 'x', sets: [{ value: 12, weight: 40 }, { value: 12, weight: 45 }] })).toBe(45)
    expect(topWeight({ exerciseId: 'x', sets: [{ value: 30 }] })).toBeUndefined()
  })
})
