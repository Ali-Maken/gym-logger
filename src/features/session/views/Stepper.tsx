import './stepper.css'

interface StepperProps {
  value: number
  unit: string // 'kg' · 'reps' · 'sec'
  label: string // for a11y: 'set 2 weight'
  onStep(direction: 1 | -1): void
}

/** Shared −/＋ control used by every layout; big targets, no typing. */
export function Stepper({ value, unit, label, onStep }: StepperProps) {
  return (
    <div className="stp">
      <button type="button" aria-label={`decrease ${label}`} onClick={() => onStep(-1)}>
        −
      </button>
      <span className="stp-v mono">
        {value}
        <small>{unit}</small>
      </span>
      <button type="button" aria-label={`increase ${label}`} onClick={() => onStep(1)}>
        ＋
      </button>
    </div>
  )
}
