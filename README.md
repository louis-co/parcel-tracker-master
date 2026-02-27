# parcel-tracker-master

Master repository for the Parcel Tracker platform.

This repo uses Git submodules so each deployable codebase keeps its own history and release cycle while still being managed from one parent project.

## Why this structure

This is the recommended approach when:

1. Components are independently deployable (Pi runtime, backend, dashboard, schema contract).
2. Each component already has its own GitHub repo and CI/release workflow.
3. You still want one "system-level" place for architecture, runbooks, and synchronized updates.

## Submodules

All component repos are tracked under `repos/`:

- `repos/tracker-dashboard` -> `https://github.com/louis-co/tracker-dashboard.git`
- `repos/parcel-tracker-pi` -> `https://github.com/louis-co/parcel-tracker-pi.git`
- `repos/parcel-tracker-contract` -> `https://github.com/louis-co/parcel-tracker-contract.git`
- `repos/parcel-tracker-convex` -> `https://github.com/louis-co/parcel-tracker-convex.git`

## First-time clone

```bash
git clone --recurse-submodules <THIS_MASTER_REPO_URL>
```

If already cloned without submodules:

```bash
git submodule update --init --recursive
```

## Pull latest across all repos

```bash
git pull --ff-only
git submodule sync --recursive
git submodule update --init --recursive --remote
```

## Commit submodule pointer updates

When one child repo gets a new commit:

1. Update that child repo first (in its own repo and push).
2. In this master repo, run `git submodule update --remote`.
3. Commit the changed submodule pointer in this master repo.

## System documentation

- `EXPLAINER.md` - plain-English architecture and codependencies.
- `AGENTS.md` - instructions for agents/automation working in this master repo.
- `repos/parcel-tracker-pi/README.md` + `repos/parcel-tracker-pi/docs/CRITICAL_SERVICES.md` - Pi runtime behavior and deployment/runbook details.
- `repos/parcel-tracker-pi/docs/FLEET_BRINGUP_RUNBOOK.md` - consolidated tracker fleet bring-up, recovery, and handoff checklist.
- `repos/tracker-dashboard/docs/OPERATIONS_UI_BACKLOG.md` - prioritized operator-UX backlog from live screenshot reviews.
- `repos/parcel-tracker-pi/TODO.md` - latest Pi issue audit and post-fix status tracking.

## Important note

This repository stores pointers to child repositories, not their full source history.
The source code and release history remain in each child repo.
