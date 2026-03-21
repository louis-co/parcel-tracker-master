# Repo Map

This project coordinates these child repositories (git submodules):

- `repos/tracker-dashboard`
  - Operator web UI for tracker, beacon, and parcel exploration.
  - Deployment target may vary by environment; do not assume Vercel.
- `repos/parcel-tracker-pi`
  - Raspberry Pi runtime and bootstrap scripts.
  - Updated on-device, typically via SSH plus `scripts/initial_launch.sh`.
  - Operational docs live in:
    - `repos/parcel-tracker-pi/README.md`
    - `repos/parcel-tracker-pi/docs/CRITICAL_SERVICES.md`
- `repos/parcel-tracker-beacon`
  - BLE beacon firmware for Seeed Studio XIAO ESP32-C3.
  - Beacon flashing/config docs live in:
    - `repos/parcel-tracker-beacon/README.md`
- `repos/parcel-tracker-contract`
  - Shared raw-event schema and version policy.
- `repos/parcel-tracker-convex`
  - Convex ingest, storage, beacon ownership, parcel state, and public query backend.
  - Deploy after backend changes: https://dutiful-bison-575.convex.cloud

Each folder above is an independent repository with its own history.
