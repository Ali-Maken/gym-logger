import type { SessionRowVm, SessionViewProps } from './contract'
import { ChoiceRow, FinishButton, NoteField, SetGrid, SetupField, TimerRing } from './shared'
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
        <FinishButton className="sv-finish" onFinish={onFinish} />
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
  const isTick = row.exercise.measure === 'tick'
  return (
    <div className="sv-sheet">
      <div className="sv-sheet-h">
        <span className="sv-sheet-t">
          <span className="sv-nm">{row.exercise.name}</span>{' '}
          <span className="sv-dose mono">{row.targetLabel}</span>
          {row.hint && !row.done && <span className="sv-hint mono"> ↑ add weight</span>}
          <span className="sv-last mono">
            last: {row.lastLabel}
            {row.lastSetup ? ` · ${row.lastSetup}` : ''}
          </span>
        </span>
        {vm.timer && <TimerRing timer={vm.timer} onSkip={onSkipTimer} />}
      </div>
      {row.exercise.note && <p className="sv-tip">{row.exercise.note}</p>}
      <ChoiceRow row={row} onChoose={onChoose} />
      {isTick ? (
        <button type="button" className="sv-next" onClick={() => onTick(row)} disabled={row.done}>
          {row.done ? '✓ Done' : `Mark ${row.exercise.name} done`}
        </button>
      ) : (
        <>
          <SetupField row={row} onSetup={onSetup} />
          <SetGrid row={row} onStep={onStep} onCompleteSet={onCompleteSet} />
          <NoteField row={row} onNote={onNote} />
        </>
      )}
    </div>
  )
}
