export type MuscleGroup = 'legs' | 'push' | 'pull' | 'core' | 'cardio'

export type Measure = 'weightReps' | 'seconds' | 'tick'
// weightReps: weight + reps per set · seconds: timed holds (plank)
// tick: done/not-done rows (cardio) — no set inputs

export interface Exercise {
  id: string // 'leg-press'
  name: string // 'Leg press'
  note?: string // machine tip from the guide
  group: MuscleGroup
  measure: Measure
}

export interface TemplateEntry {
  exerciseId: string // resolved choice (defaults to last-used variant)
  choiceIds?: string[] // when present: log-time variants, each a full Exercise
  sets: number // tick: 1
  target: number // reps | seconds | minutes-as-label (tick)
}

export type TemplateId = 'week1' | 'a' | 'b'

export interface Template {
  id: TemplateId
  name: string // 'Workout A · push & legs'
  entries: TemplateEntry[] // ordered; the dose lives HERE, not on Exercise
}

export interface SetEntry {
  value: number // reps or seconds, per measure
  weight?: number // kg; only for weightReps
}

export interface LoggedExercise {
  exerciseId: string
  setup?: string // free text: 'seat 4', 'pad 5', 'incline 6'
  sets: SetEntry[]
  note?: string
}

export interface Session {
  id: string
  templateId: TemplateId
  startedAt: number // epoch ms
  finishedAt?: number // unset = abandoned; only finished sessions count anywhere
  exercises: LoggedExercise[]
  note?: string
}

export interface ExportPayload {
  version: 1 // bump on schema change; import migrates old versions
  sessions: Session[]
  // user-modified state: chosen variants live on templates, layout/theme prefs in prefs
  templates: Template[]
  prefs: Record<string, unknown>
}
