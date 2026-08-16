# Rotation: when does Week 1 end?

Type: grilling
Status: resolved

## Question

Home suggests the next of A/B once both have been done — but nothing says when the app stops suggesting Week 1. The guide's answer: Week 1 is one workout done three times (Mon/Wed/Fri), then Weeks 2–4 alternate A·B·A / B·A·B. Decide the suggestion rule: after 3 completed Week 1 sessions suggest Workout A? Purely manual? Does Week 1 ever get suggested again? Keep it dumb — a suggestion, never a lock; the user can always start any template.

## Answer

Resolved 2026-08-16 with the user — **count-based graduation**:

- Fewer than 3 finished Week 1 sessions → suggest Week 1.
- 3+ finished Week 1 sessions, no A/B yet → suggest Workout A.
- Otherwise → suggest the opposite of whichever of A/B was finished last.
- "Finished" means `finishedAt` is set — abandoned sessions never advance the rotation. Extra Week 1 sessions beyond 3 change nothing.
- Suggestion only: all three cards are always startable; Week 1 is never suggested again after graduation but remains available.
