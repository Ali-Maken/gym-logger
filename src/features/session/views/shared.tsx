import { useEffect, useState, type CSSProperties } from 'react'
import type { RestTimerVm, SessionRowVm, SessionViewProps } from './contract'
import { Stepper } from './Stepper'
import './shared.css'

// Dumb building blocks shared by the layout adapters. Behavior only —
// each layout styles them via its own wrapper class.

/** Two-tap Finish: arms on first tap, fires on the second, disarms after 3s. */
export function FinishButton({ className, onFinish }: { className: string; onFinish(): void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      className={`${className} ${armed ? 'armed' : ''}`}
      onClick={() => (armed ? onFinish() : setArmed(true))}
    >
      {armed ? 'Sure?' : 'Finish'}
    </button>
  )
}

/** Circular rest countdown; tap to skip. */
export function TimerRing({ timer, onSkip }: { timer: RestTimerVm; onSkip(): void }) {
  return (
    <button
      type="button"
      className="ss-ring"
      style={{ '--p': timer.fraction * 100 } as CSSProperties}
      onClick={onSkip}
      aria-label="rest timer, tap to skip"
    >
      <i>{timer.label}</i>
    </button>
  )
}

/** Rectangular rest countdown; tap to skip. */
export function RestButton({ className, timer, onSkip }: { className: string; timer: RestTimerVm; onSkip(): void }) {
  return (
    <button type="button" className={className} onClick={onSkip} aria-label="rest timer, tap to skip">
      <span className="mono">{timer.label}</span>
      <small>REST · TAP TO SKIP</small>
    </button>
  )
}

/** Variant toggle pills; renders nothing on non-choice rows. */
export function ChoiceRow({ row, onChoose }: { row: SessionRowVm; onChoose: SessionViewProps['onChoose'] }) {
  if (!row.choices) return null
  return (
    <div className="ss-choice">
      {row.choices.map((choice) => (
        <button
          type="button"
          key={choice.id}
          className={choice.id === row.exercise.id ? 'on' : ''}
          onClick={() => onChoose(row, choice.id)}
        >
          {choice.name}
          {choice.id === row.exercise.id ? '' : ' ↔'}
        </button>
      ))}
    </div>
  )
}

export function SetupField({ row, onSetup }: { row: SessionRowVm; onSetup: SessionViewProps['onSetup'] }) {
  return (
    <div className="ss-setup">
      <span className="lbl">Setup</span>
      <input
        defaultValue={row.setup}
        placeholder="seat…"
        aria-label="setup"
        onChange={(e) => onSetup(row, e.target.value)}
      />
    </div>
  )
}

/** Per-exercise note, collapsed behind a "+ note" button until used. */
export function NoteField({ row, onNote }: { row: SessionRowVm; onNote: SessionViewProps['onNote'] }) {
  const [open, setOpen] = useState(row.note !== '')
  if (!open) {
    return (
      <button type="button" className="ss-notebtn mono" onClick={() => setOpen(true)}>
        + note
      </button>
    )
  }
  return (
    <input
      className="ss-note"
      defaultValue={row.note}
      placeholder="note…"
      aria-label="exercise note"
      onChange={(e) => onNote(row, e.target.value)}
    />
  )
}

/** Completed sets as logged lines, remaining sets as steppers + a tick. */
export function SetGrid({
  row,
  onStep,
  onCompleteSet,
}: {
  row: SessionRowVm
  onStep: SessionViewProps['onStep']
  onCompleteSet: SessionViewProps['onCompleteSet']
}) {
  const setNumber = (pendingIndex: number) => row.completedSets.length + pendingIndex + 1
  return (
    <div className="ss-setgrid">
      {row.completedSets.map((set, i) => (
        <div className="ss-srow done" key={`done-${i}`}>
          <span className="ss-n mono">{i + 1}</span>
          <span className="ss-logged mono">
            {set.weight !== undefined ? `${set.weight}kg · ` : ''}
            {set.value}
            {row.exercise.measure === 'seconds' ? 's' : ''}
          </span>
          <span className="ss-tick on" aria-label={`set ${i + 1} complete`}>
            ✓
          </span>
        </div>
      ))}
      {row.pendingSets.map((set, i) => (
        <div className="ss-srow" key={`pending-${i}`}>
          <span className="ss-n mono">{setNumber(i)}</span>
          {set.weight !== undefined && (
            <Stepper
              value={set.weight}
              unit="kg"
              label={`set ${setNumber(i)} weight`}
              onStep={(d) => onStep(row, i, 'weight', d)}
            />
          )}
          <Stepper
            value={set.value}
            unit={row.exercise.measure === 'seconds' ? 'sec' : 'reps'}
            label={`set ${setNumber(i)} ${row.exercise.measure === 'seconds' ? 'seconds' : 'reps'}`}
            onStep={(d) => onStep(row, i, 'value', d)}
          />
          <button
            type="button"
            className="ss-tick"
            aria-label={`complete set ${setNumber(i)}`}
            onClick={() => onCompleteSet(row, i)}
          >
            ✓
          </button>
        </div>
      ))}
    </div>
  )
}
