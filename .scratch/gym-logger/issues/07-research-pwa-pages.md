# Research: Angular PWA on GitHub Pages, offline-first

Type: research
Status: resolved

## Question

Ground the spec's deploy step (its self-declared riskiest part) in verified fact. Against primary sources (angular.dev, MDN, GitHub docs):

- Current Angular major version and `@angular/pwa` / `ngsw` behavior when the app is served from a subpath (`/REPO_NAME/`) — does the service worker scope and `ngsw.json` resolution work with `--base-href`, and any known gotchas.
- SPA deep-link 404s on GitHub Pages — hash-based routing vs the `404.html` redirect trick; which fits an offline-first single-user app best.
- Serving from `docs/` on `main`: exact settings, `.nojekyll` need, cache behavior/latency of Pages CDN vs service-worker updates (`ngsw` update flow).
- iOS Safari add-to-home-screen quirks for PWAs in 2026: storage eviction rules, `navigator.storage.persist()` support, anything that threatens "never lose data" on iPhone.
- Airplane-mode verification steps: how to confirm the SW controls the page fully offline.

Findings go to `.scratch/gym-logger/assets/research-angular-pwa-gh-pages.md` (no git branch — the repo has no commits yet). Resolution comment gists the answers that change the spec.

## Answer

Full findings with citations: [assets/research-angular-pwa-gh-pages.md](../assets/research-angular-pwa-gh-pages.md). Spec-changing facts:

- **Pin Angular v22** — current stable since 2026-06-03 (angular.dev/reference/releases); v21/v20 are LTS.
- **Subpath deploy just works**: ngsw registers `ngsw-worker.js` relative to the base href, so `--base-href /REPO_NAME/` gives scope `/REPO_NAME/`; `ngsw-config.json` paths are relative to the deployment root — no config edits needed. One hard constraint: service workers break behind redirects, so **fix the repo name before first deploy and never rename it**.
- **Use hash routing** (`withHashLocation()`), not the `404.html` redirect trick — GitHub Pages has no rewrites, hash URLs make deep-link 404s impossible online and offline with zero extra moving parts, and this app has no shareable-URL requirement. Drops the spec's riskiest workaround entirely.
- **`docs/` on `main` settings**: Pages → Deploy from a branch → `main` → `/docs`; put an empty **`docs/.nojekyll`** in the publishing root to disable Jekyll. Build output must be copied/emitted into `docs/`.
- **Pages CDN caching is a non-issue for updates**: Pages serves `Cache-Control: max-age=600` (verified empirically), but ngsw fetches `ngsw.json?ngsw-cache-bust=<random>` on every app open (verified in Angular source), defeating browser and CDN caches; new versions activate on next reload. Budget ~10 min deploy propagation.
- **iOS "never lose data" is achievable but conditional**: home-screen web apps are exempt from Safari's 7-day storage purge (own days-of-use counter, storage isolated from Safari — webkit.org), get browser-level quota (up to 60% of disk, Safari 17+ policy), and `navigator.storage.persist()` (Safari 15.2+) excludes the origin from automatic eviction, granted heuristically for installed apps. **Spec must mandate**: install to home screen + launch from icon, call `persist()` on startup and surface `persisted()` status, and keep a manual export/backup feature — deleting the icon or "Clear History and Website Data" still wipes everything.
- **Verification is scriptable**: prod build + `http-server` (SW never runs under `ng serve`), DevTools offline mode, Angular's built-in `ngsw/state` debug page, then on-device airplane-mode relaunch from the icon. Kill switch: delete `ngsw.json` (worker self-destructs); per-request bypass via `ngsw-bypass`.
