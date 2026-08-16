import type { SessionRowVm, SessionViewProps } from './contract'
import { ChoiceRow, FinishButton, NoteField, SetupField } from './shared'
import { Stepper } from './Stepper'
import './focus.css'

// Focus layout: dark, one exercise per screen, giant thumb-zone controls.
// The selected row is the exercise on stage; prev/next just move selection.
// Dumb adapter — no domain logic, only rendering and callbacks.

export function FocusView(props: SessionViewProps) {
  const { vm, selectedKey, onFinish } = props
  const index = vm.rows.findIndex((r) => r.key === selectedKey)
  const row = index >= 0 ? vm.rows[index] : null
  return (
    <div className="phone focus-view">
      <div className="fv-top">
        <span className="lbl">{vm.templateName}</span>
        <span className="fv-clock mono">{vm.elapsedLabel}</span>
        <span className="fv-dots" aria-label={`${vm.doneCount} of ${vm.totalCount} done`}>
          {vm.rows.map((r, i) => (
            <span key={r.key} className={`fv-dot ${r.done ? 'done' : ''} ${i === index ? 'cur' : ''}`} />
          ))}
        </span>
      </div>
      {row ? (
        <>
          <Stage key={row.key} row={row} {...props} />
          <ThumbZone row={row} index={index} {...props} />
        </>
      ) : (
        <div className="fv-stage">
          <h1 className="fv-name disp">All exercises done</h1>
          <button type="button" className="fv-log disp" onClick={onFinish}>
            Finish session
          </button>
        </div>
      )}
    </div>
  )
}

function Stage(props: { row: SessionRowVm } & SessionViewProps) {
  const { row, onChoose, onSetup, onNote } = props
  const isTick = row.exercise.measure === 'tick'
  const doneCount = row.completedSets.length
  return (
    <div className="fv-stage">
      <div className="lbl">{row.targetLabel}</div>
      <h1 className="fv-name disp">{row.exercise.name}</h1>
      {row.exercise.note && <p className="fv-tip">{row.exercise.note}</p>}
      <ChoiceRow row={row} onChoose={onChoose} />
      <div className="fv-lastcard">
        <span className="lbl">Last time</span>
        <div className="fv-lastval mono">
          {row.lastLabel}
          {row.lastSetup ? ` · ${row.lastSetup}` : ''}
        </div>
        {row.hint && !row.done && <span className="fv-hint mono">↑ ADD WEIGHT</span>}
      </div>
      {!isTick && (
        <div className="fv-sets">
          {row.completedSets.map((set, i) => (
            <div className="fv-pill done" key={`done-${i}`}>
              <small>SET {i + 1}</small>
              <b className="mono">
                {set.weight !== undefined ? `${set.weight}kg·` : ''}
                {set.value}
              </b>
            </div>
          ))}
          {row.pendingSets.map((_, i) => (
            <div className={`fv-pill ${i === 0 ? 'cur' : ''}`} key={`pending-${i}`}>
              <small>SET {doneCount + i + 1}</small>
              <b className="mono">—</b>
            </div>
          ))}
        </div>
      )}
      {!isTick && !row.done && (
        <>
          <SetupField row={row} onSetup={onSetup} />
          <NoteField row={row} onNote={onNote} />
        </>
      )}
    </div>
  )
}

function ThumbZone(props: { row: SessionRowVm; index: number } & SessionViewProps) {
  const { row, index, vm, onStep, onCompleteSet, onTick, onSkipTimer, onSelect, onFinish } = props
  const isTick = row.exercise.measure === 'tick'
  const setNumber = row.completedSets.length + 1
  const pending = row.pendingSets[0]
  return (
    <div className="fv-thumb">
      {!isTick && pending && (
        <div className="fv-thumbrow">
          {pending.weight !== undefined && (
            <Stepper
              value={pending.weight}
              unit="kg"
              label={`set ${setNumber} weight`}
              onStep={(d) => onStep(row, 0, 'weight', d)}
            />
          )}
          <Stepper
            value={pending.value}
            unit={row.exercise.measure === 'seconds' ? 'sec' : 'reps'}
            label={`set ${setNumber} ${row.exercise.measure === 'seconds' ? 'seconds' : 'reps'}`}
            onStep={(d) => onStep(row, 0, 'value', d)}
          />
        </div>
      )}
      {isTick ? (
        <button type="button" className="fv-log disp" onClick={() => onTick(row)} disabled={row.done}>
          {row.done ? '✓ Done' : 'Mark done'}
        </button>
      ) : vm.timer ? (
        <button type="button" className="fv-log rest" onClick={onSkipTimer} aria-label="rest timer, tap to skip">
          <span className="mono">{vm.timer.label}</span> REST — TAP TO SKIP
        </button>
      ) : pending ? (
        <button type="button" className="fv-log disp" onClick={() => onCompleteSet(row, 0)}>
          Log set {setNumber}
        </button>
      ) : (
        <button type="button" className="fv-log disp" disabled>
          All sets done
        </button>
      )}
      <div className="fv-nav">
        <button type="button" disabled={index <= 0} onClick={() => onSelect(vm.rows[index - 1].key)}>
          ‹ prev
        </button>
        <FinishButton className="fv-fin mono" onFinish={onFinish} />
        <button
          type="button"
          disabled={index >= vm.rows.length - 1}
          onClick={() => onSelect(vm.rows[index + 1].key)}
        >
          next ›
        </button>
      </div>
    </div>
  )
}
