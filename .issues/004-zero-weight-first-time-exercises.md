# 004 · Weight starts at 0 kg on never-done exercises; 0 kg can be committed

**Severity:** High — wrong data into history plus heavy tap cost, on every first encounter with an exercise.
**Layouts:** All (shared stepper + `defaultPending` in `SessionPage.tsx`).

## What happens

`defaultPending` prefills weight as `sessionWeight ?? lastTopWeight ?? 0`. For a never-done `weightReps` exercise that's **0 kg**, and the stepper moves 2.5 kg per tap with no hold-to-repeat and no typing:

- 40 kg = 16 taps; 60 kg = 24 taps. Workout B has six "never" exercises on first run.
- Tap ✓ before stepping and **"0kg · 12" is committed** (reproduced). No undo (see 005), so it's permanent — and it poisons the next session: `topWeight` = 0 prefills 0 again, and the "last:" label reads 0kg.

## Fix direction

Any of (compose freely):
- Hold-to-repeat / accelerating steppers (long-press = ×4 speed or 10 kg steps).
- Tap the value to type it (numeric input) — still stepper-first, typing as escape hatch.
- Guard the ✓ when weight is 0 on a `weightReps` exercise (confirm or block).
- First-time prefill from the template's sibling exercises or a sensible per-exercise floor is spec-creep — prefer the input fixes.
