# Gym Logger

Offline-first Vite + React PWA for logging gym sessions. Single user, single device, no backend, no HTTP calls. (Stack revised 2026-08-17 from Angular to Vite + React, before any implementation; architecture unchanged.)

**`SPEC.md` is the build-ready spec (v2) — read it before building anything.** Decision history lives in `.scratch/gym-logger/` (wayfinder map + tickets). `gym-guide.html` is the source of truth for exercises; never invent exercises.

## Standing priorities (user-set)

- **UX first**: one-handed, mid-set usability beats everything. Big tap targets, minimal typing.
- **Cleanest code, clean architecture**: principal-architect standard. Argue trade-offs once, then build what the user chose.

## Architecture rules (non-negotiable)

- **One deep seam**: components import only the Logbook module (`src/core/logbook.ts`). Nothing outside `core/` may touch Dexie or `db.ts`.
- **Domain logic is pure functions** in `core/domain/` (hint rule, rotation, last-time selection, log formatting). Never put domain rules in components.
- **Write-through order**: every mutation awaits the Dexie write FIRST, then updates the store. This is the never-lose-data guarantee — do not reorder.
- **One Zustand store** owned by Logbook, consumed via selector hooks; no observables, no Dexie liveQuery, no context trees.
- **SessionView seam**: session layouts (`Ledger`, `Focus`, `Sheet`, `Material`) are dumb adapters over one shared contract; zero domain logic in layouts. New layout = new adapter + registry entry, nothing else changes.
- **Theme tokens**: all colors/type/radii are CSS custom properties; a theme is a token file on `data-theme`. Never hard-code a themed value in a component style.
- **Tests**: unit-test domain functions; integration-test Logbook through its public interface against `fake-indexeddb`. No component tests.
- **Scope**: if a feature isn't in SPEC.md, don't build it.

## Repo facts

- Remote: `git@github.com:Ali-Maken/gym-logger.git` (GitHub account is **Ali-Maken**; SSH key auths as it). **Never rename the repo** — base-href `/gym-logger/` is permanent (service workers break behind redirects).
- Deploy: `npm run build` (Vite, `base: '/gym-logger/'`, `outDir: 'docs'`; `.nojekyll` ships from `public/`). Pages already enabled: https://ali-maken.github.io/gym-logger/
- Hash routing (react-router `createHashRouter`), `navigator.storage.persist()` on startup.
- `gh` CLI is not installed; GitHub API work needs the user to install/auth it.
