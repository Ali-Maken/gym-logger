import { create } from 'zustand'
import { db } from './db'
import { validateExportPayload } from './domain/exportPayload'
import { shouldSuggestWeightIncrease } from './domain/hint'
import { selectLastTime } from './domain/lastTime'
import { suggestTemplate } from './domain/rotation'
import type {
  Exercise,
  ExportPayload,
  LoggedExercise,
  Session,
  SetEntry,
  Template,
  TemplateEntry,
  TemplateId,
} from './domain/types'

// THE seam: the only module features may import. One store, write-through
// mutations (Dexie first, store second — the never-lose-data guarantee).
// Pure display helpers and types are re-exported so features need nothing else.

export { formatLastResult, formatLogLine, formatTarget, topWeight } from './domain/format'
export type {
  Exercise,
  LoggedExercise,
  Measure,
  Session,
  SetEntry,
  Template,
  TemplateEntry,
  TemplateId,
} from './domain/types'

interface LogbookState {
  templates: Template[]
  exercises: Record<string, Exercise>
  sessions: Session[] // every session except the active one
  activeSession: Session | null
  prefs: Record<string, unknown>
}

const useLogbookStore = create<LogbookState>(() => ({
  templates: [],
  exercises: {},
  sessions: [],
  activeSession: null,
  prefs: {},
}))

// ---------- selector hooks (the only reactive surface) ----------

export const useTemplates = (): Template[] => useLogbookStore((s) => s.templates)
export const useSuggestion = (): TemplateId => useLogbookStore((s) => suggestTemplate(s.sessions))
export const useActiveSession = (): Session | null => useLogbookStore((s) => s.activeSession)
export const useExercise = (id: string): Exercise | undefined => useLogbookStore((s) => s.exercises[id])
export const useExercises = (): Record<string, Exercise> => useLogbookStore((s) => s.exercises)
export const useLastTime = (exerciseId: string): LoggedExercise | undefined =>
  useLogbookStore((s) => selectLastTime(s.sessions, exerciseId))
export const usePref = (key: string): unknown => useLogbookStore((s) => s.prefs[key])
export const useSessions = (): Session[] => useLogbookStore((s) => s.sessions)

// ---------- reads (non-reactive) ----------

export function templates(): Template[] {
  return useLogbookStore.getState().templates
}

export function activeSession(): Session | null {
  return useLogbookStore.getState().activeSession
}

export function lastTimeFor(exerciseId: string): LoggedExercise | undefined {
  return selectLastTime(useLogbookStore.getState().sessions, exerciseId)
}

export function hintFor(entry: TemplateEntry): boolean {
  const { exercises, sessions } = useLogbookStore.getState()
  const exercise = exercises[entry.exerciseId]
  if (!exercise) return false
  return shouldSuggestWeightIncrease(exercise, selectLastTime(sessions, entry.exerciseId), entry.target)
}

export function suggestion(): TemplateId {
  return suggestTemplate(useLogbookStore.getState().sessions)
}

// ---------- lifecycle ----------

const TEMPLATE_ORDER: readonly TemplateId[] = ['week1', 'a', 'b']

// A recent unfinished session is resumed (app reload mid-workout, e.g. the SW
// auto-update); older ones stay abandoned.
const RESUME_WINDOW_MS = 4 * 60 * 60 * 1000

/** Open the database (seeding on first run) and load everything into the store. */
export async function initLogbook(): Promise<void> {
  await db.open()
  const [templates, exercises, sessions, prefRows] = await Promise.all([
    db.templates.toArray(),
    db.exercises.toArray(),
    db.sessions.orderBy('startedAt').toArray(),
    db.prefs.toArray(),
  ])
  const active = findResumable(sessions)
  useLogbookStore.setState({
    templates: [...templates].sort((a, b) => TEMPLATE_ORDER.indexOf(a.id) - TEMPLATE_ORDER.indexOf(b.id)),
    exercises: Object.fromEntries(exercises.map((e) => [e.id, e])),
    sessions: sessions.filter((s) => s !== active),
    activeSession: active ?? null,
    prefs: Object.fromEntries(prefRows.map((p) => [p.key, p.value])),
  })
}

function findResumable(sessions: Session[]): Session | undefined {
  const cutoff = Date.now() - RESUME_WINDOW_MS
  return sessions
    .filter((s) => s.finishedAt === undefined && s.startedAt >= cutoff)
    .reduce<Session | undefined>((latest, s) => (!latest || s.startedAt > latest.startedAt ? s : latest), undefined)
}

// ---------- mutations (await Dexie FIRST, then update the store) ----------

