# Parcel Tracker Explainer

This document explains what each repository does and how they depend on each other.

## The four repositories

1. `tracker-dashboard`
- Frontend UI (Next.js) used by operators.
- Reads tracker data from Convex public queries.
- Shows route, liveness, event breakdown, and scan activity.

2. `parcel-tracker-pi`
- Raspberry Pi runtime running on the device.
- Collects GNSS/BLE/RFID signals.
- Emits GNSS-only location events (`gps_fix` or `gps_no_fix`) with no cell-location fallback.
- Queues unsent events locally during outages and retries later while preserving tracker-capture timestamp (`trackerTsMs`).
- Sends normalized event envelopes to Convex ingest endpoint.

3. `parcel-tracker-contract`
- Shared event schema and contract version policy.
- Defines required fields and event-specific rules.
- Prevents drift between Pi producer and Convex backend.

4. `parcel-tracker-convex`
- Backend ingest + storage layer.
- Validates contract compatibility and event semantics.
- Deduplicates by `eventId`, stores in `raw_events`, updates `tracker_liveness`.
- Runs beacon ownership resolution with active-conflict-only hourly repair.
- Serves data to dashboard via Convex public queries.

## What the contract does (plain English)

The contract is the "shared language" between the Pi and backend.

Without it:
- Pi could send fields the backend does not understand.
- Backend could require fields Pi does not send.
- Dashboard could receive inconsistent data.

With it:
- Everyone agrees on event names, required fields, and version compatibility.
- Upgrades can be rolled out in a predictable order.
- Errors are easier to diagnose (for example contract major mismatch).

## Codependency map

1. Pi depends on Contract
- Pi emits payloads that must follow schema and version rules.

2. Convex depends on Contract
- Convex validates payloads using the same semantic expectations.

3. Dashboard depends on Convex
- Dashboard reads Convex query outputs and visualizes data.

4. Dashboard indirectly depends on Pi + Contract
- Data quality and event semantics originate upstream.

## End-to-end event flow

1. Pi creates raw event envelope (`eventId`, `eventType`, `trackerTsMs`, etc.) using tracker-side capture time.
2. Pi sends `POST /ingest` to Convex `.site` URL.
3. Convex validates contract version and event-specific rules.
4. Convex deduplicates retries by `eventId`.
5. Convex stores accepted event in `raw_events`.
6. Convex updates per-tracker snapshot in `tracker_liveness`.
7. Dashboard queries Convex `.cloud` APIs and renders operator UI.

## Beacon ownership flow (new)

1. Pi emits BLE/RFID scans (`beaconId`, `trackerId`) into ingest.
2. Convex ingest stores raw scan in `raw_events`.
3. Ingest marks conflict evidence in `beacon_conflict_state` (lightweight only).
4. Hourly internal repair processes only active-conflict beacons.
5. Resolver writes scan-level ownership to `beacon_scan_resolution`.
6. Resolver writes timeline segments to `beacon_assignment_segments`.
7. Dashboard Beacon Explorer reads:
- `beaconOwnership:getCurrentOwner`
- `beaconOwnership:getAssignmentTimeline`
- `beaconOwnership:getResolvedPath`
- `beaconOwnership:listActiveConflicts`

## Recommended release order for safe changes

When contract/data behavior changes:

1. Update `parcel-tracker-contract` (schema + version docs).
2. Update/deploy `parcel-tracker-convex` (accept new behavior).
3. Update `parcel-tracker-pi` (emit new behavior).
4. Validate in `tracker-dashboard`.
5. Update this master repo submodule pointers.

## Common mismatch symptoms

1. Pi gets 400 errors from ingest
- Usually contract mismatch or missing required field.

2. Dashboard shows stale/empty map
- Pi may be sending mostly non-location events, or ingest rejects payloads.

3. Duplicate sends do not create extra rows
- Expected: backend idempotency gate by `eventId`.

## Git best-practice summary for this setup

1. Keep each deployable component in its own repository.
2. Use this master repo with submodules for system-level orchestration.
3. Avoid copying source code between repos.
4. Commit submodule pointer updates whenever child repos change.
5. Keep cross-repo docs in sync with code changes.
