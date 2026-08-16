# 001 · Scroll lists missing `min-height: 0` — bottom bars fall below the fold

**Severity:** High — breaks the primary controls in three of four layouts.
**Layouts:** Sheet, Ledger, Material (Focus unaffected in testing, but `.fv-stage` has the same pattern).

## What happens

`.phone` is `min-height: 100dvh; display: flex; flex-direction: column`. The scrollable lists (`.sv-list`, `.lv-list`, `.mv-list`) are `flex: 1; overflow-y: auto` — but a flex child's default `min-height` is `auto`, so the list refuses to shrink below its content height. With enough rows (Workout B = 9) the whole `.phone` grows past the viewport and the *page* scrolls.

The footers/sheets are `position: absolute; bottom: 0` **relative to `.phone`**, so they sit at the bottom of the overgrown page, not the visible screen.

## Measured (928 px viewport, Workout B)

- Sheet: page 985 px (+57) — third set row's ✓ and "+ note" cut off.
- Ledger, accordion open: page 1138 px (+210) — footer with elapsed clock, progress, **running rest timer**, and Finish entirely invisible. Logged a set and the countdown was off-screen.
- Material, card expanded: page 1175 px (+247) — same: Finish/timer footer invisible until the user scrolls the page.

Also causes nested-scroll jank (page scroll + inner list scroll compete).

## Fix

Add `min-height: 0` to `.sv-list`, `.lv-list`, `.mv-list`, `.fv-stage`. One line per layout CSS file.
