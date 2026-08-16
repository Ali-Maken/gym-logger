# 010 · `views/` is a flat file pile — give each layout its own folder

**Severity:** Medium (code structure, not user-facing).
**Area:** `src/features/session/views/`.

## What's wrong

The folder currently holds 13 files at one level: four layout adapters + four layout CSS files + shared pieces (`shared.tsx`, `shared.css`, `Stepper.tsx`, `stepper.css`) + `contract.ts` + `registry.ts`. Adapter and its stylesheet are siblings by naming convention only, and every new layout adds two more loose files — the folder grows unbounded and the seam's "one adapter = one unit" idea isn't visible in the tree.

## Wanted structure

One folder per layout, shared code in its own folder, seam files at the root:

```
views/
  contract.ts
  registry.ts
  shared/
    Stepper.tsx  stepper.css  shared.tsx  shared.css
  sheet/
    SheetView.tsx  sheet.css
  focus/
    FocusView.tsx  focus.css
  ledger/
    LedgerView.tsx  ledger.css
  material/
    MaterialView.tsx  material.css
```

"New layout = new adapter + registry entry" then reads as "new folder + registry entry".

## Notes

Pure file move + import-path updates; no behavior change. Do it before (or together with) the UX fixes so those diffs land in the final locations.
