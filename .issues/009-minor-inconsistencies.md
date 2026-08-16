# 009 · Minor inconsistencies and device-check items

**Severity:** Low — none blocks a workout; bundled here so they aren't lost.
**Layouts:** Various.

## Rest-state behavior differs per layout

- Sheet: timer ring in the panel header; logging stays possible during rest. ✓ best pattern.
- Focus: logging is **impossible** during rest (the log button *is* the skip button) — skip first, then log.
- Ledger: timer replaces the elapsed clock + progress readout in the footer.
- Material: timer replaces Finish (see 003).

Layouts are allowed personality, but whether you *can log during rest* is behavior, not styling — it should be consistent (Sheet's answer is the right one).

## All-done Finish bypasses the two-tap guard

The "All exercises done → Finish session" buttons in Sheet and Focus call `onFinish` directly instead of using `FinishButton`. Harmless at that point, but inconsistent with the guard everywhere else.

## Needs an on-device check (not verifiable on desktop)

- Setup/note inputs live in bottom-anchored panels; verify the mobile keyboard doesn't cover them (and that `100dvh` + keyboard resize behaves on iOS Safari).
- Rest timer ring is 54 px — fine, but confirm it's comfortably tappable with sweaty thumbs.

## Cosmetic

- Elapsed clock never pauses: a resumed/abandoned session greets the user with "49:07"-style times.
- Ledger's left checkboxes on weight rows look tappable-as-checkboxes but expand the row instead (affordance mismatch; done-state fill is the only checkbox behavior).
- An open accordion (Ledger/Material) can't be collapsed by tapping its header again — only by selecting another row.
