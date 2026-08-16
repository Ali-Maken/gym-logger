import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import {
  chooseVariant,
  completeSet,
  finish,
  formatLastResult,
  formatTarget,
  hintFor,
  lastTimeFor,
  setExerciseNote,
  setSetup,
  topWeight,
  useActiveSession,
  useExercises,
  usePref,
  useTemplates,
  type SetEntry,
  type TemplateEntry,
} from '../../core/logbook'
import type { PendingSet, SessionRowVm, SessionVm } from './views/contract'
import { SESSION_VIEWS, resolveViewId } from './views/registry'
import { LayoutSwitcher } from './LayoutSwitcher'

// Thin container: Logbook wiring, pending-set drafts, rest timer, selection,
// layout choice. Everything a layout shows comes through the SessionViewProps
// contract — layouts stay dumb.

const REST_MS = 90_000
const WEIGHT_STEP_KG = 2.5
const SECONDS_STEP = 5

export function SessionPage() {
  const session = useActiveSession()
  const templates = useTemplates()
  const exercises = useExercises()
  const layoutPref = usePref('sessionView')
  const navigate = useNavigate()
  const now = useNow(500)
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null)
  // Stepper values for uncommitted sets, keyed by row identity so a variant
  // switch re-prefills from the new variant's history. Absent = defaults.
  const [drafts, setDrafts] = useState<Record<string, PendingSet[]>>({})
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null)

  const template = session && templates.find((t) => t.id === session.templateId)
  if (!session || !template) return <Navigate to="/" replace />

  const rows = template.entries.map((entry, entryIndex): SessionRowVm => {
    const exercise = exercises[entry.exerciseId]
    const key = rowKey(entryIndex, entry.exerciseId)
    const logged = session.exercises.find((e) => e.exerciseId === entry.exerciseId)
    const completedSets = logged?.sets ?? []
    const last = lastTimeFor(entry.exerciseId)
    const isTick = exercise.measure === 'tick'
    const remaining = isTick ? 0 : Math.max(0, entry.sets - completedSets.length)
    const stored = drafts[key]
    return {
      key,
      entryIndex,
      exercise,
      choices: entry.choiceIds?.map((id) => exercises[id]),
      targetLabel: formatTarget(exercise, entry),
      lastLabel: formatLastResult(exercise, last),
      lastSetup: last?.setup,
      hint: hintFor(entry),
      setup: logged?.setup ?? last?.setup ?? '',
      note: logged?.note ?? '',
      completedSets,
      pendingSets:
        stored && stored.length === remaining
          ? stored
          : defaultPending(exercise.measure, entry, completedSets, remaining, last && topWeight(last)),
      done: isTick ? completedSets.length > 0 : completedSets.length >= entry.sets,
    }
  })

  const selectedKey =
    selectedOverride && rows.some((r) => r.key === selectedOverride)
      ? selectedOverride
      : (rows.find((r) => !r.done)?.key ?? '')

  // `now` ticks every 500ms, so clamp to the full rest to avoid showing 1:31
  const restLeftMs = timerEndsAt === null ? 0 : Math.min(timerEndsAt - now, REST_MS)
  const vm: SessionVm = {
    templateName: template.name,
    elapsedLabel: formatClock(now - session.startedAt),
    doneCount: rows.filter((r) => r.done).length,
    totalCount: rows.length,
    rows,
    timer:
      restLeftMs > 0
        ? { label: formatClock(restLeftMs), fraction: 1 - restLeftMs / REST_MS }
        : null,
  }

  // Committing a set also commits a still-untouched setup prefill, so history
  // reads the way the screen did ('seat 4' shown → 'seat 4' logged).
  async function handleCompleteSet(row: SessionRowVm, pendingIndex: number) {
    const pending = row.pendingSets[pendingIndex]
    const set: SetEntry =
      pending.weight === undefined ? { value: pending.value } : { value: pending.value, weight: pending.weight }
    const committedSetup = session?.exercises.find((e) => e.exerciseId === row.exercise.id)?.setup
    if (committedSetup === undefined && row.lastSetup) await setSetup(row.exercise.id, row.lastSetup)
    await completeSet(row.exercise.id, set)
    // Drop the row's drafts so remaining sets re-prefill from what was just
    // committed (weight carries forward; value resets to today's target).
    setDrafts(({ [row.key]: _dropped, ...rest }) => rest)
    setTimerEndsAt(Date.now() + REST_MS)
    if (row.pendingSets.length === 1) setSelectedOverride(null) // exercise done → advance
  }

  async function handleTick(row: SessionRowVm) {
    if (row.done) return
    const entry = template!.entries[row.entryIndex]
    await completeSet(row.exercise.id, { value: entry.target }) // minutes label; no rest timer
    setSelectedOverride(null)
  }

  function handleStep(row: SessionRowVm, pendingIndex: number, field: 'weight' | 'value', direction: 1 | -1) {
    const next = row.pendingSets.map((p, i) =>
      i === pendingIndex ? stepPending(row.exercise.measure, p, field, direction) : p,
    )
    setDrafts((d) => ({ ...d, [row.key]: next }))
  }

  async function handleChoose(row: SessionRowVm, exerciseId: string) {
    await chooseVariant(template!.id, row.entryIndex, exerciseId)
    setSelectedOverride(rowKey(row.entryIndex, exerciseId))
  }

  async function handleFinish() {
    await finish()
    navigate('/')
  }

  const viewId = resolveViewId(layoutPref)
  const View = SESSION_VIEWS[viewId].View
  return (
    <>
      <View
        vm={vm}
        selectedKey={selectedKey}
        onSelect={setSelectedOverride}
        onStep={handleStep}
        onCompleteSet={(row, i) => void handleCompleteSet(row, i)}
        onTick={(row) => void handleTick(row)}
        onChoose={(row, id) => void handleChoose(row, id)}
        onSetup={(row, setup) => void setSetup(row.exercise.id, setup)}
        onNote={(row, note) => void setExerciseNote(row.exercise.id, note)}
        onSkipTimer={() => setTimerEndsAt(null)}
        onFinish={() => void handleFinish()}
      />
      <LayoutSwitcher current={viewId} />
    </>
  )
}

function rowKey(entryIndex: number, exerciseId: string): string {
  return `${entryIndex}:${exerciseId}`
}

/** Weight prefills from this session's latest set, else last time's top set. */
function defaultPending(
  measure: string,
  entry: TemplateEntry,
  completedSets: SetEntry[],
  remaining: number,
  lastTopWeight: number | undefined,
): PendingSet[] {
  const sessionWeight = [...completedSets].reverse().find((s) => s.weight !== undefined)?.weight
  const weight = measure === 'weightReps' ? (sessionWeight ?? lastTopWeight ?? 0) : undefined
  return Array.from({ length: remaining }, () => ({ weight, value: entry.target }))
}

function stepPending(measure: string, p: PendingSet, field: 'weight' | 'value', direction: 1 | -1): PendingSet {
  if (field === 'weight') {
    const next = Math.round(((p.weight ?? 0) + direction * WEIGHT_STEP_KG) * 10) / 10
    return { ...p, weight: Math.max(0, next) }
  }
  const step = measure === 'seconds' ? SECONDS_STEP : 1
  return { ...p, value: Math.max(0, p.value + direction * step) }
}

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
