import { describe, expect, it } from 'vitest'
import { summarizePayload, validateExportPayload } from '../exportPayload'
import type { ExportPayload, Session } from '../types'

const validPayload = () => ({
  version: 1,
  sessions: [
    {
      id: 's1',
      templateId: 'a',
      startedAt: 1000,
      finishedAt: 2000,
      exercises: [{ exerciseId: 'leg-press', setup: 'seat 4', sets: [{ value: 12, weight: 45 }] }],
    },
  ],
  templates: [{ id: 'a', name: 'Workout A', entries: [{ exerciseId: 'leg-press', sets: 3, target: 12 }] }],
  prefs: { layout: 'sheet' },
})

describe('validateExportPayload', () => {
  it('accepts a valid payload and returns it typed', () => {
    const payload = validateExportPayload(validPayload())
    expect(payload.sessions[0]?.exercises[0]?.sets[0]?.weight).toBe(45)
    expect(payload.prefs['layout']).toBe('sheet')
  })

  it('defaults missing prefs to an empty object', () => {
    const { prefs: _ignored, ...withoutPrefs } = validPayload()
    expect(validateExportPayload(withoutPrefs).prefs).toEqual({})
  })

  it('rejects non-objects and wrong versions', () => {
    expect(() => validateExportPayload('nope')).toThrow(/not an object/)
    expect(() => validateExportPayload({ ...validPayload(), version: 2 })).toThrow(/unsupported version 2/)
  })

  it('rejects a bad field with its path in the message', () => {
    const bad = validPayload()
    bad.sessions[0]!.exercises[0]!.sets[0]!.value = 'twelve' as unknown as number
    expect(() => validateExportPayload(bad)).toThrow('sessions[0].exercises[0].sets[0].value is not a number')
  })

  it('rejects unknown template ids and non-finite numbers', () => {
    const badTemplate = validPayload()
    badTemplate.sessions[0]!.templateId = 'c'
    expect(() => validateExportPayload(badTemplate)).toThrow(/templateId is not a template id/)

    const badNumber = validPayload()
    badNumber.sessions[0]!.startedAt = Number.NaN
    expect(() => validateExportPayload(badNumber)).toThrow(/startedAt is not a number/)
  })
})

describe('summarizePayload', () => {
  const session = (id: string, startedAt: number): Session => ({ id, templateId: 'a', startedAt, exercises: [] })
  const payload = (sessions: Session[]): ExportPayload => ({ version: 1, sessions, templates: [], prefs: {} })

  it('counts sessions and spans their start dates', () => {
    const sessions = [
      session('s1', new Date(2026, 7, 16).getTime()),
      session('s2', new Date(2026, 7, 1).getTime()),
    ]
    expect(summarizePayload(payload(sessions))).toBe('2 sessions, Aug 1–16')
  })

  it('handles empty and singular payloads', () => {
    expect(summarizePayload(payload([]))).toBe('0 sessions')
    expect(summarizePayload(payload([session('s1', new Date(2026, 7, 5).getTime())]))).toBe('1 session, Aug 5')
  })
})
