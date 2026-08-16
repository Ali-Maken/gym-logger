# Session screen prototype

Type: prototype
Status: resolved
Blocked by: 01, 02, 03

## Question

The map's standing priority is UX-first, and the session screen is the app: what does one-handed, mid-set logging actually look and feel like? Build a throwaway HTML prototype (via /prototype) with real exercises and doses from the resolved seed data, and react to it together:

- Collapsed row: name, target, last-time mono line (`45kg · 12/12/10`) — legibility at arm's length, sweaty-thumb tap targets.
- Expanded row: seat field, per-set weight/reps inputs with pre-fills, the set-complete tick. Number entry with minimal typing (steppers? pin-sized increments?).
- Rest-timer placement and behavior in the sticky footer; elapsed/progress; Finish.
- **Visual identity**: adopt `gym-guide.html`'s chalk/plate/mono aesthetic (Archivo + JetBrains Mono, plate colors) or something new? The guide's language is strong and already the user's own.
- Progression-hint marker ("↑ add weight") treatment.
- **Variant toggle** (from [Ambiguous exercises](03-ambiguous-exercises.md)): the B-chest and curl rows resolve to the last-used variant with a small switcher in the expanded row — prototype must show switching without disturbing one-handed flow.

## Answer

Resolved 2026-08-16. Prototype (4 interactive variants, shared live state): [assets/session-prototype.html](../assets/session-prototype.html), published at https://claude.ai/code/artifact/bb94f266-6d20-4b09-8f34-f2d5cfe995fa.

- Variants built: **A · Ledger** (gym-guide chalk/ink accordion), **B · Focus** (dark one-exercise pager, thumb-zone controls), **C · Sheet** (checklist + fixed bottom control sheet), **D · Material** (Material 3 idiom, plate-blue primary).
- **User's decision: ALL FOUR ship as selectable layouts**, and the architecture must let any future layout be added purely additively with full data access. (Agent argued for one layout + swappable seam; user chose all four knowingly — maintenance ×4 accepted.)
- **Default layout: C — Sheet.** A layout switcher lives in the session screen; the app remembers the last choice.
- **Theme system is in scope**: all colors/type/radii as CSS custom-property tokens; a theme = a token file selected via `data-theme`; future themes are token-only additions.
- Each layout keeps the visual identity prototyped here; per-layout mechanics (steppers, per-set tick, choice toggle, rest-timer placement) follow the prototype.
- Architecture consequence recorded as an amendment on [Architecture blueprint](09-architecture-blueprint.md): a `SessionView` presentation seam with four adapters over the same Logbook signals.

Blocked by [Per-template dose model](01-dose-model.md), [Duration-based and cardio entries](02-duration-entries.md), [Ambiguous exercises](03-ambiguous-exercises.md) — the prototype needs the real list and real targets to be worth reacting to.
