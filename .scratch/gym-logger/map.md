# Wayfinder map: Gym Logger — build-ready spec

Label: wayfinder:map

## Destination

`SPEC.md` sharpened until it is build-ready: every data-model gap, scope question, and setup prerequisite decided and folded back into the spec. Building the app then happens **outside this map**, following the spec's own build order.

## Notes

- **Standing priority (user, 2026-08-16):** "in terms of design, you are a world level UI/UX designer, and user input and experience is first priority." Every UI-touching decision optimizes for one-handed, mid-set usability first.
- **Standing priority (user, 2026-08-16):** "coding should be the cleanest, clean architecture. YOU are a Principal Software Architect." The spec must pin an architecture blueprint (layering, boundaries, naming) before build; consult `/codebase-design` when resolving it.
- Tracker: local markdown (this directory). Tickets in `issues/`, numbered from `01`.
- Skills to consult: `/grilling` + `/domain-modeling` for decision tickets, `/prototype` for the session-screen ticket, `/research` for AFK research.
- Source of truth for exercises/doses: `gym-guide.html` (repo root). Do not invent exercises.
- The user trains alone, machines only, single device, no backend — offline-first is non-negotiable.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- [Per-template dose model](issues/01-dose-model.md) — prescription moves onto `Template.entries {exerciseId, sets, reps}`; `Exercise` drops its defaults; hint judges last reps vs today's target, reps-only on set-count mismatch.
- [Duration-based and cardio entries](issues/02-duration-entries.md) — cardio rows are in-list tick-offs; `Exercise.measure: weightReps|seconds|tick` replaces `tracksWeight`; `SetEntry {value, weight?}`; plank starts the rest timer, hint is weighted-only; `seat` generalizes to a `setup` field.
- [Ambiguous exercises in the guide](issues/03-ambiguous-exercises.md) — both open slots become log-time choices via `TemplateEntry.choiceIds`; each variant is a separate exercise with its own history; row defaults to last-used variant.
- [Rotation: when does Week 1 end?](issues/04-rotation-graduation.md) — count-based: suggest Week 1 until 3 finished sessions, then A, then alternate opposite-of-last; finished = `finishedAt` set; suggestion never locks.
- [Backup restore: import in scope?](issues/05-backup-restore.md) — yes: validate → summarize → confirm → atomic replace-all, next to export on History; export gains a `version` field.
- [GitHub repo + Pages setup](issues/06-github-repo.md) — `Ali-Maken/gym-logger` (public) live; Pages serves https://ali-maken.github.io/gym-logger/ from `main`/`docs`; base-href `/gym-logger/` fixed forever; `gh` not installed.
- [Architecture blueprint](issues/09-architecture-blueprint.md) — one deep `Logbook` seam over private Dexie + pure domain fns; signals-first, commit-then-signal write-through; tests = domain fns + Logbook vs fake-indexeddb.
- [Session screen prototype](issues/08-session-screen-prototype.md) — four layouts prototyped and ALL ship as selectable `SessionView` adapters (user's call); default = Sheet; theme-token system in scope; blueprint amended accordingly.
- [Fold decisions into SPEC.md](issues/10-fold-into-spec.md) — SPEC.md rewritten as v2, build-ready; destination reached.
- [Research: Angular PWA on GitHub Pages, offline-first](issues/07-research-pwa-pages.md) — Angular v22; ngsw handles `/REPO/` base-href natively (never rename the repo); use hash routing over the 404.html trick; `docs/` + `.nojekyll`; ngsw cache-busts past the Pages CDN's 10-min cache; iOS home-screen apps dodge the 7-day purge and `persist()` (Safari 15.2+) blocks eviction — but keep manual export as backstop.

## Not yet specified

*(empty — all fog graduated: seed values and hint presentation folded into SPEC.md v2; Home/History design follows the theme tokens and layout identities settled by the prototype.)*

## Status: DESTINATION REACHED (2026-08-16)

All tickets resolved. `SPEC.md` v2 is build-ready; building follows its build order, outside this map.

## Out of scope

- **Food/calorie tracking** — `food-page.html` is a reference file only; SPEC.md rules food tracking out.
- **Accounts, sync, cloud backup, charts, social, video library, body-weight tracking** — explicitly excluded by SPEC.md.
- **Post-month-1 programming** (new templates beyond Week 1 / A / B) — the guide covers the first month; anything later is a fresh effort.
- **Building the app** — execution follows the finished spec, outside this map.
