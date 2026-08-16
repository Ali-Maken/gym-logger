import { describe, expect, it } from 'vitest'
import { selectLastTime } from '../lastTime'
import type { LoggedExercise, Session } from '../types'

let counter = 0
function session(finishedAt: number | undefined, ...exercises: LoggedExercise[]): Session {
  counter += 1
  return { id: `s${counter}`, templateId: 'a', startedAt: finishedAt ?? 1000, finishedAt, exercises }
}

const legPress = (weight: number): LoggedExercise => ({
  exerciseId: 'leg-press',
  sets: [{ value: 12, weight }],
})

describe('selectLastTime', () => {
  it('returns undefined with no history', () => {
    expect(selectLastTime([], 'leg-press')).toBeUndefined()
  })

  it('skips unfinished sessions', () => {
    expect(selectLastTime([session(undefined, legPress(40))], 'leg-press')).toBeUndefined()
  })

  it('skips logged exercises with no sets', () => {
    const empty = session(5, { exerciseId: 'leg-press', setup: 'seat 4', sets: [] })
    expect(selectLastTime([empty], 'leg-press')).toBeUndefined()
  })

  it('picks the most recently finished occurrence, regardless of array order', () => {
    const sessions = [session(9, legPress(50)), session(4, legPress(40))]
    expect(selectLastTime(sessions, 'leg-press')?.sets[0]?.weight).toBe(50)
  })

  it('keeps variant histories separate', () => {
    const machine: LoggedExercise = { exerciseId: 'machine-curl', sets: [{ value: 12, weight: 20 }] }
    const dumbbell: LoggedExercise = { exerciseId: 'dumbbell-curl', sets: [{ value: 12, weight: 8 }] }
    const sessions = [session(1, machine), session(2, dumbbell)]
    expect(selectLastTime(sessions, 'machine-curl')?.sets[0]?.weight).toBe(20)
    expect(selectLastTime(sessions, 'dumbbell-curl')?.sets[0]?.weight).toBe(8)
  })
})
