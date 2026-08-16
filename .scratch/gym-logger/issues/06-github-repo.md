# GitHub repo + Pages setup

Type: task
Status: resolved

## Question

The repo has no commits and no remote, and the deploy story hangs on the repo name: `ng build --base-href /REPO_NAME/`. Work to do (HITL where the user's account is involved, agent-driven via `gh` where possible):

1. User picks the repo name (this fixes `base-href` in the spec — record it).
2. Initial commit on `main` (SPEC.md, reference HTML files, this `.scratch/` map).
3. Create the GitHub repo, push, enable Pages → `main` → `/docs` (needs a `docs/` placeholder until the shell exists — or record that Pages gets enabled at build-order step 1 instead).

Resolution records: final repo name, remote URL, Pages URL, and any account facts later tickets depend on.

## Answer

Resolved 2026-08-16. Facts for the spec and future sessions:

- **Repo**: `gym-logger`, public, at `git@github.com:Ali-Maken/gym-logger.git` — note the GitHub account is **Ali-Maken** (the machine's SSH key `~/.ssh/id_rsa` authenticates as Ali-Maken; the earlier assumption of a `malimaken772` account was wrong).
- **Pages URL**: https://ali-maken.github.io/gym-logger/ — enabled (Deploy from a branch → `main` → `/docs`), verified serving HTTP 200 with the placeholder `docs/index.html`. `docs/.nojekyll` is in place.
- **Base href is now fixed forever**: `ng build --base-href /gym-logger/`. Per research, the repo must never be renamed.
- **Git identity** set globally on this machine: `malimaken772 <malimaken772@gmail.com>`. Branch is `main`; initial commit holds SPEC.md, both reference pages, and this map.
- **`gh` CLI is NOT installed** (classifier blocks the agent installing it; `sudo` needs the user). Pages was enabled by hand in the browser. If future automation needs the GitHub API, the user runs `sudo pacman -S github-cli` + `gh auth login` themselves.
