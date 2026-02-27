# Repo Map

This project coordinates these child repositories (git submodules):

- `repos/tracker-dashboard`
  - Auto deploys to Vercel: https://tracker-dashboard-nu.vercel.app
- `repos/parcel-tracker-pi`
  - Updated manually on Raspberry Pi (via SSH)
  - Operational docs live in:
    - `repos/parcel-tracker-pi/README.md`
    - `repos/parcel-tracker-pi/docs/CRITICAL_SERVICES.md`
    - `repos/parcel-tracker-pi/TODO.md`
- `repos/parcel-tracker-beacon`
  - BLE beacon firmware for Seeed Studio XIAO ESP32-C3.
  - Beacon flashing/config docs live in:
    - `repos/parcel-tracker-beacon/README.md`
- `repos/parcel-tracker-contract`
- `repos/parcel-tracker-convex`
  - Deploy after backend changes: https://dutiful-bison-575.convex.cloud

Each folder above is an independent repository with its own history.
