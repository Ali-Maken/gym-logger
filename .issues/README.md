# UX issues — session layouts

From the 2026-08-17 hands-on browser audit of all four session layouts (phone-width viewport, dev server, real interaction — all issues reproduced, not speculated). Numbered roughly by priority.

| # | Issue | Severity | Layouts |
|---|-------|----------|---------|
| [001](001-list-overflow-hides-bottom-bars.md) | Scroll lists missing `min-height: 0` → footers/sheets below the fold | High | Sheet, Ledger, Material |
| [002](002-sheet-panel-covers-last-rows.md) | Sheet panel taller than list bottom padding → last row unreachable | High | Sheet |
| [003](003-same-slot-control-swap.md) | Rest timer swaps into the spot of Log set / Finish | High | Focus, Material |
| [004](004-zero-weight-first-time-exercises.md) | Weight starts at 0 kg on never-done exercises; 0 kg committable | High | All |
| [005](005-no-undo-for-committed-sets.md) | No undo for committed sets or ticks | Medium | All |
| [006](006-tick-rows-single-tap-hazard.md) | Tick rows fire on single row tap + collapse open accordion | Medium | Ledger, Material |
| [007](007-switcher-pill-overlaps-header.md) | Layout-switcher pill overlaps header title/clock | Medium | All |
| [008](008-focus-nav-touch-targets.md) | Focus prev/next/Finish targets are 34 px tall | Medium | Focus |
| [009](009-minor-inconsistencies.md) | Rest-state inconsistencies, guard bypass on all-done, device-check items | Low | Various |
| [010](010-views-folder-flat-structure.md) | `views/` is flat — one folder per layout instead (code structure) | Medium | — |
