# AGENTS.md

Guidance for agents operating in `parcel-tracker-master`.

## Purpose

This repository is a coordination layer for the Parcel Tracker system.
It tracks four child repositories as Git submodules and stores cross-repo documentation.

## Repository map

- `repos/tracker-dashboard`
- `repos/parcel-tracker-pi`
- `repos/parcel-tracker-contract`
- `repos/parcel-tracker-convex`

## Rules of engagement

1. Treat each submodule as an independent repository with its own release lifecycle.
2. Never rewrite or reset submodule history from the master repo.
3. Keep system-level docs (`EXPLAINER.md`, runbooks) updated when cross-repo behavior changes.
4. When syncing to latest, update submodule pointers intentionally and commit them in master.
5. Do not store secrets in this repository.

## Recommended update flow

1. Update and push changes in child repos first.
2. In master repo, refresh submodule pointers:
- `git submodule update --init --recursive --remote`
3. Validate each submodule points at expected commit.
4. Commit pointer updates with message: `chore(submodules): sync child repos`.

## Documentation requirement

Any change that alters data contract, API shape, or deployment order must be reflected in:

1. `EXPLAINER.md` (system view)
2. Child repo README/docs where behavior is implemented
