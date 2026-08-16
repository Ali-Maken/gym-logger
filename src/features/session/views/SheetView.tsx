import { useEffect, useState, type CSSProperties } from 'react'
import type { RestTimerVm, SessionRowVm, SessionViewProps } from './contract'
import { Stepper } from './Stepper'
import './sheet.css'

// Sheet layout (default): compact checklist + fixed bottom control sheet.
// Dumb adapter — no domain logic, only rendering and callbacks.

export function SheetView(props: SessionViewProps) {
  const { vm, selectedKey, onSelect, onFinish } = props
  const selected = vm.rows.find((r) => r.key === selectedKey)
  return (
    <div className="phone sheet-view">
      <header className="sv-head">
        <span className="disp">{vm.templateName}</span>
        <span className="sv-meta mono">
          {vm.elapsedLabel} · {vm.doneCount}/{vm.totalCount}
        </span>
        <FinishButton onFinish={onFinish} />
      </header>
      <div className="sv-list">
        {vm.rows.map((row) => (
          <ListRow key={row.key} row={row} selected={row.key === selectedKey} onSelect={onSelect} />
        ))}
      </div>
      {selected ? (
        <SheetPanel key={selected.key} row={selected} {...props} />
      ) : (
        <div className="sv-sheet">
          <div className="sv-sheet-h">
            <span className="sv-nm">All exercises done</span>
            {vm.timer && <TimerRing timer={vm.timer} onSkip={props.onSkipTimer} />}
          </div>
          <button type="button" className="sv-next" onClick={onFinish}>
            Finish session
          </button>
        </div>
      )}
    </div>
  )
}

function ListRow({
  row,
  selected,
  onSelect,
}: {
  row: SessionRowVm
  selected: boolean
  onSelect(key: string): void
}) {
  const isTick = row.exercise.measure === 'tick'
  const progress = isTick ? (
    row.done ? '✓' : row.targetLabel
  ) : (
    <>
      <b>{row.completedSets.length}</b>/{row.completedSets.length + row.pendingSets.length}
    </>
  )
  return (
    <button
      type="button"
      className={`sv-row ${selected ? 'sel' : ''} ${row.done ? 'done' : ''}`}
      onClick={() => onSelect(row.key)}
    >
      <span className="sv-row-main">
        <span className="sv-nm">
          {row.exercise.name}
          {row.hint && !row.done && <span className="sv-hint mono"> ↑</span>}
        </span>
        <span className="sv-last mono">{row.lastLabel}</span>
      </span>
      <span className="sv-prog mono">{progress}</span>
    </button>
  )
}

function SheetPanel(props: { row: SessionRowVm } & SessionViewProps) {
  const { row, vm, onStep, onCompleteSet, onTick, onChoose, onSetup, onNote, onSkipTimer } = props
  const [noteOpen, setNoteOpen] = useState(row.note !== '')
  const isTick = row.exercise.measure === 'tick'
  const setNumber = (pendingIndex: number) => row.completedSets.length + pendingIndex + 1
  return (
    <div className="sv-sheet">
      <div className="sv-sheet-h">
        <span className="sv-sheet-t">
          <span className="sv-nm">{row.exercise.name}</span>{' '}
          <span className="sv-dose mono">{row.targetLabel}</span>
          <span className="sv-last mono">
            last: {row.lastLabel}
            {row.lastSetup ? ` · ${row.lastSetup}` : ''}
          </span>
        </span>
        {vm.timer && <TimerRing timer={vm.timer} onSkip={onSkipTimer} />}
      </div>
      {row.exercise.note && <p className="sv-tip">{row.exercise.note}</p>}
      {row.choices && (
        <div className="sv-choice">
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
      )}
      {isTick ? (
        <button type="button" className="sv-next" onClick={() => onTick(row)} disabled={row.done}>
          {row.done ? '✓ Done' : `Mark ${row.exercise.name} done`}
        </button>
      ) : (
        <>
          <div className="sv-setup">
            <span className="lbl">Setup</span>
            <input
              defaultValue={row.setup}
              placeholder="seat…"
              aria-label="setup"
              onChange={(e) => onSetup(row, e.target.value)}
            />
          </div>
          <div className="sv-setgrid">
            {row.completedSets.map((set, i) => (
              <div className="sv-srow done" key={`done-${i}`}>
                <span className="sv-n mono">{i + 1}</span>
                <span className="sv-logged mono">
                  {set.weight !== undefined ? `${set.weight}kg · ` : ''}
                  {set.value}
                  {row.exercise.measure === 'seconds' ? 's' : ''}
                </span>
                <span className="sv-tick on" aria-label={`set ${i + 1} complete`}>
                  ✓
                </span>
              </div>
            ))}
            {row.pendingSets.map((set, i) => (
              <div className="sv-srow" key={`pending-${i}`}>
                <span className="sv-n mono">{setNumber(i)}</span>
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
                  className="sv-tick"
                  aria-label={`complete set ${setNumber(i)}`}
                  onClick={() => onCompleteSet(row, i)}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
          {noteOpen ? (
            <input
              className="sv-note"
              defaultValue={row.note}
              placeholder="note…"
              aria-label="exercise note"
              onChange={(e) => onNote(row, e.target.value)}
            />
          ) : (
            <button type="button" className="sv-notebtn mono" onClick={() => setNoteOpen(true)}>
              + note
            </button>
          )}
        </>
      )}
    </div>
  )
}

function TimerRing({ timer, onSkip }: { timer: RestTimerVm; onSkip(): void }) {
  return (
    <button
      type="button"
      className="sv-ring"
      style={{ '--p': timer.fraction * 100 } as CSSProperties}
      onClick={onSkip}
      aria-label="rest timer, tap to skip"
    >
      <i>{timer.label}</i>
    </button>
  )
}

/** Two-tap Finish: arms on first tap, fires on the second, disarms after 3s. */
function FinishButton({ onFinish }: { onFinish(): void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      className={`sv-finish ${armed ? 'armed' : ''}`}
      onClick={() => (armed ? onFinish() : setArmed(true))}
    >
      {armed ? 'Sure?' : 'Finish'}
    </button>
  )
}
