# GitHub repo + Pages setup

Type: task
Status: claimed

## Question

The repo has no commits and no remote, and the deploy story hangs on the repo name: `ng build --base-href /REPO_NAME/`. Work to do (HITL where the user's account is involved, agent-driven via `gh` where possible):

1. User picks the repo name (this fixes `base-href` in the spec — record it).
2. Initial commit on `main` (SPEC.md, reference HTML files, this `.scratch/` map).
3. Create the GitHub repo, push, enable Pages → `main` → `/docs` (needs a `docs/` placeholder until the shell exists — or record that Pages gets enabled at build-order step 1 instead).

Resolution records: final repo name, remote URL, Pages URL, and any account facts later tickets depend on.
