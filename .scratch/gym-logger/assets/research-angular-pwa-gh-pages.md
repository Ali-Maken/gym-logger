# Research: Angular PWA on GitHub Pages, offline-first

Researched 2026-08-16 against primary sources (angular.dev, docs.github.com, webkit.org, MDN, caniuse, Angular source on GitHub). Consumer: the Gym Logger build spec — offline-first, single-user Angular PWA deployed from `docs/` on `main` to GitHub Pages.

## 1. Current Angular version

- **Angular v22 is the current stable major**, released **2026-06-03** (active support to 2027-06, LTS to 2028-06). v21 (2025-11-19) and v20 (2025-05-28) are in LTS; anything older is unsupported. Cadence: one major every 12 months, 4–6 minors per major.
  Source: <https://angular.dev/reference/releases>
- Spec should pin **Angular 22** (`ng new` on latest CLI gives v22).

## 2. `@angular/pwa` / ngsw under a `/REPO_NAME/` subpath

- `ng add @angular/pwa` adds `@angular/service-worker`, generates `ngsw-config.json`, `manifest.webmanifest`, icons, and registers the worker with the root providers. Source: <https://angular.dev/ecosystem/service-workers/getting-started>
- The worker is registered with the **relative path `ngsw-worker.js`**, which the browser resolves against the document base URL. Building with `--base-href /REPO_NAME/` therefore registers `/REPO_NAME/ngsw-worker.js` with scope `/REPO_NAME/` — **subpath deployment works out of the box; no manual scope config needed** (an explicit `scope` option exists in `SwRegistrationOptions` if ever required). Source: <https://angular.dev/ecosystem/service-workers/getting-started>
- Paths inside `ngsw-config.json` beginning with `/` are **relative to the deployment root** (the built output directory), not the domain root — so the default config needs **no edits** for a subpath deploy. Source: <https://angular.dev/ecosystem/service-workers/config>
- The worker fetches its manifest via a URL relative to its own scope, with a random cache-buster. Verified in Angular source (`packages/service-worker/worker/src/driver.ts`, `fetchLatestManifest`):

  ```ts
  this.adapter.newRequest('ngsw.json?ngsw-cache-bust=' + Math.random())
  ```

  Source: <https://github.com/angular/angular/blob/main/packages/service-worker/worker/src/driver.ts>
- **Gotcha — redirects break service workers**: "Service workers don't work behind redirect." If the site's URL ever changes (repo rename, custom domain later), cached workers keep requesting the old location and break; the escape hatches are deleting/renaming `ngsw.json` (worker self-destructs on 404) or serving `safety-worker.js` at the old worker URL. Practical consequence: **pick the repo name before first deploy and don't rename it.** Source: <https://angular.dev/ecosystem/service-workers/devops>
- The SW only takes effect in **production builds served by a real HTTP server** — `ng serve` does not run it; use e.g. `npx http-server -p 8080 -c-1 dist/<app>/browser` for local verification. Source: <https://angular.dev/ecosystem/service-workers/getting-started>

## 3. SPA routing on GitHub Pages: hash routing vs 404.html trick

