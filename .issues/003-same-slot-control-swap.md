# 003 · Rest timer swaps into the position of Log set / Finish

**Severity:** High — accidental actions with real consequences, at the exact spot the thumb just tapped.
**Layouts:** Focus, Material.

## Focus: Log set ↔ skip rest

Tapping "LOG SET n" instantly replaces it — same position, same full-width size — with the red "1:30 REST — TAP TO SKIP" button (`FocusView.tsx`, ThumbZone). A habitual double-tap, or a bounce tap, silently skips the entire 90 s rest. Reproduced: the swap is immediate, no dead time.

## Material: rest timer ↔ Finish

The footer slot holds the Finish FAB normally and the rest timer during rest (`MaterialView.tsx` footer). Two consequences, both reproduced:

- Finish is unreachable for the whole 90 s rest.
- Impatient taps on the timer: tap 1 skips rest → Finish appears under the thumb → tap 2 arms it ("Sure?") → tap 3 **ends the session**. A finished session can't be reopened.

## Fix direction

Never swap a destructive/primary control into a spot that was just tapped. Options: brief (~500 ms) disabled state after the swap; give the rest timer its own slot (Sheet's ring pattern); in Material show timer *beside* Finish like Ledger does.
