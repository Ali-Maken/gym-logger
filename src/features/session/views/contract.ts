import type { ReactNode } from 'react'
import type { Exercise, SetEntry } from '../../../core/logbook'

// The SessionView seam: every layout is a dumb adapter over this contract.
// The container owns all domain wiring and state; layouts only render and
// call back. A new layout = one adapter + a registry entry, nothing else.

/** An uncommitted set row: what the steppers currently show. */
export interface PendingSet {
  weight?: number // kg; only for weightReps
  value: number // reps or seconds
}

export interface SessionRowVm {
  /** Stable identity for selection; changes when a variant is switched. */
  key: string
  entryIndex: number
  exercise: Exercise // the chosen variant
  choices?: Exercise[] // variant options, present only on choice rows
  targetLabel: string // '3 × 12' · '3 × 30s' · '15 min'
  lastLabel: string // '45kg · 12/12/10' · '30/30/25s' · 'never'
  lastSetup?: string
  hint: boolean // '↑ add weight'
  setup: string // display value (committed, else last time's)
  note: string
  completedSets: SetEntry[]
  pendingSets: PendingSet[] // one per remaining set; always empty for tick rows
  done: boolean
}

export interface RestTimerVm {
  label: string // '1:23'
  fraction: number // elapsed share of the rest, 0..1
}

export interface SessionVm {
  templateName: string
  elapsedLabel: string // 'mm:ss'
  doneCount: number
  totalCount: number
  rows: SessionRowVm[]
  timer: RestTimerVm | null
}

export interface SessionViewProps {
  vm: SessionVm
  selectedKey: string // '' when nothing is selectable (all done)
  onSelect(key: string): void
  onStep(row: SessionRowVm, pendingIndex: number, field: 'weight' | 'value', direction: 1 | -1): void
  onCompleteSet(row: SessionRowVm, pendingIndex: number): void
  onTick(row: SessionRowVm): void
  onChoose(row: SessionRowVm, exerciseId: string): void
  onSetup(row: SessionRowVm, setup: string): void
  onNote(row: SessionRowVm, note: string): void
  onSkipTimer(): void
  onFinish(): void
}

export type SessionView = (props: SessionViewProps) => ReactNode
