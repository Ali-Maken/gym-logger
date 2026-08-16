# Research: Vite + React PWA on GitHub Pages, offline-first

Researched 2026-08-17 against primary sources (vite-pwa-org.netlify.app, vite-plugin-pwa source on GitHub, vite.dev, Vite source on GitHub, MDN, developer.chrome.com/docs/workbox, W3C service worker spec). Consumer: SPEC.md's Deploy section. Supersedes the ngsw-specific halves of `research-angular-pwa-gh-pages.md`; the GitHub Pages hosting facts and iOS storage findings there are framework-independent and still hold.

## Spec-changing facts (corrections/additions to SPEC.md Deploy)

1. **"the SW does not run under `vite dev`" is wrong as an absolute.** Since v0.11.13 the SW *can* run in dev via `devOptions: { enabled: true }` — but the dev SW's precache manifest contains only the `navigateFallback` entry, so it proves nothing about offline behavior. The practical recommendation (verify offline via `vite preview`) stands; the spec's wording should say "not by default / not meaningfully". Source: <https://vite-pwa-org.netlify.app/guide/development.html>
2. **"a new version activates on next reload" is incomplete.** `registerType: 'autoUpdate'` forces `workbox.skipWaiting` + `workbox.clientsClaim` to `true`, and the *automatic tab reload* on update only happens if the app imports a virtual module — `import { registerSW } from 'virtual:pwa-register'; registerSW({ immediate: true })`. Without that import you still get the new SW taking control, but the visible app updates only on the next manual reload/launch. The spec should mandate the virtual-module import in the app entry. Sources: <https://vite-pwa-org.netlify.app/guide/auto-update.html>, <https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/options.ts>
3. **Kill-switch caveat the spec omits:** a `selfDestroying: true` recovery deploy only works if **nothing else in the plugin config changes — especially the SW filename** — so the self-destroying worker lands at the exact URL of the broken one. Worth one sentence in the spec so a future panic-deploy doesn't rename anything. Source: <https://vite-pwa-org.netlify.app/guide/unregister-service-worker.html>
4. **"ignoring HTTP cache per spec" needs a scope qualifier:** the default `updateViaCache: 'imports'` bypasses only the *browser's* HTTP cache for `sw.js`. The Pages CDN is a shared cache the client cannot bypass, so the "~10 min budget" is doing real work and should stay. (Nuance, not contradiction — see §3.)
5. **iOS addition (belongs in build step 1, not currently claimed anywhere):** vite-plugin-pwa does **not** inject the `apple-touch-icon` link — it must be added to `index.html` manually, with a 180×180 icon in `public/`, alongside manifest icons of at least 192×192 and 512×512. Source: <https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html>

Everything else in the Deploy section verified as written — notably `.nojekyll` in `public/` **is** carried into `docs/` every build (confirmed at Vite-source level, §2), and subpath registration under `base: '/gym-logger/'` needs **no** extra config (§1).

## 1. Subpath deploy under `base: '/gym-logger/'`

- **No config beyond Vite's `base` is needed.** The plugin derives everything from it: the generated manifest defaults `start_url` and `scope` to the resolved base path (`start_url: basePath`, `scope: options.scope || basePath` in `resolveOptions`). Source: <https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/options.ts>
- The injected registration script builds the SW URL from the base and passes the scope explicitly: `navigator.serviceWorker.register('${buildBase}${filename}', { scope: '${options.scope}' })` (`generateSimpleSWRegister`). So with `base: '/gym-logger/'` the worker registers as `/gym-logger/sw.js` with scope `/gym-logger/`. Source: <https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/html.ts>
- Vite's own GitHub Pages guidance confirms the base rule: "If you are deploying to `https://<USERNAME>.github.io/<REPO>/` … then set `base` to `'/<REPO>/'`." Source: <https://vite.dev/guide/static-deploy.html>
- **Precache manifest resolves correctly under the subpath** because Workbox resolves relative URLs against the SW's own location: "If a relative URL is provided, the location of the service worker file will be used as the base." The plugin's default `navigateFallback` is the relative `'index.html'` for the same reason. Sources: <https://developer.chrome.com/docs/workbox/modules/workbox-precaching>, <https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/options.ts>
- Manifest minimums (any deploy): served as `application/manifest+json`, app over HTTPS. GitHub Pages does both. Source: <https://vite-pwa-org.netlify.app/deployment/>

## 2. `outDir: 'docs'` + `.nojekyll` in `public/`

