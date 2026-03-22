# Unified System Walkthrough

This document is the single linear walkthrough of Parcel Tracker.

Use it when you want to explain the whole solution to someone from start to
finish, in execution order, without making them jump between repository docs.

## The whole system in one sentence

Parcel Tracker turns physical signals from beacons, GPS hardware, and RFID
readers into normalized events on Raspberry Pi trackers, sends those events to
Convex for validation and derived state, and then renders tracker, beacon, and
parcel workflows in the dashboard.

## The pieces before any data moves

Before runtime begins, the system is split into five codebases:

1. `repos/parcel-tracker-beacon`
   - firmware that emits BLE manufacturer bytes
2. `repos/parcel-tracker-pi`
   - Raspberry Pi services that read hardware and produce normalized events
3. `repos/parcel-tracker-contract`
   - JSON schema and version authority for normalized raw events
4. `repos/parcel-tracker-convex`
   - ingest, storage, derived state, ownership logic, and dashboard query API
5. `repos/tracker-dashboard`
   - browser UI for tracker, beacon, and parcel exploration

There are two contracts in the system:

1. Byte-level BLE contract
   - owned by `parcel-tracker-beacon`
   - consumed by `parcel-tracker-pi/runtime/ble_uplink.py`
2. Normalized JSON raw-event contract
   - owned by `parcel-tracker-contract`
   - produced by Pi
   - validated by Convex

The Pi is the translation boundary between those two contracts.

## Step-by-step execution order

### Step 1. A beacon advertises a fixed byte payload

`repos/parcel-tracker-beacon/firmware/xiao_ble_beacon/xiao_ble_beacon.ino`
builds and advertises an 8-byte manufacturer payload:

- bytes `0..1`: `BLE_COMPANY_ID` little-endian
- bytes `2..5`: `PARCEL_ID` little-endian
- byte `6`: `BEACON_INSTANCE_ID`
- byte `7`: payload format version, currently `1`

At this point nothing is JSON yet. This is just a BLE advertisement in the air.

### Step 2. The Pi boots its producer services

The Pi runtime starts separate producer services under `systemd`:

- `location_uplink.service`
  - GNSS polling and heartbeat emission
- `ble_receiver.service`
  - BLE scanning and normalized `ble_scan` production
- `rfid_uplink.service`
  - RFID scanning and normalized `rfid_scan` production
- supporting services:
  - `lte-init.service`
  - `lte_watchdog.service`
  - `resource_monitor.service`

Each producer is independent so one signal path can keep working even if another
is degraded.

### Step 3. The location service polls GNSS hardware

`repos/parcel-tracker-pi/runtime/location_uplink.py` talks to the SIM7670 modem
with AT commands.

The main order is:

1. ask for GNSS with `AT+CGPSINFO`
2. if needed, fall back to `AT+CGNSSINFO`
3. decide whether the result is a usable fix

One location cycle always emits exactly one location-state event:

- `gps_fix`
  - when a real coordinate is available
- `gps_no_fix`
  - when no usable coordinate is available

Separately, the service also emits periodic `heartbeat` events carrying
`status.locationMode`.

### Step 4. The BLE service turns radio bytes into a normalized event

`repos/parcel-tracker-pi/runtime/ble_uplink.py` listens for BLE advertisements
with `BleakScanner`.

When it sees manufacturer data for the configured company ID, it:

1. normalizes BLE-stack differences
   - some BLE stacks expose only payload bytes
   - some include the company-id prefix again
2. reads:
   - `parcelId`
   - optional `instanceId`
   - optional `payloadVersion`
3. derives `beaconId`
   - `ble:<parcelId>` for missing instance or instance `1`
   - `ble:<parcelId>:<instanceId>` for secondary instances
4. attaches optional RSSI
5. builds a normalized `ble_scan` event

This is the moment the byte-level firmware contract becomes a normalized JSON
event under the shared raw-event contract.

### Step 5. The RFID service turns reader frames into a normalized event

`repos/parcel-tracker-pi/runtime/rfid_uplink.py` reads frames from the RFID
device, finds the EPC marker, extracts the EPC, and builds:

- `eventType = "rfid_scan"`
- `beaconId = "rfid:<EPC>"`

