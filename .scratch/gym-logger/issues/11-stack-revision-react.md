# Stack revision: Angular → Vite + React

Type: grilling
Status: resolved

## Question

Before implementation started (2026-08-17, mid step 1 scaffold), the user asked whether switching from Angular to React/Next.js was still possible. Decide the stack, and audit every closed ticket on the map for decisions the switch invalidates.

## Answer

**Decision (user's call): Vite + React.** Next.js was considered and rejected — its defining features (SSR, API routes, server components) are all disabled in a no-backend static-export app, and its path-based router fights GitHub Pages subpath hosting; plain React via Vite reaches the same static-files outcome directly.

**Idiom translation** (architecture unchanged, only vocabulary):

- Angular signals + `@Injectable` Logbook → **one Zustand store** owned by `core/logbook.ts`, consumed via selector hooks
- `@angular/pwa` / ngsw → **vite-plugin-pwa** (Workbox), `registerType: 'autoUpdate'`
- `withHashLocation()` → react-router **`createHashRouter`**
- `ng build --base-href` → `vite build` with `base: '/gym-logger/'`, `outDir: 'docs'`
- Angular test runner → **Vitest**; Dexie + fake-indexeddb unchanged

**Audit of closed tickets:**

- Carry over untouched: Per-template dose model · Duration/cardio entries · Ambiguous exercises · Rotation · Backup restore · GitHub repo + Pages (hosting facts and never-rename are framework-independent) · Session screen prototype (layouts are HTML/CSS references) · Architecture blueprint (deep Logbook seam, commit-then-update write-through, pure domain fns — all survive; only the signal idiom translated as above).
- **Partially superseded: [Research: Angular PWA on GitHub Pages](07-research-pwa-pages.md).** Framework-independent findings stand (hash routing rationale, `docs/.nojekyll`, Pages CDN 10-min cache, iOS home-screen persistence + `persist()`, never rename the repo). All ngsw-specific mechanics (cache-busting, `ngsw/state`, kill switch, base-href behavior) no longer apply — replacement facts must be verified, not assumed → [Research: Vite + React PWA on GitHub Pages](12-research-vite-pwa-pages.md).

SPEC.md, CLAUDE.md updated same day. Building had not started; nothing was thrown away.
