import { describe, expect, it } from 'vitest'
import { listFinished } from '../history'
import type { Session } from '../types'

function session(id: string, finishedAt?: number): Session {
  return { id, templateId: 'week1', startedAt: 1, finishedAt, exercises: [] }
}

describe('listFinished', () => {
  it('drops abandoned sessions and sorts most recent first', () => {
    const sessions = [session('a', 5), session('b'), session('c', 9), session('d', 1)]
    expect(listFinished(sessions).map((s) => s.id)).toEqual(['c', 'a', 'd'])
  })

  it('leaves the input untouched', () => {
    const sessions = [session('a', 1), session('b', 2)]
    listFinished(sessions)
    expect(sessions.map((s) => s.id)).toEqual(['a', 'b'])
  })
})