- **Confirmed: dotfiles in `public/` are copied into the build output.** Vite's `copyDir` (used for the public-dir copy) iterates plain `fs.readdirSync(srcDir)` with **no filtering whatsoever** — every entry, dotfiles included, is copied via `fs.copyFileSync`/recursion. Verified in source:

  ```ts
  export function copyDir(srcDir: string, destDir: string): void {
    fs.mkdirSync(destDir, { recursive: true })
    for (const file of fs.readdirSync(srcDir)) { /* no filter */ ... }
  }
  ```

  Source: <https://github.com/vitejs/vite/blob/main/packages/vite/src/node/utils.ts>
- `build.copyPublicDir` defaults to `true` ("By default, Vite will copy files from the `publicDir` into the `outDir` on build"), and the docs describe public assets as "copied to the root of the dist directory as-is". Sources: <https://vite.dev/config/build-options.html>, <https://vite.dev/guide/assets.html>
- `build.emptyOutDir` defaults to `true` when `outDir` is inside project root — `docs/` is, so every build empties `docs/` and then the public-dir copy restores `.nojekyll`. **Net: `public/.nojekyll` survives every build with zero extra tooling.** Source: <https://vite.dev/config/build-options.html>
- (The docs pages never mention dotfiles either way — the guarantee rests on the source, which is unambiguous. If paranoid, a one-line `ls docs/.nojekyll` in the deploy script is the cheapest belt-and-braces.)

## 3. Update flow vs the Pages CDN's `max-age=600`

