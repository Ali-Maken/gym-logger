# Gym Logger — build spec

An offline-first PWA for logging gym sessions. Single user, single device, no backend.

Two reference files sit in this repo: `gym-guide.html` and `food-page.html`. **Read `gym-guide.html` before starting** — the exercises, set/rep counts, machine notes and the A/B workout rotation all come from it. Do not invent exercises.

---

## Non-negotiables

- **Works with zero network.** Gym basements have no signal. Every screen must function fully offline after first load.
- **Never lose data.** Writes commit immediately, not on some "save session" button at the end.
- **One-handed, mid-set usable.** Big tap targets, minimal typing, no modals that need dismissing carefully.
- **The killer feature is "what did I do last time".** Every exercise, while logging, shows the previous session's weight and reps for that same exercise. This is the entire reason the app exists. If this works and nothing else does, it's still a success.

## Stack

- Angular (latest), standalone components, TypeScript strict mode
- **Dexie** for IndexedDB (`npm i dexie`) — don't hand-roll IndexedDB
- `@angular/pwa` for service worker + manifest
- No backend, no auth, no HTTP calls at all
- Deploy: GitHub Pages from `docs/` on `main`

## Data model

```ts
interface Exercise {
  id: string;           // 'leg-press'
  name: string;         // 'Leg press'
  note?: string;        // machine tip from the guide
  group: 'legs' | 'push' | 'pull' | 'core' | 'cardio';
  defaultSets: number;
  defaultReps: number;  // target reps, e.g. 12
  tracksWeight: boolean; // false for plank, treadmill
}

interface Template {
  id: 'week1' | 'a' | 'b';
  name: string;         // 'Workout A · push & legs'
  exerciseIds: string[]; // ordered
}

interface SetEntry {
  reps: number;
  weight?: number;      // kg
}

interface LoggedExercise {
  exerciseId: string;
  seat?: string;        // free text: '4', 'pad 5'
  sets: SetEntry[];
  note?: string;
}

interface Session {
  id: string;
  templateId: Template['id'];
  startedAt: number;    // epoch ms
  finishedAt?: number;
  exercises: LoggedExercise[];
  note?: string;
}
```

Seed `Exercise` and `Template` tables on first run from the contents of `gym-guide.html`.

## Screens

**1. Home**
- Three cards: Week 1, Workout A, Workout B.
- Each shows when it was last done ("3 days ago" / "never").
- Suggest the next one in rotation if A and B have both been done — last was A, suggest B.
- Button: Start session.

**2. Session (the main screen)**
- Ordered list of the template's exercises.
- Each row collapsed shows: name, target (`3 × 12`), and last session's result in mono (`45kg · 12/12/10`).
- Tap to expand: seat field (pre-filled from last session), then one row per set with a weight input and a reps input. Weight pre-fills from last session's top set. Reps pre-fill with the target.
- Tick to complete a set. Completed exercises collapse and grey out.
- A per-exercise note field, collapsed by default.
- Sticky footer: elapsed time, exercises done / total, Finish.
- **Rest timer:** on completing a set, a 90-second countdown starts in the sticky footer. Tappable to reset or skip. No sound needed.

**3. History**
- Reverse-chronological list of sessions: date, template name, duration, exercise count.
- Tap for read-only detail in the same shape as the log format in the guide.
- Export all data as JSON to clipboard or file download. This is the only backup that exists — make it obvious.

## Progression hint

When every set of an exercise hit or beat its target reps last session, show a small marker on that exercise ("↑ add weight"). Rule from the guide: complete all sets at target reps with reps in reserve, then add one pin next time. Nothing automatic — it's a suggestion, the user decides.

## Explicitly out of scope

No accounts, no sync, no cloud backup, no charts or graphs, no social features, no exercise video library, no calorie or food tracking, no body-weight tracking. Do not add these. If a feature isn't listed above, don't build it.

## Deploy

- `ng build --base-href /REPO_NAME/` output into `docs/`
- Enable GitHub Pages → main branch → `/docs`
- Verify the service worker registers and the app loads with the phone in airplane mode after first visit.

---

## Build order

Do these as separate steps, confirming each works before moving on.

1. **Scaffold and deploy an empty shell.** Angular app, PWA added, built into `docs/`, live on GitHub Pages, installable to a phone home screen, opens in airplane mode. Prove the hardest part first — base-href and service-worker issues are what break this kind of project.
2. **Data layer.** Dexie schema, seed exercises and templates from `gym-guide.html`, verify in DevTools.
3. **Session screen** with last-time lookup. The core feature.
4. **Home screen** with rotation suggestion.
5. **History and JSON export.**
6. **Rest timer and progression hints.**
