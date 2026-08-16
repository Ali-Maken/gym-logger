# Research: Vite + React PWA on GitHub Pages, offline-first

Type: research
Status: resolved

## Question

The stack revision ([Stack revision: Angular → Vite + React](11-stack-revision-react.md)) superseded the ngsw-specific halves of the original deploy research. SPEC.md's Deploy section currently asserts vite-plugin-pwa behavior from general knowledge — verify or correct each claim against primary sources (vite-plugin-pwa docs, Workbox docs, MDN, Vite docs):

- **Subpath deploy**: does vite-plugin-pwa scope the service worker and resolve the Workbox precache manifest correctly under `base: '/gym-logger/'`? Any config needed beyond Vite's `base`? Manifest `scope`/`start_url` handling under a subpath.
- **`outDir: 'docs'` + `.nojekyll`**: does Vite copy dotfiles from `public/` into the build output (so `.nojekyll` survives `emptyOutDir`)? If not, the cleanest way to guarantee it every build.
- **Update flow vs the Pages CDN's 10-min cache**: how browsers check `sw.js` for updates (HTTP-cache bypass rules, `updateViaCache`), what `registerType: 'autoUpdate'` actually does, and worst-case propagation time for a new version.
- **Kill switch**: confirm `selfDestroying: true` semantics — what a broken-SW recovery deploy looks like.
- **iOS installability**: manifest/icon requirements in 2026 for add-to-home-screen via vite-plugin-pwa (`apple-touch-icon`, maskable icons, anything iOS still needs injected manually).
- **Local verification**: does the SW run under `vite preview`? Recommended offline-verification loop before each deploy.

The iOS storage-persistence findings from the [original research](07-research-pwa-pages.md) are framework-independent — do not redo them.

Findings go to `.scratch/gym-logger/assets/research-vite-pwa-gh-pages.md`. Resolution comment gists the answers that change SPEC.md's Deploy section.

## Answer

Full findings with citations: [assets/research-vite-pwa-gh-pages.md](../assets/research-vite-pwa-gh-pages.md). All six areas verified against primary sources (vite-pwa docs + plugin source, Vite docs + source, MDN, Workbox docs, W3C spec). Spec-changing facts (folded into SPEC.md's Deploy section 2026-08-17):

- **Subpath just works** (confirmed): nothing beyond Vite `base: '/gym-logger/'` — manifest `scope`/`start_url` default to base; the register script registers `${base}sw.js` with explicit scope; Workbox precache URLs resolve against the SW's location.
- **`.nojekyll` in `public/` survives every build** (confirmed in Vite source): `copyDir` copies dotfiles unfiltered; `copyPublicDir` defaults true.
- **`autoUpdate` needs the virtual-module import**: `registerType: 'autoUpdate'` forces `skipWaiting`+`clientsClaim`, but the automatic tab reload only happens if the app entry calls `registerSW({ immediate: true })` from `virtual:pwa-register`. Spec now mandates it (with the state-discard caveat).
- **Update propagation qualifier**: the browser's HTTP-cache bypass (`updateViaCache: 'imports'` default) doesn't reach the Pages CDN edge — worst case ≈ publish latency + ~10 min edge staleness + next app launch. The ~10 min budget stands.
- **Kill switch caveat**: a `selfDestroying: true` recovery deploy must keep the plugin config — especially the SW filename — unchanged, or it never lands at the broken worker's URL.
- **iOS extras are manual**: vite-plugin-pwa does not inject `apple-touch-icon` — hand-add the link tag + 180×180 PNG; manifest icons 192/512 incl. maskable, `display: 'standalone'`, matching `theme_color`.
- **Offline testing**: `vite preview` runs the production SW fully (localhost is a secure context); under `vite dev` the SW only runs with `devOptions.enabled` and precaches nothing useful — never test offline there.
- Flagged as unverified: whether the Pages CDN honors client `no-cache` revalidation (immaterial — the ~10 min budget covers it).