This is a second scan path into the same backend ownership logic.

### Step 6. Every producer persists events locally before send

This is one of the most important design choices in the whole system.

The Pi does not depend on live network success before considering an event
captured.

Local durability works like this:

1. `location_uplink.py`
   - stores outbound rows in a SQLite outbox
   - retries transient failures with backoff
   - moves permanent 4xx failures to `dead_letter`
2. `ble_uplink.py` and `rfid_uplink.py`
   - use `scan_uplink_common.py`
   - store rows in dedicated SQLite outboxes
   - retry with backoff
   - keep scan intake off the HTTP hot path

This means:

- field capture can continue during LTE outages
- delayed backlog replay is expected
- `trackerTsMs` can be earlier than `ingestTsMs`

### Step 7. Pi posts normalized events to Convex `.site`

All producer services eventually send JSON to:

- `POST /ingest`

This happens on the Convex `.site` host, not the browser `.cloud` function API.

The event envelope is governed by:

- `repos/parcel-tracker-contract/CONTRACT_VERSION`
- `repos/parcel-tracker-contract/schemas/raw_event.schema.json`

Required top-level fields include:

- `eventId`
- `contractVersion`
- `trackerId`
- `eventType`
- `trackerTsMs`
- `seq`

### Step 8. Convex HTTP code parses the request

`repos/parcel-tracker-convex/convex/http.ts` is the thin HTTP boundary.

Its job is to:

1. accept `POST /ingest`
2. parse JSON
3. forward the payload into `ingest:ingestRawEvent`
4. expose `GET /contract/version`

It does not own the deeper validation rules. That happens in the ingest
mutation.

### Step 9. Convex validates the raw event

`repos/parcel-tracker-convex/convex/ingest.ts` is the write boundary for the
whole backend.

It performs, in order:

1. contract-version compatibility check
   - current rule is major-version compatibility (`1.x.x`)
2. event-type-specific semantic validation
3. field sanity checks
4. idempotency lookup by `eventId`

Examples:

- `gps_fix` must include `location.method = "gnss"`
- `ble_scan` and `rfid_scan` must include `beaconId`
- `trackerTsMs` and `seq` must be non-negative integers

### Step 10. Convex writes immutable history

Once accepted, the event is inserted into:

- `raw_events`

This table is the append-only source of truth for accepted ingest history.

Convex also records dedupe state in:

- `ingest_dedupe`

That is why retries are safe: the same `eventId` can be resent without creating
duplicate event history.

### Step 11. Convex updates tracker liveness

Convex then updates:

- `tracker_liveness`

This is not simply “the last event that arrived.” It is a monotonic latest
snapshot by tracker/device time, so late replayed backlog does not move a
tracker backward in the UI.

This table is what powers the tracker directory and last-seen status views.

### Step 12. Scan and heartbeat events trigger derived beacon logic

Accepted events can also cause side effects:

- `ble_scan` / `rfid_scan`
  - flow into `beaconOwnershipEngineV2.processIngestScan`
- `heartbeat`
  - flows into `beaconOwnershipEngineV2.processIngestHeartbeat`

This is where the backend goes beyond event storage and starts deriving meaning
about beacon ownership.

### Step 13. Convex derives beacon ownership state

The ownership system writes and maintains tables such as:

- `beacon_live_state`
- `beacon_scan_resolution`
- `beacon_assignment_segments`
- `beacon_conflict_state`
- `beacon_route_sessions`

The runtime currently supports three modes:

1. `legacy`
   - deterministic resolver is authoritative
2. `shadow`
   - legacy remains authoritative while HMM runs for comparison
3. `hmm`
   - HMM becomes authoritative

This matters because scan ingest is not just storage anymore. It is also the
entrypoint into ownership state derivation.

### Step 14. Convex maintains parcel state

Convex also owns parcel-facing tables:

- `parcels`
- `parcel_items`
- `parcel_beacon_assignments`

This allows the system to answer questions like:

- which beacon is assigned to this parcel?
- what items are inside this parcel?
- where is the parcel likely now?
- which tracker last carried it?

### Step 15. Convex exposes browser-callable read APIs on `.cloud`

