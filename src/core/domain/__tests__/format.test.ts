import { describe, expect, it } from 'vitest'
import {
  formatDateRange,
  formatDaysAgo,
  formatDuration,
  formatLastResult,
  formatLogLine,
  formatSessionDate,
  formatTarget,
  topWeight,
} from '../format'
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

describe('formatDaysAgo', () => {
  const noon = new Date(2026, 7, 17, 12, 0).getTime()

  it('labels never, today, yesterday, and older by calendar day', () => {
    expect(formatDaysAgo(undefined, noon)).toBe('never')
    expect(formatDaysAgo(new Date(2026, 7, 17, 6, 0).getTime(), noon)).toBe('today')
    expect(formatDaysAgo(new Date(2026, 7, 16, 23, 30).getTime(), noon)).toBe('yesterday')
    expect(formatDaysAgo(new Date(2026, 7, 14, 9, 0).getTime(), noon)).toBe('3 days ago')
  })

  it('splits on midnight, not on 24-hour gaps', () => {
    const justAfterMidnight = new Date(2026, 7, 17, 0, 10).getTime()
    expect(formatDaysAgo(new Date(2026, 7, 16, 23, 50).getTime(), justAfterMidnight)).toBe('yesterday')
  })
})

describe('formatSessionDate', () => {
  const now = new Date(2026, 7, 17).getTime()

  it('shows weekday, day, month; year only when it differs from now', () => {
    expect(formatSessionDate(new Date(2026, 7, 16, 18, 30).getTime(), now)).toBe('Sun 16 Aug')
    expect(formatSessionDate(new Date(2025, 11, 31).getTime(), now)).toBe('Wed 31 Dec 2025')
  })
})

describe('formatDuration', () => {
  it('rounds to minutes and switches to hours past 60', () => {
    expect(formatDuration(0, 48 * 60_000)).toBe('48 min')
    expect(formatDuration(0, 65 * 60_000)).toBe('1 h 05 min')
    expect(formatDuration(0, 29_000)).toBe('0 min')
  })
})

describe('formatDateRange', () => {
  it('collapses within a month, spells out across months and years', () => {
    expect(formatDateRange(new Date(2026, 7, 1).getTime(), new Date(2026, 7, 16).getTime())).toBe('Aug 1–16')
    expect(formatDateRange(new Date(2026, 7, 5).getTime(), new Date(2026, 7, 5).getTime())).toBe('Aug 5')
    expect(formatDateRange(new Date(2026, 7, 28).getTime(), new Date(2026, 8, 3).getTime())).toBe('Aug 28 – Sep 3')
    expect(formatDateRange(new Date(2025, 11, 30).getTime(), new Date(2026, 0, 2).getTime())).toBe(
      'Dec 30 2025 – Jan 2 2026',
    )
  })
})

describe('topWeight', () => {
  it('picks the heaviest set and handles missing weights', () => {
    expect(topWeight({ exerciseId: 'x', sets: [{ value: 12, weight: 40 }, { value: 12, weight: 45 }] })).toBe(45)
    expect(topWeight({ exerciseId: 'x', sets: [{ value: 30 }] })).toBeUndefined()
  })
})
