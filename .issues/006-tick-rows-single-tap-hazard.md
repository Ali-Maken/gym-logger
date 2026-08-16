# 006 · Tick rows fire on a single row tap and collapse the open accordion

**Severity:** Medium.
**Layouts:** Ledger, Material (Sheet is safe: tick rows there need select → "Mark done", two taps).

## What happens

In Ledger and Material the entire row header of a tick row calls `onTick` directly (`LedgerView.tsx:25`, `MaterialView.tsx:28`). Reproduced:

1. One tap anywhere on "Incline walk" → instantly logged as done ("15 min"). A brush while scrolling the list does this too.
2. Not undoable (see 005) — second tap is a no-op.
3. Side effect: `handleTick` resets selection (`setSelectedOverride(null)`), so the accordion you had open (mid-exercise, steppers dialed in) collapses and selection jumps to the first not-done row. Reproduced: ticking Incline walk closed the open Pec deck body.

Spec says "single tap to mark done" — the spec choice is fine *with* an undo; without one, the combination is the trap.

## Fix direction

Keep single-tap but make it reversible (tap again to untick, per 005), and stop `handleTick` from clearing `selectedOverride` when the ticked row isn't the selected one.

## Decision (2026-08-17)

Follows 005's decision: tick rows become tap-to-toggle (tap again = untick). Also fix the selection side effect — ticking a non-selected row must not collapse the open exercise.
