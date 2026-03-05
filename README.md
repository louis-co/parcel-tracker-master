# parcel-tracker-master

Master repository for the Parcel Tracker platform.

This repo uses Git submodules so each deployable codebase keeps its own history and release cycle while still being managed from one parent project.

## System walkthrough (what runs where and why)

This section explains the real runtime chain in plain language:

1. `parcel-tracker-beacon` advertises BLE manufacturer packets.
2. `parcel-tracker-pi` collects GNSS/BLE/RFID signals and builds normalized raw events.
3. Pi posts those events to Convex HTTP action `POST /ingest` (`parcel-tracker-convex`).
4. Convex validates contract/version/semantics and deduplicates by `eventId`.
5. Convex stores accepted rows in `raw_events` and updates `tracker_liveness`.
6. Convex beacon engine updates ownership state and route/conflict tables.
7. `tracker-dashboard` calls Convex public queries and renders tracker/beacon UI.

Why this split is intentional:

- Device runtime, backend, firmware, and web UI have different release cadences.
- A fault in one layer does not require redeploying everything.
- Schema/version behavior is centralized in `parcel-tracker-contract` to prevent drift.

## Where to make changes (quick decision table)

Use this to decide which repo should be edited:

- Event shape, required fields, version policy:
  - `repos/parcel-tracker-contract`
- Device collection/retry/modem/GNSS behavior:
  - `repos/parcel-tracker-pi`
- Ingest validation, DB tables, query behavior, ownership engine:
  - `repos/parcel-tracker-convex`
- Operator UX, map, error messages, filters, loading states:
  - `repos/tracker-dashboard`
- BLE advertising packet bytes / beacon firmware behavior:
  - `repos/parcel-tracker-beacon`

## End-to-end failure ownership

When something breaks, this is usually the fastest fault-isolation order:

1. Check Pi service logs (`location_uplink`, `ble_receiver`, `rfid_uplink`).
2. Check Convex ingest acceptance (`/ingest` responses, `raw_events`, `tracker_liveness`).
3. Check dashboard query path/args and UI error panel diagnostics.
4. Check contract version mismatch between Pi and Convex.

## Release hygiene for this master repo

This repo tracks submodule pointers only. The correct release flow is:

1. Commit/push inside changed child repo(s).
2. Deploy runtime components where required (especially Convex).
3. Run `git submodule update --init --recursive --remote` at root.
4. Commit/push updated submodule pointers in this master repo.

## Why this structure

This is the recommended approach when:

1. Components are independently deployable (Pi runtime, backend, dashboard, schema contract).
2. Each component already has its own GitHub repo and CI/release workflow.
3. You still want one "system-level" place for architecture, runbooks, and synchronized updates.

## Submodules

All component repos are tracked under `repos/`:

- `repos/tracker-dashboard` -> `https://github.com/louis-co/tracker-dashboard.git`
- `repos/parcel-tracker-pi` -> `https://github.com/louis-co/parcel-tracker-pi.git`
- `repos/parcel-tracker-beacon` -> `https://github.com/louis-co/parcel-tracker-beacon.git`
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
- `repos/parcel-tracker-beacon/README.md` - XIAO ESP32-C3 BLE beacon firmware and flashing guidance.
- `repos/parcel-tracker-pi/docs/FLEET_BRINGUP_RUNBOOK.md` - consolidated tracker fleet bring-up, recovery, and handoff checklist.
- `repos/tracker-dashboard/docs/OPERATIONS_UI_BACKLOG.md` - prioritized operator-UX backlog from live screenshot reviews.
- `repos/parcel-tracker-pi/TODO.md` - latest Pi issue audit and post-fix status tracking.

## Important note

This repository stores pointers to child repositories, not their full source history.
The source code and release history remain in each child repo.
