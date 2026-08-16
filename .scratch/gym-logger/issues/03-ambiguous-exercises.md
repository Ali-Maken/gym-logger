# Ambiguous exercises in the guide

Type: grilling
Status: resolved

## Question

The guide lists "Pec deck **or** incline chest press" (Workout B) and "Bicep curl (machine **or** dumbbell)". Seed data needs concrete exercise ids. One pinned exercise each (which?), or a runtime choice the logger must support? Recommendation to grill against: pin one id each — a choice mechanism complicates "what did I do last time" for no first-month benefit; the user can rename later.

## Answer

Resolved 2026-08-16 with the user — **both slots support a log-time choice** (user's call, over the pin-one recommendation), with the mechanism designed to protect the last-time lookup:

- Each variant is a **full Exercise with its own history**: seed `pec-deck` + `incline-chest-press` and `machine-curl` + `dumbbell-curl` (four exercises, two slots).
- `TemplateEntry` gains optional `choiceIds: string[]`; when present, the session row resolves to one variant: **defaults to the variant used last** (first-listed when never used), switchable via a small toggle in the expanded row.
- Last-time line, weight/seat pre-fills, and the ↑ hint all read the **chosen variant's** history — the day you switch machines, the numbers are that machine's numbers.
- Seed targets: both chest variants 3×12 (Workout B); both curls follow the slot's dose (Week 1: 1×12 dumbbell-or-machine, Workout B: 2×12).
