# parcel-tracker-master

Coordination repo for the Parcel Tracker platform.

This repository holds system-level documentation plus git submodule pointers for the deployable child repositories.

## Start here

- [EXPLAINER.md](EXPLAINER.md)
  - full system architecture, dataflows, runtime boundaries, storage model, and release order
- [AGENTS.md](AGENTS.md)
  - repo workflow rules for automation and contributors

## Runtime chain

1. [`repos/parcel-tracker-beacon`](repos/parcel-tracker-beacon/README.md) broadcasts BLE manufacturer packets.
2. [`repos/parcel-tracker-pi`](repos/parcel-tracker-pi/README.md) collects GNSS, BLE, and RFID signals and emits normalized raw events.
3. Pi services post those events to Convex `POST /ingest`.
4. [`repos/parcel-tracker-convex`](repos/parcel-tracker-convex/README.md) validates, deduplicates, stores, and derives tracker/beacon/parcel state.
5. [`repos/tracker-dashboard`](repos/tracker-dashboard/README.md) reads Convex public queries and renders tracker, beacon, and parcel operator workflows.
6. [`repos/parcel-tracker-contract`](repos/parcel-tracker-contract/README.md) defines the shared event envelope and version policy used by Pi and Convex.

Important:
- the beacon repo defines the over-the-air BLE byte payload
- the contract repo defines the Pi-to-Convex JSON event envelope
- the Pi runtime is the translation boundary between those two contracts

## Repo responsibilities

- Contract and schema authority:
  - `repos/parcel-tracker-contract`
- Pi device runtime, modem setup, retry behavior, local durability:
  - `repos/parcel-tracker-pi`
- Backend ingest, storage, ownership engine, and parcel state:
  - `repos/parcel-tracker-convex`
- Operator UI and browser-side Convex integration:
  - `repos/tracker-dashboard`
- Beacon firmware and BLE payload layout:
  - `repos/parcel-tracker-beacon`

## Release flow

This repo tracks submodule pointers only. The correct release flow is:

1. Commit and push inside each changed child repo.
2. Deploy runtime components where required, especially Convex.
3. Run `git submodule update --init --recursive --remote`.
4. Commit and push the updated submodule pointers here.

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

## System documentation

- `EXPLAINER.md` - full architecture and end-to-end dataflow reference.
- `AGENTS.md` - instructions for working in the coordination repo.
- `repos/parcel-tracker-pi/README.md` - Pi runtime, services, env vars, and operations.
- `repos/parcel-tracker-convex/README.md` - ingest/storage/backend API and derived state.
- `repos/tracker-dashboard/README.md` - tracker, beacon, and parcel UI architecture.
- `repos/parcel-tracker-contract/README.md` - shared event envelope and versioning rules.
- `repos/parcel-tracker-beacon/README.md` - beacon firmware payload and flashing workflow.

## Important note

This repository stores pointers to child repositories, not their full source history. Each child repository keeps its own code history and deployment workflow.
