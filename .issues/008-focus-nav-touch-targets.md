# 008 · Focus navigation targets are 34 px tall

**Severity:** Medium — hits the "big tap targets, one-handed" standing priority on the layout built for exactly that.
**Layouts:** Focus.

## What happens

Measured: `‹ prev` 65×34 px, `Finish` 66×35 px, `next ›` 65×34 px — all under the 44 px touch minimum, at the very bottom edge, and they are the **only** way to move between exercises in Focus (no swipe gesture, no tapping the progress dots). Every exercise transition mid-workout is a precision tap; Finish sits directly between the two buttons the user actually wants (the two-tap guard catches a mis-tap, but it still interrupts).

## Fix direction

Grow the row to ≥48 px tall targets with full-thirds hit areas (prev/next each take ~40% width), and/or add horizontal swipe on the stage to change exercises. Consider moving Finish out of the prev/next row (e.g. into the top bar) so the navigation row is purely navigation.
