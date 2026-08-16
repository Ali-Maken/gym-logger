# Architecture blueprint

Type: grilling
Status: resolved

## Question

The map's standing priority: cleanest code, clean architecture, principal-architect standard. Pin the blueprint before build (via /grilling + /codebase-design + /domain-modeling):

- Layering: where the Dexie boundary sits (repository/service seam so components never touch Dexie directly), what the domain layer owns vs the persistence shapes.
- Angular idiom: standalone components, signals vs RxJS for session state, route structure for the three screens, where the "what did I do last time" query lives.
- The write path for "never lose data": immediate commit per set — one service owning the active session, components dumb.
- Folder structure, naming conventions, strict-mode posture, and what gets unit-tested vs left alone in a single-user app.

Resolution is a short blueprint section for SPEC.md — deep modules, few seams, no ceremony a single-user offline app doesn't need.

## Answer

Resolved 2026-08-16 with the user — **one deep Logbook module, signals-first, two-tier tests**:

- **Module structure**: a single deep `Logbook` module is the only seam components see (~10 methods/signals, zero Dexie knowledge). Inside it, as private implementation: `db.ts` (Dexie schema + seed) and `core/domain/` — pure functions holding every rule this map decided (progression hint, rotation/graduation, last-time selection, guide-format log rendering). Folders: `core/` (logbook, db, domain), `features/home|session|history` (dumb components), `app.routes.ts`.
- **Logbook interface (gist)**: `templates()`, `suggestion()`, `activeSession()`, `start(templateId)`, `completeSet(...)`, `setSetup(...)`, `finish()`, `lastTimeFor(exerciseId)`, `hintFor(entry)`, `exportJson()`, `importJson(payload)`.
- **Reactivity**: Angular signals at the seam; mutations are async methods that **commit to Dexie first, then update the signal** (write-through — the never-lose-data path). No RxJS, no liveQuery (single writer reacting to its own writes is pointless). The 90s rest timer is session-screen UI state, not Logbook state.
- **Testing**: pure domain functions unit-tested thoroughly; Logbook integration-tested through its public interface against `fake-indexeddb` (write-through per set, restore atomicity); components untested by design — they're dumb, and the prototype covers look/feel.
- Rationale in deep-module terms: three callers, one body of complexity → one seam with real leverage; the layered repo/service/store alternative was rejected as hypothetical seams (one adapter each); component-local liveQuery rejected for failing locality.

### Amendment (2026-08-16, from [Session screen prototype](08-session-screen-prototype.md))

- **`SessionView` presentation seam**: the session feature splits into a thin container (owns route, Logbook wiring, layout selection, rest-timer state) and four dumb layout adapters — `LedgerView`, `FocusView`, `SheetView`, `MaterialView` — all consuming the same input contract (session signals + callbacks: `completeSet`, `step`, `choose`, `setSetup`, `skipTimer`). A future layout = one new adapter file + a registry entry; nothing else changes. This is a real seam (four adapters on day one). Default layout: Sheet; last choice persisted.
- **Theme tokens**: every color/type/radius/elevation decision is a CSS custom property; a theme is a token file applied via `data-theme` on the root. New themes are token-only. Layout and theme are independent axes.
- Layouts must contain zero domain logic — the ×4 maintenance cost the user accepted stays confined to presentation.
