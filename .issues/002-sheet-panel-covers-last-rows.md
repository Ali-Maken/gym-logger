# 002 · Sheet panel taller than the list's bottom padding — last row unreachable

**Severity:** High.
**Layouts:** Sheet.

## What happens

`.sv-list` reserves `padding-bottom: 320px` for the bottom panel, but the panel's height is content-driven: measured 354 px for a plain 3-set exercise and **382 px** with a choice row (Pec deck ↔ Incline chest press); a tip line or open note grows it further.

Whenever the panel is taller than 320 px, the bottom of the list can never scroll clear of it. Measured with the list scrolled fully down: the last row ("Incline walk") had 62 of its 65 px hidden behind the panel — effectively invisible and untappable.

## Fix direction

Don't hardcode the reserve. Either measure the panel (ResizeObserver / `env()`-style CSS var set from the panel's height) and pad the list to match, or give the panel a `max-height` with internal scroll and pad to that max. Also consider scrolling the selected row into view on auto-advance.
