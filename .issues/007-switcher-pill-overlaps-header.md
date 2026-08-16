# 007 · Layout-switcher pill overlaps the header in every layout

**Severity:** Medium (cosmetic but constant — it's on screen the whole session).
**Layouts:** All.

## What happens

`.lsw` is `position: fixed; top: 10px; left: 50%` (`switcher.css`). Reproduced overlaps:

- Sheet: sits on top of the template name ("WORKOUT B · PUL[Sheet ▾]…"), forcing the eye around it; header text wraps beneath it.
- Focus: covers the end of the title *and the elapsed clock*; dark pill on dark bar is also near-invisible.
- Material: covers part of the title ("pull & [Material ▾]").
- Ledger: floats over the dark header between label and title (mildest case).

The open menu additionally covers whatever is at top-center.

## Fix direction

Give the pill a home instead of an overlay: reserve space in each layout's header (the contract could expose a slot), dock it top-right/top-left where each header has slack, or move layout switching off-canvas (e.g. into the header on tap, or a settings row) since it's a rare action mid-session.

## Decision (2026-08-17)

**Home picker only.** The layout picker moves to the Home screen (a `LAYOUT` row with the four options writing the existing `sessionView` pref); the floating pill and `LayoutSwitcher` are removed from the session screen entirely. The session screen carries no non-logging chrome.
