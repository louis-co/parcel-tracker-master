# AGENTS.md

Simple guidance for working in `parcel-tracker-master`.

## Gist of this repo

This is the master coordination repo for the Parcel Tracker system.
It does two things:

1. Tracks the 4 real code repos as Git submodules.
2. Stores cross-repo documentation.
Commit and push this local change as part of the sync work.
## Structure

- `repos/tracker-dashboard` (this will automatically deploy to vercel https://tracker-dashboard-nu.vercel.app )
- `repos/parcel-tracker-pi` (this should be manually updated on the raspberry pi by sshing into it)
- `repos/parcel-tracker-contract`
- `repos/parcel-tracker-convex` (deploy after making changes; will run on https://dutiful-bison-575.convex.cloud /.site)

Each folder above is its own Git repository with its own history.

## Main branch rule

For this project, all repositories should be pushed to `main` when changes are completed.

When a change is made:

1. Commit and push the changed child repo to `origin/main`.
2. In this master repo, refresh submodule pointers:
- `git submodule update --init --recursive --remote`
3. Commit and push the updated pointers from this repo to `origin/main`.

## Where to get more info

Start here:

1. `EXPLAINER.md` in this repo for the full system map and codependencies.
2. `README.md` in this repo for submodule workflow.
3. Each child repo `README.md` for setup and runtime behavior.
4. Each child repo `docs/SYSTEM_DEPENDENCIES.md` for integration details.

## Documentation upkeep

If you do work that should be documented, or you discover a method that required significant troubleshooting and should have been documented, add that guidance to the relevant repository `README.md`.
