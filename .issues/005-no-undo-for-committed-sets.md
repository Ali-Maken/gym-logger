# 005 · No undo for committed sets or ticks

**Severity:** Medium (High in combination with 003/004/006 — they create the mis-taps this makes permanent).
**Layouts:** All (contract-level: `SessionViewProps` has no un-complete callback; Logbook has no mutation for it).

## What happens

Once ✓ commits a set (or a tick row fires), there is no way to correct it anywhere in the app — not in the session, not in History. Reproduced consequences:

- Mis-tap ✓ (it sits 8 px from the reps stepper in the shared SetGrid) → a set is logged with whatever the steppers showed, e.g. "0kg · 12".
- Tick rows: one accidental tap logs "15 min incline walk" that never happened; tapping again does nothing (`handleTick` guards `row.done`).

Wrong history then feeds the hint rule, prefills, and "last:" labels.

## Fix direction

Smallest change honoring write-through: an `uncompleteLastSet(exerciseId)` Logbook mutation surfaced as tap-a-completed-set-row → confirm remove (or a 5 s "undo" toast after each commit). Tick rows: same tap-to-untick. Spec addition — needs the user's OK on scope.
