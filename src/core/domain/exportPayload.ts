import type { ExportPayload, LoggedExercise, Session, SetEntry, Template, TemplateEntry, TemplateId } from './types'

/**
 * Shape-checks an unknown value (parsed JSON) into an ExportPayload.
 * Throws with a human-readable reason on the first problem found —
 * import must reject invalid input untouched.
 */
export function validateExportPayload(value: unknown): ExportPayload {
  const root = asRecord(value, 'payload')
  if (root.version !== 1) throw invalid(`unsupported version ${JSON.stringify(root.version)} — expected 1`)
  const sessions = asArray(root.sessions, 'sessions').map(validateSession)
  const templates = asArray(root.templates, 'templates').map(validateTemplate)
  const prefs = asRecord(root.prefs ?? {}, 'prefs')
  return { version: 1, sessions, templates, prefs }
}

const TEMPLATE_IDS: readonly TemplateId[] = ['week1', 'a', 'b']

function validateSession(value: unknown, i: number): Session {
  const s = asRecord(value, `sessions[${i}]`)
  return {
    id: asString(s.id, `sessions[${i}].id`),
    templateId: asTemplateId(s.templateId, `sessions[${i}].templateId`),
    startedAt: asNumber(s.startedAt, `sessions[${i}].startedAt`),
    ...(s.finishedAt !== undefined && { finishedAt: asNumber(s.finishedAt, `sessions[${i}].finishedAt`) }),
    exercises: asArray(s.exercises, `sessions[${i}].exercises`).map((e, j) =>
      validateLoggedExercise(e, `sessions[${i}].exercises[${j}]`),
    ),
    ...(s.note !== undefined && { note: asString(s.note, `sessions[${i}].note`) }),
  }
}

function validateLoggedExercise(value: unknown, path: string): LoggedExercise {
  const e = asRecord(value, path)
  return {
    exerciseId: asString(e.exerciseId, `${path}.exerciseId`),
    ...(e.setup !== undefined && { setup: asString(e.setup, `${path}.setup`) }),
    sets: asArray(e.sets, `${path}.sets`).map((s, k) => validateSetEntry(s, `${path}.sets[${k}]`)),
    ...(e.note !== undefined && { note: asString(e.note, `${path}.note`) }),
  }
}

function validateSetEntry(value: unknown, path: string): SetEntry {
  const s = asRecord(value, path)
  return {
    value: asNumber(s.value, `${path}.value`),
    ...(s.weight !== undefined && { weight: asNumber(s.weight, `${path}.weight`) }),
  }
}

function validateTemplate(value: unknown, i: number): Template {
  const t = asRecord(value, `templates[${i}]`)
  return {
    id: asTemplateId(t.id, `templates[${i}].id`),
    name: asString(t.name, `templates[${i}].name`),
    entries: asArray(t.entries, `templates[${i}].entries`).map((e, j) =>
      validateTemplateEntry(e, `templates[${i}].entries[${j}]`),
    ),
  }
}

function validateTemplateEntry(value: unknown, path: string): TemplateEntry {
  const e = asRecord(value, path)
  return {
    exerciseId: asString(e.exerciseId, `${path}.exerciseId`),
    ...(e.choiceIds !== undefined && {
      choiceIds: asArray(e.choiceIds, `${path}.choiceIds`).map((c, k) => asString(c, `${path}.choiceIds[${k}]`)),
    }),
    sets: asNumber(e.sets, `${path}.sets`),
    target: asNumber(e.target, `${path}.target`),
  }
}

function invalid(reason: string): Error {
  return new Error(`Invalid export: ${reason}`)
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid(`${path} is not an object`)
  return value as Record<string, unknown>
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw invalid(`${path} is not an array`)
  return value
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw invalid(`${path} is not a string`)
  return value
}

function asNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid(`${path} is not a number`)
  return value
}

function asTemplateId(value: unknown, path: string): TemplateId {
  if (!TEMPLATE_IDS.includes(value as TemplateId)) throw invalid(`${path} is not a template id`)
  return value as TemplateId
}
