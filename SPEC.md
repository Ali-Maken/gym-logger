# Gym Logger — build spec (v2, build-ready)

An offline-first PWA for logging gym sessions. Single user, single device, no backend.

This is the v2 spec: every open question from v1 was resolved through the wayfinder map at `.scratch/gym-logger/map.md` — each decision's full reasoning lives in its ticket there. Reference files in this repo: `gym-guide.html` (source of truth for exercises, doses, rotation, log format — do not invent exercises) and `food-page.html` (unused; food tracking is out of scope).

---

## Non-negotiables

- **Works with zero network.** Every screen functions fully offline after first load.
- **Never lose data.** Writes commit to IndexedDB immediately — commit first, then update UI state. No "save session" button.
- **One-handed, mid-set usable.** Big tap targets, minimal typing, no fragile modals.
- **The killer feature is "what did I do last time".** Every exercise, while logging, shows the previous session's result for that same exercise. If this works and nothing else does, it's still a success.
- **iOS data survival** (from research): the app must be installed to the home screen and launched from its icon; call `navigator.storage.persist()` on startup and surface the `persisted()` status; keep export/import as the manual backstop — icon deletion or "Clear History and Website Data" still wipes IndexedDB.

## Stack

> Stack revised 2026-08-17: originally Angular v22 (decision history in `.scratch/gym-logger/`); switched to Vite + React by user decision. Architecture is unchanged — only idiom.

- **Vite + React** (create-vite `react-ts` template, React 19), TypeScript strict mode
- **Zustand** for Logbook state — one store owned by `core/logbook.ts`, consumed through selector hooks; no context trees, no observables
- **Dexie** for IndexedDB (`npm i dexie`) — don't hand-roll IndexedDB; `fake-indexeddb` as a dev dependency for tests
- **vite-plugin-pwa** (Workbox) for service worker + manifest, `registerType: 'autoUpdate'`
- **Hash routing** (react-router `createHashRouter`) — GitHub Pages has no rewrites; hash URLs make deep-link 404s impossible online and offline. No `404.html` trick.
- **Vitest** for tests (Vite-native)
- No backend, no auth, no HTTP calls at all
- Deploy: GitHub Pages from `docs/` on `main` (already enabled and verified — see Deploy)

## Architecture

Decided in the blueprint ticket; deep-module vocabulary, no ceremony.

```
src/
  core/
    logbook.ts        ← THE seam: Zustand store + async methods; the only thing features may import
    db.ts             ← Dexie schema + seed (private to core)
    domain/           ← pure functions: hint rule, rotation, last-time selection, log formatting
  features/
    home/
    session/
      SessionPage.tsx     ← thin container: route, Logbook wiring, layout selection, rest timer
      views/              ← four dumb layout adapters (see Session screen)
    history/
  themes/             ← one token file per theme
  router.tsx
```

- **Logbook**: the single deep module — one Zustand store created in `core/logbook.ts`, consumed via exported selector hooks and async methods. Interface gist: `templates`, `suggestion`, `activeSession`, `start(templateId)`, `completeSet(...)`, `setSetup(...)`, `finish()`, `lastTimeFor(exerciseId)`, `hintFor(entry)`, `exportJson()`, `importJson(payload)`. Components never touch Dexie.
- **Write path**: every mutation is `await db... put` **first**, then the store `set(...)` — the never-lose-data guarantee.
- **`SessionView` seam**: the session container renders one of four dumb layout adapters, all consuming the same contract (session state + callbacks `completeSet`, `step`, `choose`, `setSetup`, `skipTimer`). A future layout = one new adapter + a registry entry. Layouts contain **zero domain logic**.
- **Theme tokens**: every color/type/radius/elevation is a CSS custom property; a theme is a token file applied via `data-theme` on the root. Themes and layouts are independent axes; a new theme is token-only.
- **Testing**: pure domain functions get thorough unit tests; Logbook gets integration tests through its public interface against `fake-indexeddb` (write-through per set, import atomicity). Components are dumb and untested.

## Data model

```ts
interface Exercise {
  id: string;            // 'leg-press'
  name: string;          // 'Leg press'
  note?: string;         // machine tip from the guide
  group: 'legs' | 'push' | 'pull' | 'core' | 'cardio';
  measure: 'weightReps' | 'seconds' | 'tick';
  // weightReps: weight + reps per set · seconds: timed holds (plank)
  // tick: done/not-done rows (cardio) — no set inputs
}

interface TemplateEntry {
  exerciseId: string;    // resolved choice (defaults to last-used variant)
  choiceIds?: string[];  // when present: log-time variants, each a full Exercise
  sets: number;          // tick: 1
  target: number;        // reps | seconds | minutes-as-label (tick)
}

interface Template {
  id: 'week1' | 'a' | 'b';
  name: string;          // 'Workout A · push & legs'
  entries: TemplateEntry[]; // ordered; the dose lives HERE, not on Exercise
}

interface SetEntry {
  value: number;         // reps or seconds, per measure
  weight?: number;       // kg; only for weightReps
}

interface LoggedExercise {
  exerciseId: string;
  setup?: string;        // free text: 'seat 4', 'pad 5', 'incline 6'
  sets: SetEntry[];
  note?: string;
}

interface Session {
  id: string;
  templateId: Template['id'];
  startedAt: number;     // epoch ms
  finishedAt?: number;   // unset = abandoned; only finished sessions count anywhere
  exercises: LoggedExercise[];
  note?: string;
}

interface ExportPayload {
  version: 1;            // bump on schema change; import migrates old versions
  sessions: Session[];
  // plus any user-modified state (chosen variants, layout/theme prefs)
}
```

