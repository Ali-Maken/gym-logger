import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  activeSession,
  chooseVariant,
  completeSet,
  exportJson,
  finish,
  hintFor,
  importJson,
  initLogbook,
  lastTimeFor,
  setExerciseNote,
  setPref,
  setSetup,
  start,
  suggestion,
  templates,
} from '../logbook'

beforeEach(async () => {
  await db.delete()
  await initLogbook()
})

async function finishSession(templateId: 'week1' | 'a' | 'b'): Promise<void> {
  await start(templateId)
  await finish()
}

describe('first run', () => {
  it('seeds templates in week1/a/b order and all 16 exercises', async () => {
    expect(templates().map((t) => t.id)).toEqual(['week1', 'a', 'b'])
    expect(templates()[1]?.name).toBe('Workout A · push & legs')
    expect(await db.exercises.count()).toBe(16)
    expect(await db.sessions.count()).toBe(0)
  })
})

describe('write-through', () => {
  it('start commits the session to Dexie', async () => {
    await start('week1')
    const active = activeSession()
    expect(active).not.toBeNull()
    expect(await db.sessions.get(active!.id)).toMatchObject({ templateId: 'week1' })
    expect(active!.finishedAt).toBeUndefined()
  })

  it('every completed set is in Dexie the moment the call resolves', async () => {
    await start('week1')
    const id = activeSession()!.id

    await completeSet('leg-press', { value: 12, weight: 45 })
    let stored = await db.sessions.get(id)
    expect(stored?.exercises[0]?.sets).toEqual([{ value: 12, weight: 45 }])

    await completeSet('leg-press', { value: 10, weight: 45 })
    stored = await db.sessions.get(id)
    expect(stored?.exercises[0]?.sets).toHaveLength(2)
  })

  it('setup and notes write through too', async () => {
    await start('week1')
    const id = activeSession()!.id
    await setSetup('leg-press', 'seat 4')
    await setExerciseNote('leg-press', 'easy')
    const stored = await db.sessions.get(id)
    expect(stored?.exercises[0]).toMatchObject({ setup: 'seat 4', note: 'easy' })
  })

  it('finish stamps finishedAt in Dexie and clears the active session', async () => {
    await start('week1')
    const id = activeSession()!.id
    await finish()
    expect(activeSession()).toBeNull()
    expect((await db.sessions.get(id))?.finishedAt).toBeTypeOf('number')
  })
})

describe('rotation through the public interface', () => {
  it('graduates week1 → a → alternating a/b; abandoned sessions never count', async () => {
    expect(suggestion()).toBe('week1')

    await finishSession('week1')
    await finishSession('week1')
    await start('week1') // abandoned: started, never finished
    expect(suggestion()).toBe('week1')

    await finishSession('week1')
    expect(suggestion()).toBe('a')

    await finishSession('a')
    expect(suggestion()).toBe('b')
    await finishSession('b')
    expect(suggestion()).toBe('a')
  })
})

describe('last time and hints', () => {
  it('lastTimeFor reads only finished sessions and the exact exercise id', async () => {
    await start('b')
    await completeSet('machine-curl', { value: 12, weight: 20 })
    expect(lastTimeFor('machine-curl')).toBeUndefined() // still active, not history yet
    await finish()

    expect(lastTimeFor('machine-curl')?.sets[0]?.weight).toBe(20)
    expect(lastTimeFor('dumbbell-curl')).toBeUndefined() // variant histories are separate
  })

  it('hintFor fires only when every last-time set hit the target', async () => {
    const entry = { exerciseId: 'leg-press', sets: 3, target: 12 }

    await start('a')
    await completeSet('leg-press', { value: 12, weight: 45 })
    await completeSet('leg-press', { value: 12, weight: 45 })
    await finish()
    expect(hintFor(entry)).toBe(true)

    await start('a')
    await completeSet('leg-press', { value: 12, weight: 47.5 })
    await completeSet('leg-press', { value: 9, weight: 47.5 })
    await finish()
    expect(hintFor(entry)).toBe(false)
  })
})

describe('resume after reload', () => {
  it('initLogbook resumes a recent unfinished session with its sets intact', async () => {
    await start('a')
    await completeSet('leg-press', { value: 12, weight: 45 })

    await initLogbook() // simulated app reload (e.g. SW auto-update)
    expect(activeSession()?.templateId).toBe('a')
    expect(activeSession()?.exercises[0]?.sets).toHaveLength(1)
  })

  it('does not resume finished or stale sessions', async () => {
    await finishSession('a')
    await initLogbook()
    expect(activeSession()).toBeNull()

    const stale = { id: 'old', templateId: 'a', startedAt: Date.now() - 5 * 60 * 60 * 1000, exercises: [] } as const
    await db.sessions.put({ ...stale, exercises: [] })
    await initLogbook()
    expect(activeSession()).toBeNull()
  })
})

describe('variants', () => {
  it('chooseVariant persists the last-used variant into the template', async () => {
    await chooseVariant('b', 4, 'incline-chest-press')
    expect(templates()[2]?.entries[4]?.exerciseId).toBe('incline-chest-press')
    const stored = await db.templates.get('b')
    expect(stored?.entries[4]?.exerciseId).toBe('incline-chest-press')
  })

  it('rejects an exercise that is not one of the entry choices', async () => {
    await expect(chooseVariant('b', 4, 'leg-press')).rejects.toThrow(/not a choice/)
  })
})

describe('export / import', () => {
  it('round-trips sessions, chosen variants, and prefs', async () => {
    await start('a')
    await completeSet('leg-press', { value: 12, weight: 45 })
    await finish()
    await chooseVariant('b', 4, 'incline-chest-press')
    await setPref('layout', 'focus')

    const json = exportJson()
    await db.delete()
    await initLogbook() // fresh seed, history gone
    expect(lastTimeFor('leg-press')).toBeUndefined()

    await importJson(json)
    expect(lastTimeFor('leg-press')?.sets[0]?.weight).toBe(45)
    expect(templates()[2]?.entries[4]?.exerciseId).toBe('incline-chest-press')
    expect((await db.prefs.get('layout'))?.value).toBe('focus')
  })

  it('rejects invalid payloads untouched', async () => {
    await finishSession('a')
    await expect(importJson('{"version":2,"sessions":[],"templates":[]}')).rejects.toThrow(/unsupported version/)
    await expect(importJson('not json')).rejects.toThrow()
    expect(await db.sessions.count()).toBe(1) // nothing was wiped
  })

  it('a mid-import failure rolls the whole transaction back', async () => {
    await finishSession('a')
    const payload = JSON.parse(exportJson()) as { sessions: unknown[] }
    payload.sessions.push(payload.sessions[0]) // duplicate primary key → bulkAdd fails

    await expect(importJson(JSON.stringify(payload))).rejects.toThrow()
    expect(await db.sessions.count()).toBe(1) // wipe-and-load was atomic
    expect(templates()).toHaveLength(3)
  })
})