export async function start(templateId: TemplateId): Promise<void> {
  const session: Session = { id: crypto.randomUUID(), templateId, startedAt: Date.now(), exercises: [] }
  await db.sessions.put(session)
  useLogbookStore.setState((s) => ({
    // a previously active session stays in the db as abandoned
    sessions: s.activeSession ? [...s.sessions, s.activeSession] : s.sessions,
    activeSession: session,
  }))
}

/** Sets are appended in completion order; the UI derives pending rows from the count. */
export function completeSet(exerciseId: string, entry: SetEntry): Promise<void> {
  return updateActive((session) =>
    withLoggedExercise(session, exerciseId, (le) => ({ ...le, sets: [...le.sets, entry] })),
  )
}

export function setSetup(exerciseId: string, setup: string): Promise<void> {
  return updateActive((session) => withLoggedExercise(session, exerciseId, (le) => ({ ...le, setup })))
}

export function setExerciseNote(exerciseId: string, note: string): Promise<void> {
  return updateActive((session) => withLoggedExercise(session, exerciseId, (le) => ({ ...le, note })))
}

export function setSessionNote(note: string): Promise<void> {
  return updateActive((session) => ({ ...session, note }))
}

export async function finish(): Promise<void> {
  await updateActive((session) => ({ ...session, finishedAt: Date.now() }))
  useLogbookStore.setState((s) => ({
    sessions: s.activeSession ? [...s.sessions, s.activeSession] : s.sessions,
    activeSession: null,
  }))
}

/** Persist a variant choice so the entry defaults to the last-used variant. */
export async function chooseVariant(templateId: TemplateId, entryIndex: number, exerciseId: string): Promise<void> {
  const { templates } = useLogbookStore.getState()
  const template = templates.find((t) => t.id === templateId)
  const entry = template?.entries[entryIndex]
  if (!template || !entry) throw new Error(`No template entry ${templateId}[${entryIndex}]`)
  if (!entry.choiceIds?.includes(exerciseId)) {
    throw new Error(`${exerciseId} is not a choice of ${templateId}[${entryIndex}]`)
  }
  const next: Template = {
    ...template,
    entries: template.entries.map((e, i) => (i === entryIndex ? { ...e, exerciseId } : e)),
  }
  await db.templates.put(next)
  useLogbookStore.setState((s) => ({ templates: s.templates.map((t) => (t.id === templateId ? next : t)) }))
}

export async function setPref(key: string, value: unknown): Promise<void> {
  await db.prefs.put({ key, value })
  useLogbookStore.setState((s) => ({ prefs: { ...s.prefs, [key]: value } }))
}

// Active-session mutations are serialized so rapid interleaved writes (a
// setup keystroke racing a set commit) can't build from a stale snapshot.
let mutationQueue: Promise<unknown> = Promise.resolve()

function updateActive(mutate: (session: Session) => Session): Promise<void> {
  const run = async () => {
    const current = useLogbookStore.getState().activeSession
    if (!current) throw new Error('No active session')
    const next = mutate(current)
    await db.sessions.put(next)
    useLogbookStore.setState({ activeSession: next })
  }
  // a failed predecessor already rejected for its own caller — still run this one
  const task = mutationQueue.then(run, run)
  mutationQueue = task
  return task
}

function withLoggedExercise(
  session: Session,
  exerciseId: string,
  mutate: (le: LoggedExercise) => LoggedExercise,
): Session {
  const existing = session.exercises.find((e) => e.exerciseId === exerciseId)
  const exercises = existing
    ? session.exercises.map((e) => (e === existing ? mutate(e) : e))
    : [...session.exercises, mutate({ exerciseId, sets: [] })]
  return { ...session, exercises }
}

// ---------- backup ----------

export function exportJson(): string {
  const { sessions, activeSession, templates, prefs } = useLogbookStore.getState()
  const payload: ExportPayload = {
    version: 1,
    sessions: activeSession ? [...sessions, activeSession] : sessions,
    templates,
    prefs,
  }
  return JSON.stringify(payload, null, 2)
}

/**
 * Replace-all restore: validates first and rejects invalid input untouched,
 * then wipes and loads atomically in one Dexie transaction.
 */
export async function importJson(json: string): Promise<void> {
  const payload = validateExportPayload(JSON.parse(json))
  await db.transaction('rw', db.sessions, db.templates, db.prefs, async () => {
    await Promise.all([db.sessions.clear(), db.templates.clear(), db.prefs.clear()])
    await db.sessions.bulkAdd(payload.sessions)
    await db.templates.bulkAdd(payload.templates)
    await db.prefs.bulkPut(Object.entries(payload.prefs).map(([key, value]) => ({ key, value })))
  })
  await initLogbook()
}