The dashboard does not call `POST /ingest`.

Instead, it talks to Convex public functions over:

- `POST /api/query`
- `POST /api/mutation`

Important query groups:

- tracker explorer
  - `queries:getDashboardEvents`
  - `queries:listTrackerLiveness`
- beacon explorer
  - `beaconOwnership:getCurrentOwner`
  - `beaconOwnership:getResolvedPath`
  - `beaconOwnership:listActiveConflicts`
  - `beaconOwnership:getCurrentParcelLocation`
  - `beaconOwnership:getRouteSessions`
  - `beaconOwnership:getRoutePath`
  - `parcels:listActiveByBeacon`
- parcel explorer
  - `parcels:getExplorerData`
  - plus parcel mutations

### Step 16. The browser normalizes backend payloads

`repos/tracker-dashboard/src/lib/dashboard-convex.ts` owns browser-side Convex
transport.

It:

1. sends `/api/query` and `/api/mutation`
2. normalizes `.convex.site` input to `.convex.cloud` for browser function calls
3. builds support-friendly error details

Then `repos/tracker-dashboard/src/lib/tracker.ts` normalizes incoming payloads
into canonical UI models.

This layer:

- parses `raw_events`
- parses `tracker_liveness`
- still tolerates older legacy point arrays
- derives route points from location-bearing events
- derives stats and event insights
- normalizes beacon and parcel explorer payloads

### Step 17. The tracker explorer renders route and signal state

The `/` page mounts `TrackerDashboard` in tracker mode.

Its runtime flow is:

1. load tracker directory from `queries:listTrackerLiveness`
2. enrich with license-plate metadata
3. wait for a tracker selection
4. fetch route/event data from the configured public query
   - current default: `queries:getDashboardEvents`
5. normalize the response
6. derive:
   - map route
   - speed chart
   - KPI cards
   - liveness state
   - event intelligence

### Step 18. The beacon explorer renders ownership state

The `/beacons` page mounts `TrackerDashboard` in beacon mode.

Its runtime flow is:

1. search for a beacon
2. load owner, path, conflict, active-parcel, live-location, and route-session
   data in parallel
3. optionally fetch a route-session-specific path
4. normalize all of it for the UI
5. render:
   - current owner status
   - resolved path
   - conflicts
   - live parcel location

### Step 19. The parcel explorer renders parcel operations

The `/parcels` page mounts `ParcelDashboard`.

Its runtime flow is:

1. search for a parcel tracking ID
2. load `parcels:getExplorerData`
3. normalize parcel metadata, items, active assignment, route points, and live
   location
4. allow mutations:
   - assign beacon
   - clear beacon
   - add/edit/delete items

This is the part of the system that turns raw tracking signals into a parcel
workflow an operator can actually use.

### Step 20. Failures are isolated by layer

If something goes wrong, the architecture is designed so you can isolate it by
layer:

1. If the beacon is wrong
   - the Pi derives the wrong or missing BLE identity
2. If the Pi is down or offline
   - local queues grow, but capture can continue
3. If Convex rejects an event
   - malformed rows never enter the source-of-truth tables
4. If the dashboard is misconfigured
   - data can exist in Convex while the browser still fails to render it

That is why the repo split exists: each layer has a distinct responsibility and
failure mode.

## The shortest correct mental model

If you need to explain the whole solution quickly:

1. Beacons emit bytes.
2. Pi services turn bytes and hardware readings into normalized events.
3. Pi stores those events locally before sending them.
4. Convex validates and stores immutable event history.
5. Convex derives live tracker, beacon, route, and parcel state.
6. The dashboard reads that derived state and renders operator workflows.

## Where to go next

- `EXPLAINER.md`
  - cross-repo architecture reference
- `repos/parcel-tracker-pi/README.md`
  - Pi runtime and service detail
- `repos/parcel-tracker-convex/README.md`
  - backend storage, ownership, and public API detail
- `repos/tracker-dashboard/README.md`
  - browser query and explorer detail
- `repos/parcel-tracker-beacon/README.md`
  - BLE byte payload detail
- `repos/parcel-tracker-contract/README.md`
  - normalized raw-event contract detail