- Angular's own deployment guidance: routed apps require the server to **fall back to `index.html`** for unknown paths ("Configure the fallback route or 404 page to `index.html` for your server"). Source: <https://angular.dev/tools/cli/deployment>
- GitHub Pages offers **no rewrite rules** — only static serving from `/` or `/docs` plus an optional custom `404.html` in the publishing source. Sources: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>, <https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site>
- The `404.html` redirect trick (canonical implementation: <https://github.com/rafgraph/spa-github-pages>) serves a script that stashes the path and redirects to `index.html`, which restores it. It works, but it is a community workaround, still returns HTTP 404 on first hit, and adds moving parts to the exact step the spec calls its riskiest.
- **Recommendation: hash routing** (`withHashLocation()` on `provideRouter`). Every URL is `/REPO_NAME/#/route`, so the server only ever sees `/REPO_NAME/` — deep-link 404s become impossible, online and offline, with zero extra files. For a single-user app with no shared/SEO-relevant URLs, the cosmetic cost of `#` is irrelevant.
- If path-style URLs were ever wanted instead: ngsw already serves the cached index for offline navigation requests — default `navigationUrls` is `['/**', '!/**/*.*', '!/**/*__*', '!/**/*__*/**']` and default `navigationRequestStrategy` is `'performance'` (serve cached index; `'freshness'` hits network first and falls back when offline). Only the **first-ever visit** to a deep link (before the SW controls the page) needs the 404 trick. Source: <https://angular.dev/ecosystem/service-workers/config>

## 4. Serving from `docs/` on `main` — exact settings, `.nojekyll`, CDN caching

- Settings → Pages → Build and deployment → **"Deploy from a branch"** → branch `main` → folder **`/docs`** → Save. The only folder choices are `/ (root)` and `/docs`. Deleting `docs/` later breaks the build with a missing-folder error. Source: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
- **`.nojekyll`**: create an **empty `.nojekyll` file in the root of the publishing source** (i.e. `docs/.nojekyll`) to disable Jekyll processing and serve the built files as-is. Sources: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>, <https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll> (Jekyll docs family). The Angular build must land in `docs/` (set `outputPath` or copy `dist/<app>/browser/*` → `docs/`), and the build's `index.csr.html`/`index.html` plus `.nojekyll` and `404.html` (if used) all live there.
- **Pages CDN caching**: GitHub Pages serves with `Cache-Control: max-age=600` behind a Varnish/Fastly CDN — **verified empirically 2026-08-16** (`curl -I https://pages.github.com/` → `cache-control: max-age=600`; `via: 1.1 varnish` on github.io sites). So any asset URL can be up to ~10 minutes stale after a deploy, and Pages publish itself can add minutes (commonly stated as "up to 10 minutes" — *exact publish-latency figure not verified in current docs*).
- **Why this doesn't break ngsw updates**: the worker checks `ngsw.json?ngsw-cache-bust=<random>` "every time the user opens or refreshes the application"; the random query param defeats both browser cache and CDN edge cache, and all app files are content-addressed by hash in the manifest. Updated versions download in the background and activate on next reload (or via the `SwUpdate` service). Net effect: after a deploy finishes propagating, the next two loads bring the new version — no cache-header tuning needed on Pages. Sources: <https://angular.dev/ecosystem/service-workers/devops>, driver source above.

## 5. iOS Safari in 2026: add-to-home-screen and "never lose data"

- **The 7-day cap does not apply to installed web apps.** Safari deletes all script-writable storage (IndexedDB, localStorage, Cache API, SW registrations) after **7 days of Safari use without interacting with the site** — but: "Web applications added to the home screen are not part of Safari and thus have their own counter of days of use. Their days of use will match actual use of the web application which resets the timer. We do not expect the first-party in such a web application to have its website data deleted." Source: <https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/>
- WebKit's tracking-prevention doc confirms the first-party domain of home-screen web apps is **exempt from ITP's 7-day storage cap**, and their website data is **isolated from Safari**. Source: <https://webkit.org/tracking-prevention/>
- **Quota (Safari 17+ policy, current)**: origin quota "up to 60% of the total disk space" in browser contexts; **standalone home-screen web apps get the same browser-level quota**. Eviction is least-recently-used under storage pressure, and **origins in persistent mode are excluded from eviction**. Source: <https://webkit.org/blog/14403/updates-to-storage-policy/>
- **`navigator.storage.persist()`**: supported in Safari/iOS Safari since **15.2** (Chrome 55+, Firefox 57+; "Baseline widely available" since Dec 2021). Safari grants it heuristically — one listed heuristic is "whether the website is opened as a Home Screen Web App" — with no user prompt. Sources: <https://caniuse.com/mdn-api_storagemanager_persist>, <https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist>, <https://webkit.org/blog/14403/updates-to-storage-policy/>
- **Spec consequences**:
  - Instruct the user to **Add to Home Screen and always launch from the icon** — that alone defeats the 7-day cap and buys browser-level quota + isolated storage.
  - Call `navigator.storage.persist()` on startup (after install); check with `navigator.storage.persisted()` and surface the result in a settings/debug view. Community reports suggest re-requesting on every launch is prudent on iOS (*unverified against primary sources*).
  - **Residual risks that persist() does not cover** (so a manual export/backup feature remains mandatory for "never lose data"): the user deleting the home-screen icon (removes that app's isolated data — *widely reported, not verified against a primary Apple source*), "Clear History and Website Data", device loss, and iOS bugs. Storage exemptions protect against *automatic* eviction only.
- Home-screen install on iOS is still manual: Safari → Share → Add to Home Screen; there is no install prompt API in Safari (*long-standing, not re-verified for 2026*). `display: "standalone"` in `manifest.webmanifest` is what makes the icon launch chromeless.

## 6. Airplane-mode verification checklist

Local, before deploy (SW requires a production build + real server — `ng serve` won't run it; source: <https://angular.dev/ecosystem/service-workers/getting-started>):

1. `ng build` (production) and serve the output: `npx http-server -p 8080 -c-1 dist/<app>/browser`.
2. Load `http://localhost:8080/`, then open DevTools → Application → Service Workers: confirm `ngsw-worker.js` is **activated and is running**, and "controls this page".
3. Visit `http://localhost:8080/ngsw/state` — Angular's built-in debug endpoint. Expect `Driver state: NORMAL`, the latest manifest hash, and your version listed with clients attached. Source: <https://angular.dev/ecosystem/service-workers/devops>
4. DevTools → Network → set **Offline** (or check "Offline" in Application → Service Workers), hard-reload: the app must fully load and navigate; every request in the Network panel should show "(ServiceWorker)" as its source.
5. Write a workout entry while offline, reload, confirm it's still there (IndexedDB survives reload; check Application → IndexedDB).

On the deployed site / iPhone:

6. Open `https://USER.github.io/REPO_NAME/` in Safari, use it once (lets the SW install and precache), then Share → **Add to Home Screen**.
7. Force-quit Safari, enable **Airplane Mode**, launch from the home-screen icon: app must open, show existing data, and accept new entries.
8. Disable Airplane Mode, relaunch: the SW checks `ngsw.json` on open; a freshly deployed version is fetched in the background and appears on the next launch (source: <https://angular.dev/ecosystem/service-workers/devops>).
9. Periodic paranoia check: `https://USER.github.io/REPO_NAME/ngsw/state` in the installed app's origin shows driver state and last update check.

Per-request escape hatch while debugging: add `ngsw-bypass` as a header or query param to skip the SW for that request. Kill switch: delete `ngsw.json` from the deployment (worker self-destructs on 404). Source: <https://angular.dev/ecosystem/service-workers/devops>

## Unverified / flagged

- Exact GitHub Pages **publish latency** ("up to 10 minutes") — commonly stated, not found in current docs pages checked; the `max-age=600` CDN header is verified empirically instead.
- Whether GitHub Pages serves `404.html` with HTTP status 404 — the docs page describes creation but not the status code (the spa-github-pages technique depends on it and works, so it evidently does, but the docs don't say it).
- iOS behavior of **deleting a home-screen icon deleting that app's isolated data** — widely reported, no primary Apple/WebKit citation found.
- Need to **re-call `persist()` on every launch** on iOS — community experience, not documented by WebKit.
