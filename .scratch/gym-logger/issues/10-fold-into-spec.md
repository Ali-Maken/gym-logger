# Fold decisions into SPEC.md

Type: task
Status: resolved
Blocked by: 01, 02, 03, 04, 05, 06, 07, 08, 09

## Question

The destination itself: revise SPEC.md so every resolved decision lives in it — corrected data model, duration/cardio handling, pinned exercise ids and full seed tables, rotation rule, restore scope, real repo name in `base-href`, research-verified deploy steps, the prototype's UI conclusions, and the architecture blueprint. When this closes, the spec is build-ready and the map is done.

## Answer

Resolved 2026-08-16. `SPEC.md` rewritten as **v2, build-ready**: corrected data model (`measure`, `TemplateEntry` doses, `choiceIds`, `SetEntry.value`, `setup`, versioned export), full seed tables for all 16 exercises and 3 templates, count-based rotation, import/replace-all, the SessionView four-layout + theme-token architecture, verified deploy facts (Ali-Maken/gym-logger, base-href fixed, ngsw/hash-routing/persist() mandates), and an updated 8-step build order. The map's destination is reached — building follows the spec, outside this map.
