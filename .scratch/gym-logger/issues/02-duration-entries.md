# Duration-based and cardio entries

Type: grilling
Status: resolved
Blocked by: 01

## Question

Plank is `3 × 30s`; treadmill/incline walks are `5 min` / `15 min`. `SetEntry { reps, weight? }` cannot express seconds or minutes, and the spec is silent on whether warm-up/cardio rows belong in templates at all.

Decide (via /grilling + /domain-modeling):
- Are treadmill warm-up and incline walk rows part of the template list (tick-off only?) or omitted from logging entirely?
- How does the model express a duration target and a duration result — a `unit` on the dose, seconds-as-reps, or a distinct entry kind?
- Does the guide's log format (`Plank 30 / 30 / 25s`, `Walk incline 6 15 min`) round-trip through the model? History detail must render in that shape.
- Does completing a plank set start the 90s rest timer? Does the progression hint apply to duration entries?

Blocked by [Per-template dose model](01-dose-model.md) because wherever the dose lives is where its unit lives.

## Answer

Resolved 2026-08-16 with the user:

- **Cardio rows are in the template list, tick-off only.** They appear in order (warm-up first, incline walk last) so the session screen walks the whole workout; completing one is a single tap, no inputs. `sets: 1` for tick entries; the walk's incline lives in the free-text setup field.
- **The measurement is a fact of the exercise**: `Exercise.measure: 'weightReps' | 'seconds' | 'tick'` replaces `tracksWeight`. `TemplateEntry` stays `{ exerciseId, sets, target }` with `target` read in the exercise's unit (reps, seconds, or minutes-as-label for tick). `SetEntry` becomes `{ value: number; weight?: number }` — value is reps or seconds; weight only for `weightReps`.
- **Rest timer**: completing a plank set starts the 90s countdown (the guide's rest rule covers all sets); cardio tick-offs never do.
- **Progression hint**: `weightReps` only. No "hold longer" variant — the guide keeps plank at 3×30s all month.
- Ripple recorded for the spec: the `seat` field generalizes to a free-text **setup** field (`seat 4`, `pad 5`, `incline 6`), and history round-trips the guide's log format: `Plank 30 / 30 / 25s`, `Walk  incline 6  15 min`.
