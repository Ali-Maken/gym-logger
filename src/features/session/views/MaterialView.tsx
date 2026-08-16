import type { SessionRowVm, SessionViewProps } from './contract'
import { ChoiceRow, FinishButton, NoteField, RestButton, SetGrid, SetupField } from './shared'
import './material.css'

// Material layout: Material 3 idiom — cards, avatars, chips, progress bar,
// FAB-style Finish. Dumb adapter — no domain logic, only rendering and callbacks.

export function MaterialView(props: SessionViewProps) {
  const { vm, selectedKey, onSelect, onTick, onSkipTimer, onFinish } = props
  return (
    <div className="phone material-view">
      <div className="mv-bar">
        <h1>{vm.templateName}</h1>
        <span className="mv-clock mono">{vm.elapsedLabel}</span>
      </div>
      <div className="mv-prog">
        <i style={{ width: `${(100 * vm.doneCount) / Math.max(1, vm.totalCount)}%` }} />
      </div>
      <div className="mv-list">
        {vm.rows.map((row) => {
          const isTick = row.exercise.measure === 'tick'
          const open = row.key === selectedKey && !row.done && !isTick
          return (
            <div className={`mv-card ${row.done ? 'done' : ''}`} key={row.key}>
              <button
                type="button"
                className="mv-card-h"
                onClick={() => (isTick ? onTick(row) : onSelect(row.key))}
              >
                <span className="mv-avatar mono">
                  {isTick
                    ? row.done
                      ? '✓'
                      : '—'
                    : `${row.completedSets.length}/${row.completedSets.length + row.pendingSets.length}`}
                </span>
                <span className="mv-card-main">
                  <span className="mv-nm">{row.exercise.name}</span>
                  {row.hint && !row.done && <span className="mv-chip">↑ add weight</span>}
                  <span className="mv-sub mono">{row.lastLabel}</span>
                </span>
                <span className="mv-dose mono">{row.targetLabel}</span>
              </button>
              {open && <MaterialBody key={row.key} row={row} {...props} />}
            </div>
          )
        })}
      </div>
      <footer className="mv-foot">
        <span className="mono">
          {vm.doneCount}/{vm.totalCount} exercises
        </span>
        {vm.timer ? (
          <RestButton className="mv-timer" timer={vm.timer} onSkip={onSkipTimer} />
        ) : (
          <FinishButton className="mv-fab" onFinish={onFinish} />
        )}
      </footer>
    </div>
  )
}

function MaterialBody(props: { row: SessionRowVm } & SessionViewProps) {
  const { row, onStep, onCompleteSet, onChoose, onSetup, onNote } = props
  return (
    <div className="mv-body">
      {row.exercise.note && <p className="mv-tip">{row.exercise.note}</p>}
      <ChoiceRow row={row} onChoose={onChoose} />
      <SetupField row={row} onSetup={onSetup} />
      <SetGrid row={row} onStep={onStep} onCompleteSet={onCompleteSet} />
      <NoteField row={row} onNote={onNote} />
    </div>
  )
}