- **When browsers check for a new `sw.js`:** on navigation to an in-scope page, on `register()` with a different URL/scope, when functional events (push/sync) fire, and on manual `registration.update()`. A new version is detected by byte-level changes to the worker script (or its `importScripts`). Source: <https://developer.chrome.com/docs/workbox/service-worker-lifecycle>. For an installed PWA this means **every launch from the home-screen icon is a check**.
- **Browser HTTP cache:** the default `updateViaCache` is `'imports'` — "the HTTP cache is not consulted for updates to the service worker script" (only for `importScripts`, which the generated `sw.js` here doesn't use). vite-plugin-pwa's registration call passes no `updateViaCache`, so the default applies. The spec-level backstop — registrations stale after 86 400 s force a cache bypass — is therefore moot for the main script. Sources: <https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/updateViaCache>, <https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/html.ts>, <https://w3c.github.io/ServiceWorker/> ("the time difference … is greater than 86400")
- **The CDN is the remaining variable.** `updateViaCache` governs only the client's cache; GitHub Pages' Fastly/Varnish edge (verified `cache-control: max-age=600` in the prior research note) can hand back an up-to-10-minutes-stale `sw.js` regardless. **Worst case for an update to reach the device ≈ Pages publish latency + ~10 min edge staleness + the next launch/navigation after that.** In practice: deploy, wait ~10 min, next app launch pulls the new SW, and the *following* launch (or the auto-reload, next bullet) shows it. Whether the edge honors a client's `no-cache` revalidation request is not documented by GitHub — *unverified*, so budget the full 10 minutes.
- **What `registerType: 'autoUpdate'` actually does:** the plugin "will force `workbox.clientsClaim` and `workbox.skipWaiting` to `true`" (confirmed in `options.ts`: `workbox.skipWaiting = true; workbox.clientsClaim = true` when `registerType === 'autoUpdate'` with `injectRegister` auto), so a newly installed SW activates immediately and takes over open clients; with the virtual module imported, "it will update the caches and will reload any browser windows/tabs with the application opened automatically to take the control." **Required in app entry:** `import { registerSW } from 'virtual:pwa-register'; registerSW({ immediate: true })`. Documented risk: an auto-reload can discard in-progress form state — for this app, log writes are committed per-set to Dexie, so exposure is a set mid-entry, acceptable. Sources: <https://vite-pwa-org.netlify.app/guide/auto-update.html>, <https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/options.ts>
- Workbox precache is content-addressed: hashed asset URLs are cached as-is; unhashed URLs (`index.html`) get a build-time revision hash appended as a query param to the cache key, so a new deploy always produces new precache requests rather than reusing stale entries. Source: <https://developer.chrome.com/docs/workbox/modules/workbox-precaching>
- Optional hardening for long-lived installed sessions: the plugin documents an hourly in-page check — `onRegisteredSW` + `setInterval` fetching the SW URL with `cache: 'no-store'` then `registration.update()`. For a gym app opened in short sessions, launch-time checks suffice; noting it exists. Source: <https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html>

## 4. Kill switch: `selfDestroying: true`

- Confirmed: setting `selfDestroying: true` makes the plugin build a special SW that **unregisters itself and deletes all of its cache storage entries** while the rest of the build/PWA assets stay intact. Recovery deploy = flip the flag, build, push `docs/`. Source: <https://vite-pwa-org.netlify.app/guide/unregister-service-worker.html>
- **Hard requirement:** "It is IMPORTANT TO NOT CHANGE ANYTHING in the plugin configuration, especially DO NOT CHANGE THE SERVICE WORKER NAME" — the self-destroying worker must be served at the exact URL of the broken one (`/gym-logger/sw.js`) to replace it. Same source.
- Un-killing later is symmetric: remove the option (or `selfDestroying: false`) and redeploy; clients re-register a fresh SW. Same source.
- Same CDN caveat as §3: the kill switch also rides the ~10-minute edge window before every device sees it.

## 5. iOS installability in 2026

(Storage/persistence behavior — 7-day cap exemption, `persist()`, quota — already covered framework-independently in `research-angular-pwa-gh-pages.md` §5; not redone.)

- **What the plugin generates:** `manifest.webmanifest` (linked from `index.html`), the SW, and the registration script. Manifest minimums per the plugin's own requirements page: `name`, `short_name`, `description`, `theme_color` (matching the `theme-color` meta tag), and **icons at 192×192 and 512×512**; `purpose: 'any maskable'` is presented as optional ("icons can optionally include `purpose: 'any maskable'`"). `scope`/`start_url` come from base (§1); `display: 'standalone'` is what makes the home-screen launch chromeless (set it in the manifest config). Source: <https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html>
- **What iOS still needs manually:** the plugin does *not* inject Apple tags. Its requirements page instructs adding to `index.html` by hand: favicon link, `<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">` (180×180 icon in `public/` — under our base the href becomes `/gym-logger/apple-touch-icon.png`), mask-icon link, and the `theme-color` meta tag. Source: <https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html>
- Install remains manual on iOS (Share → Add to Home Screen, no prompt API) — unchanged from the prior research note; not re-verified beyond that.

## 6. Local verification: `vite preview` vs `vite dev`

- **`vite preview`: yes, the SW runs.** It "will boot up a local static web server that serves the files from `dist`" (here: `docs/`) on localhost — and localhost is a potentially trustworthy origin ("they can be considered to have been delivered securely because they are on the same device as the browser"), so the production SW registers, precaches, and serves offline exactly as deployed. Sources: <https://vite.dev/guide/static-deploy.html>, <https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts>
- **`vite dev`: only with `devOptions: { enabled: true }`** ("From version v0.11.13 you can use the service worker on development"), and then the precache manifest contains **only the `navigateFallback` entry** — fine for iterating on SW behavior, useless as an offline test. Also note dev registers with `type: 'module'` while "the `vite-plugin-pwa` plugin will always register your service worker with `type: 'classic'`" in builds. Source: <https://vite-pwa-org.netlify.app/guide/development.html>
- **Pre-deploy loop** (replaces the ngsw checklist; steps 6–9 of the old on-device checklist still apply as written):
  1. `vite build` (emits into `docs/`), spot-check `docs/.nojekyll`, `docs/sw.js`, `docs/manifest.webmanifest` exist.
  2. `vite preview` → open the printed localhost URL.
  3. DevTools → Application → Service Workers: SW activated and controlling the page; Application → Cache Storage: precache populated (`workbox-precache-…` entries).
  4. Network → Offline, hard reload: app loads fully and navigates; log a set; reload; entry persists (IndexedDB panel).
  5. Deploy, wait ~10 min (CDN, §3), then run the on-device airplane-mode checks from the prior note.

## Unverified / flagged

- Whether the GitHub Pages CDN honors client revalidation (`no-cache`) requests for `sw.js` or always serves within `max-age=600` — not documented by GitHub; budget the full 10 minutes.
- Exact Pages publish latency — unchanged from prior note (empirical `max-age=600` verified; publish latency figure not in current docs).
- The W3C spec's full soft-update trigger list was cited via Chrome's lifecycle doc (developer.chrome.com); the spec page itself truncated during fetch — the 86 400 s staleness clause was verified directly, the trigger list via Chrome's doc only.
- Dev-mode `type: 'module'` browser support constraints beyond the plugin doc's own note — not chased; irrelevant to production.
