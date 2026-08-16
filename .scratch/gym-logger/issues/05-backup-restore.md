# Backup restore: import in scope?

Type: grilling
Status: resolved

## Question

SPEC.md makes JSON export "the only backup that exists" — but defines no import. A backup that cannot be restored (phone lost, IndexedDB evicted by the browser) isn't a backup. Decide: is a JSON import/restore flow in scope for v1, or explicitly ruled out (and the export honestly relabeled)? If in: replace-all vs merge semantics, and how it guards against pasting garbage. Note browsers CAN evict IndexedDB under storage pressure unless persistent storage is requested — the research ticket ([PWA on GitHub Pages research](07-research-pwa-pages.md)) should confirm `navigator.storage.persist()` guidance.

## Answer

Resolved 2026-08-16 with the user — **import is in scope, replace-all semantics**:

- Restore lives next to export on the History screen: paste JSON or pick the exported file.
- Flow: validate the payload's shape first → show a human summary ("14 sessions, Aug 1–16 — replace current data?") → explicit confirm → wipe-and-load atomically (one Dexie transaction). Invalid input is rejected before anything is touched.
- No merge semantics — single user, single device; replace-all is the honest model.
- Export payload gains a `version` field (and exports everything: sessions + any user-modified state) so future schema changes can migrate old backups.
- Context from [research](07-research-pwa-pages.md): `persist()` on startup reduces eviction risk but icon deletion / "Clear History and Website Data" on iOS still wipes IndexedDB — restore is what makes the export an actual backup.
