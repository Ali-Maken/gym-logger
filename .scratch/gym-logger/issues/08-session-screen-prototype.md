# Session screen prototype

Type: prototype
Status: open
Blocked by: 01, 02, 03

## Question

The map's standing priority is UX-first, and the session screen is the app: what does one-handed, mid-set logging actually look and feel like? Build a throwaway HTML prototype (via /prototype) with real exercises and doses from the resolved seed data, and react to it together:

- Collapsed row: name, target, last-time mono line (`45kg · 12/12/10`) — legibility at arm's length, sweaty-thumb tap targets.
- Expanded row: seat field, per-set weight/reps inputs with pre-fills, the set-complete tick. Number entry with minimal typing (steppers? pin-sized increments?).
- Rest-timer placement and behavior in the sticky footer; elapsed/progress; Finish.
- **Visual identity**: adopt `gym-guide.html`'s chalk/plate/mono aesthetic (Archivo + JetBrains Mono, plate colors) or something new? The guide's language is strong and already the user's own.
- Progression-hint marker ("↑ add weight") treatment.
- **Variant toggle** (from [Ambiguous exercises](03-ambiguous-exercises.md)): the B-chest and curl rows resolve to the last-used variant with a small switcher in the expanded row — prototype must show switching without disturbing one-handed flow.

Blocked by [Per-template dose model](01-dose-model.md), [Duration-based and cardio entries](02-duration-entries.md), [Ambiguous exercises](03-ambiguous-exercises.md) — the prototype needs the real list and real targets to be worth reacting to.