Variants (`choiceIds`) are **separate exercises with separate histories** — last-time lookup, pre-fills, setup, and the hint always read the chosen variant's own history.

## Seed data

Seed on first run from these tables (derived from `gym-guide.html`).

**Exercises** (`id · name · group · measure · note`):

| id | name | group | measure | note |
|---|---|---|---|---|
| warmup | Treadmill or bike warm-up | cardio | tick | Flat, easy pace. This is your warm-up. |
| leg-press | Leg press | legs | weightReps | Feet mid-platform, shoulder width. Don't let knees collapse inward. Heaviest lift — do it first. |
| chest-press | Seated chest press | push | weightReps | Handles level with mid-chest, not neck. |
| lat-pulldown | Lat pulldown | pull | weightReps | Pull to collarbone, in front of your head. Thigh pad snug. |
| cable-row | Seated cable row | pull | weightReps | Chest up, pull to belly, squeeze shoulder blades. |
| shoulder-press | Machine shoulder press | push | weightReps | Lighter than you think. Stop before your lower back arches. |
| triceps-pushdown | Triceps pushdown | push | weightReps | Elbows pinned to your sides. |
| machine-curl | Machine bicep curl | pull | weightReps | No swinging. If you swing, halve the weight. |
| dumbbell-curl | Dumbbell bicep curl | pull | weightReps | No swinging. If you swing, halve the weight. |
| leg-curl | Leg curl | legs | weightReps | Hamstrings, back of the thigh. |
| leg-extension | Leg extension | legs | weightReps | Quads, front of the thigh. |
| pec-deck | Pec deck | push | weightReps | — |
| incline-chest-press | Incline chest press | push | weightReps | — |
| lateral-raise | Lateral raise | push | weightReps | Very light. 5 kg is a real working weight here. |
| plank | Plank | core | seconds | On knees if needed. Straight line hips to shoulders. |
| incline-walk | Incline walk | cardio | tick | Brisk but you can still talk. |

**Templates** (entries in order; `[a, b]` = choiceIds):

- **week1 · "Week 1"**: warmup 1×5 · leg-press 2×12 · chest-press 2×12 · lat-pulldown 2×12 · cable-row 2×12 · shoulder-press 2×10 · triceps-pushdown 1×12 · [machine-curl, dumbbell-curl] 1×12 · incline-walk 1×10
- **a · "Workout A · push & legs"**: warmup 1×5 · leg-press 3×12 · chest-press 3×12 · lat-pulldown 3×12 · shoulder-press 3×10 · triceps-pushdown 2×12 · plank 3×30 · incline-walk 1×15
- **b · "Workout B · pull & legs"**: warmup 1×5 · leg-curl 3×12 · leg-extension 3×12 · cable-row 3×12 · [pec-deck, incline-chest-press] 3×12 · lateral-raise 2×15 · [machine-curl, dumbbell-curl] 2×12 · plank 3×30 · incline-walk 1×15

## Screens

**1. Home**
- Three cards: Week 1, Workout A, Workout B. Each shows when it was last finished ("3 days ago" / "never").
- **Suggestion rule** (count-based graduation; suggestion only, all cards always startable):
  - fewer than 3 finished Week 1 sessions → suggest Week 1
  - 3+ finished Week 1, no A/B yet → suggest Workout A
  - otherwise → the opposite of whichever of A/B was finished last
  - "Finished" = `finishedAt` set. Abandoned sessions never advance the rotation.
- Button: Start session.

**2. Session (the main screen)**
- Rendered by one of **four selectable layouts** (all ship; switcher in the session screen; last choice persisted; **default: Sheet**). Reference for all four: the prototype at `.scratch/gym-logger/assets/session-prototype.html`.
  - **Ledger** — gym-guide chalk/ink accordion list
  - **Focus** — dark, one exercise per screen, giant thumb-zone controls
  - **Sheet** — compact checklist + fixed bottom control sheet (default)
  - **Material** — Material 3 idiom, plate-blue primary
