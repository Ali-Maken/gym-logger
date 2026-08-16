import { describe, expect, it } from 'vitest'
import { validateExportPayload } from '../exportPayload'

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
