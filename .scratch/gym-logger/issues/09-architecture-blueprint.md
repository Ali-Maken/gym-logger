# Architecture blueprint

Type: grilling
Status: open

## Question

The map's standing priority: cleanest code, clean architecture, principal-architect standard. Pin the blueprint before build (via /grilling + /codebase-design + /domain-modeling):

- Layering: where the Dexie boundary sits (repository/service seam so components never touch Dexie directly), what the domain layer owns vs the persistence shapes.
- Angular idiom: standalone components, signals vs RxJS for session state, route structure for the three screens, where the "what did I do last time" query lives.
- The write path for "never lose data": immediate commit per set — one service owning the active session, components dumb.
- Folder structure, naming conventions, strict-mode posture, and what gets unit-tested vs left alone in a single-user app.

Resolution is a short blueprint section for SPEC.md — deep modules, few seams, no ceremony a single-user offline app doesn't need.
