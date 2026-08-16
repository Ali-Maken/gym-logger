# Per-template dose model

Type: grilling
Status: resolved

## Question

Where do set/rep targets live? SPEC.md puts `defaultSets`/`defaultReps` on `Exercise`, but `gym-guide.html` gives the *same* exercise different doses per template: leg press is 2×12 in Week 1 but 3×12 in Workout A; triceps pushdown 1×12 vs 2×12; bicep curl 1×12 (Week 1) vs 2×12 (Workout B). The current model cannot represent this.

Options to weigh (via /grilling + /domain-modeling):
- Move the dose onto template entries: `Template.entries: { exerciseId, sets, reps }[]` — exercise stays identity + machine note, template owns the prescription.
- Keep `Exercise` defaults and add a per-template override map.
- Duplicate exercises per template (rejected up front? — breaks "what did I do last time" continuity across templates).

Ripple effects to settle in the same session: the progression hint ("hit target reps last session") becomes template-relative; the session screen's collapsed row shows the target (`3 × 12`) — which target when last session was a different template?

## Answer

Resolved 2026-08-16 with the user:

- **The prescription lives on template entries.** `Template.entries: { exerciseId, sets, reps }[]` (ordered) replaces `exerciseIds`; `Exercise` loses `defaultSets`/`defaultReps` and keeps identity + machine note + group + `tracksWeight`. Same `exerciseId` across templates keeps history unified, so "what did I do last time" survives the Week 1 → A/B transition.
- **Progression hint judges last session's reps against TODAY'S target** (user's call, over the judge-vs-own-session recommendation), with the **reps-only rule** for set-count mismatches: show "↑ add weight" when every set logged last time hit or beat today's target reps, ignoring set count. Never goes mute after graduation.
- **Collapsed-row target** is today's template's prescription; the last-time mono line renders history exactly as logged (2 sets shows 2 numbers).

Unblocks [Duration-based and cardio entries](02-duration-entries.md) — duration targets now also live on template entries, whatever unit shape that ticket picks.