- Shared behavior across layouts:
  - Rows show name, today's target (`3 × 12`, `3 × 30s`, `15 min`), and last session's result in mono (`45kg · 12/12/10`, `30/30/25s`, or `never`).
  - Expanded: **setup** free-text field (pre-filled from the chosen exercise's last session), then one row per set — weight (steps of 2.5 kg) and reps (or seconds, steps of 5s) with weight pre-filled from last session's top set and value pre-filled with today's target. Tick to complete a set; completed exercises collapse/grey out.
  - **Variant rows** (`choiceIds`): resolve to the last-used variant; a small toggle switches; all numbers follow the chosen variant's history.
  - **Tick rows** (cardio): single tap to mark done; no inputs; never start the rest timer.
  - Per-exercise note field, collapsed by default.
  - Elapsed time, exercises done/total, Finish — placement per layout.
- **Rest timer**: completing any weightReps or seconds set starts a 90s countdown (session-screen state, not Logbook). Tappable to skip; no sound.

**3. History**
- Reverse-chronological finished sessions: date, template name, duration, exercise count.
- Detail view renders in the guide's log shape (setup · weight · reps-per-set · note), round-tripping `Plank 30 / 30 / 25s` and `Walk  incline 6  15 min` faithfully.
- **Export**: all data as versioned JSON to clipboard or file download. Make it obvious — it's the only backup.
- **Import (restore)**: next to export. Paste JSON or pick a file → validate shape → show summary ("14 sessions, Aug 1–16 — replace current data?") → explicit confirm → atomic wipe-and-load in one Dexie transaction. Invalid input is rejected untouched. Replace-all only; no merge.

## Progression hint

Show "↑ add weight" on a `weightReps` exercise when **every set logged in its last session hit or beat today's target reps** — reps-only, ignoring set-count differences between templates (so the hint survives the Week 1 → A/B graduation). Never on `seconds` or `tick` entries. A suggestion, nothing automatic.

## Explicitly out of scope

No accounts, no sync, no cloud backup, no charts or graphs, no social features, no exercise video library, no calorie or food tracking, no body-weight tracking, no post-month-1 programming. If a feature isn't listed above, don't build it.

## Deploy (verified facts)

- Repo: `git@github.com:Ali-Maken/gym-logger.git` (public). **Never rename it** — service workers break behind redirects.
- Pages is already enabled (`main` → `/docs`) and serving: https://ali-maken.github.io/gym-logger/ with `docs/.nojekyll` in place.
- Build: `vite build` with `base: '/gym-logger/'` and `outDir: 'docs'` in `vite.config.ts`. `.nojekyll` lives in `public/` so every build carries it into `docs/` (verified: Vite copies dotfiles from `public/` unfiltered). Subpath needs nothing beyond `base` — manifest `scope`/`start_url` default to it and the SW registers as `${base}sw.js` with matching scope.
- Updates: the app entry **must** call `import { registerSW } from 'virtual:pwa-register'; registerSW({ immediate: true })` — `registerType: 'autoUpdate'` forces `skipWaiting`/`clientsClaim`, but the automatic reload only happens through that import (caveat: an auto-reload can discard un-committed in-page state — keep write-through per set). Browsers bypass their *own* cache when re-checking `sw.js`, not the Pages CDN edge; worst case ≈ publish latency + ~10 min edge staleness + next app launch.
- iOS extras vite-plugin-pwa does **not** generate: hand-add `<link rel="apple-touch-icon">` (180×180 PNG in `public/`) to `index.html`; manifest icons at 192 + 512 (incl. maskable), `display: 'standalone'`, matching `theme_color` + meta tag.
- Verification (each release): prod build served locally via `vite preview` (production SW fully works there; under `vite dev` it runs only with `devOptions.enabled` and precaches nothing useful — don't test offline there) → DevTools offline mode → Application → Service Workers panel → on-device airplane-mode relaunch from the home-screen icon. Kill switch: redeploy once with `selfDestroying: true`, keeping the plugin config — especially the SW filename — otherwise unchanged so the self-destroying worker lands at the broken worker's URL.
- Research notes: `.scratch/gym-logger/assets/research-vite-pwa-gh-pages.md` (current stack); `.scratch/gym-logger/assets/research-angular-pwa-gh-pages.md` (Angular-era; its GitHub Pages + iOS persistence facts still hold).

## Build order

Confirm each step works before the next.

1. **Scaffold + deploy the shell.** Vite + React app, `vite-plugin-pwa`, hash routing, built into `docs/`, replacing the placeholder. Verify installable + opens in airplane mode. (Pages side is already proven.)
2. **Data layer.** Dexie schema, seed tables above, `persist()` on startup; verify in DevTools.
3. **Logbook + domain functions, with tests.** Hint rule, rotation, last-time selection, log formatting as pure functions; Logbook integration tests on fake-indexeddb.
4. **Session container + Sheet layout.** The killer feature, in the default layout.
5. **Home screen** with the suggestion rule.
6. **History + export/import.**
7. **Rest timer + progression hints** (if not already landed with 4).
8. **Remaining layouts** (Ledger, Focus, Material) as SessionView adapters + theme-token pass.
