import type { SessionRowVm, SessionViewProps } from './contract'
import { ChoiceRow, FinishButton, NoteField, RestButton, SetGrid, SetupField } from './shared'
import './ledger.css'

// Ledger layout: gym-guide chalk/ink accordion list with an ink footer.
// Dumb adapter — no domain logic, only rendering and callbacks.

export function LedgerView(props: SessionViewProps) {
  const { vm, selectedKey, onSelect, onTick, onSkipTimer, onFinish } = props
  return (
    <div className="phone ledger-view">
      <header className="lv-head">
        <div className="lbl">Session</div>
        <div className="disp">{vm.templateName}</div>
      </header>
      <div className="lv-list">
        {vm.rows.map((row) => {
          const isTick = row.exercise.measure === 'tick'
          const open = row.key === selectedKey && !row.done && !isTick
          return (
            <div className={`lv-row ${row.done ? 'done' : ''}`} key={row.key}>
              <button
                type="button"
                className="lv-row-h"
                onClick={() => (isTick ? onTick(row) : onSelect(row.key))}
              >
                <span className="lv-st" aria-hidden="true" />
                <span className="lv-row-main">
                  <span className="lv-nm">{row.exercise.name}</span>
                  {row.hint && !row.done && <span className="lv-hint mono">↑ add weight</span>}
                  <span className="lv-last mono">{row.lastLabel}</span>
                </span>
                <span className="lv-dose mono">{row.targetLabel}</span>
              </button>
              {open && <LedgerBody key={row.key} row={row} {...props} />}
            </div>
          )
        })}
      </div>
      <footer className="lv-foot">
        {vm.timer ? (
          <RestButton className="lv-timer" timer={vm.timer} onSkip={onSkipTimer} />
        ) : (
          <>
            <span className="mono">{vm.elapsedLabel}</span>
            <span className="mono">
              {vm.doneCount}/{vm.totalCount} done
            </span>
          </>
        )}
        <FinishButton className="lv-fin disp" onFinish={onFinish} />
      </footer>
    </div>
  )
}

function LedgerBody(props: { row: SessionRowVm } & SessionViewProps) {
  const { row, onStep, onCompleteSet, onChoose, onSetup, onNote } = props
  return (
    <div className="lv-body">
      {row.exercise.note && <p className="lv-tip">{row.exercise.note}</p>}
      <ChoiceRow row={row} onChoose={onChoose} />
      <SetupField row={row} onSetup={onSetup} />
      <SetGrid row={row} onStep={onStep} onCompleteSet={onCompleteSet} />
      <NoteField row={row} onNote={onNote} />
    </div>
  )
}
