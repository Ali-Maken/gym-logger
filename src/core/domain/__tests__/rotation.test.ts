import { describe, expect, it } from 'vitest'
import { suggestTemplate } from '../rotation'
import type { Session, TemplateId } from '../types'

let counter = 0
function session(templateId: TemplateId, finishedAt?: number): Session {
  counter += 1
  return { id: `s${counter}`, templateId, startedAt: finishedAt ?? 1000, finishedAt, exercises: [] }
}

describe('suggestTemplate', () => {
  it('suggests week1 with no history', () => {
    expect(suggestTemplate([])).toBe('week1')
  })

  it('suggests week1 below three finished week1 sessions', () => {
    expect(suggestTemplate([session('week1', 1), session('week1', 2)])).toBe('week1')
  })

  it('graduates to workout a after three finished week1 sessions', () => {
    expect(suggestTemplate([session('week1', 1), session('week1', 2), session('week1', 3)])).toBe('a')
  })

  it('ignores abandoned sessions entirely', () => {
    const sessions = [session('week1', 1), session('week1', 2), session('week1'), session('a')]
    expect(suggestTemplate(sessions)).toBe('week1')
  })

  it('alternates to the opposite of the last finished a/b', () => {
    const base = [session('week1', 1), session('week1', 2), session('week1', 3)]
    expect(suggestTemplate([...base, session('a', 4)])).toBe('b')
    expect(suggestTemplate([...base, session('a', 4), session('b', 5)])).toBe('a')
  })

  it('picks the last a/b by finish time, not array order', () => {
    const base = [session('week1', 1), session('week1', 2), session('week1', 3)]
    expect(suggestTemplate([...base, session('b', 9), session('a', 4)])).toBe('a')
  })

  it('a later week1 session does not disturb the a/b alternation', () => {
    const sessions = [
      session('week1', 1),
      session('week1', 2),
      session('week1', 3),
      session('a', 4),
      session('week1', 10),
    ]
    expect(suggestTemplate(sessions)).toBe('b')
  })
})
