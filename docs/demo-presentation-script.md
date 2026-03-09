# Parcel Tracker Demo Presentation

This document turns the codebase into a demo-friendly story.
It is written for presentation use, not engineering review.

## 1. One-line product pitch

Parcel Tracker is a full hardware-to-cloud tracking system that detects parcels in the field, records where each tracker is, resolves which parcel beacon belongs to which vehicle, and gives operators a live dashboard for trackers, beacons, and parcels.

## 2. What the product actually does

In plain English:

1. A small BLE beacon rides with a parcel.
2. A Raspberry Pi tracker in a vehicle listens for that beacon, reads GPS, and can also read RFID.
3. The Pi sends normalized events to the backend.
4. The backend validates the event format, rejects bad data, deduplicates retries, stores history, and maintains a latest-known tracker status table.
5. The backend also tries to answer a harder question: “Which tracker really owns this beacon right now?”
6. The dashboard lets an operator inspect three views:
   - tracker telemetry
   - beacon ownership and conflicts
   - parcel history and item manifest

## 3. Codebase map in presentation language

### `repos/parcel-tracker-beacon`

What it is:
BLE beacon firmware for a Seeed Studio XIAO ESP32-C3.

What it does:
- broadcasts a compact 8-byte manufacturer payload
- includes a company id, parcel id, beacon instance id, and payload version
- continuously advertises without pairing or connection overhead

Why it matters in the demo:
This is the physical parcel identity signal.

### `repos/parcel-tracker-pi`

What it is:
The on-vehicle runtime.

What it does:
- reads GNSS from the modem
- emits `gps_fix`, `gps_no_fix`, and `heartbeat`
- scans BLE beacons and emits `ble_scan`
- reads RFID and emits `rfid_scan`
- queues unsent events in local SQLite so outages do not lose data
- retries uploads with backoff
- manages LTE bootstrap and watchdog recovery

Why it matters in the demo:
This is the real bridge from hardware signals to cloud data.

### `repos/parcel-tracker-contract`

What it is:
The shared event contract between device and backend.

What it does:
- defines the event schema
- version-controls payload compatibility
- keeps Pi and backend in sync

Why it matters in the demo:
This is how the system avoids “device sent something the backend no longer understands.”

### `repos/parcel-tracker-convex`

What it is:
The backend and system brain.

What it does:
- accepts `POST /ingest`
- validates contract version and event semantics
- deduplicates by `eventId`
- stores immutable history in `raw_events`
- keeps fast latest state in `tracker_liveness`
- resolves beacon ownership
- tracks conflicts, route sessions, parcel assignments, and item manifests

Why it matters in the demo:
This is where raw telemetry becomes usable operational intelligence.

### `repos/tracker-dashboard`

What it is:
The operator UI.

What it does:
- shows tracker routes, telemetry points, speed chart, and signal health
- shows beacon ownership, live parcel state, route sessions, and conflicts
- shows parcel lookup, beacon assignment, item manifest, and route history
- includes a built-in demo dataset for UI walkthroughs

Why it matters in the demo:
This is the product surface your audience will remember.

## 4. Strongest product story

If you only say one thing, say this:

Parcel Tracker is not just a map. It is an end-to-end chain that starts with a beacon on a parcel, survives network drops on a moving vehicle, validates every event at the backend boundary, and then gives operators enough context to understand tracker status, parcel status, and beacon ownership in one system.

## 5. Best demo structure

Recommended total length:
- 6 to 8 minutes for a solid live or recorded demo
- 3 to 4 minutes if you need a compressed version

Recommended order:
1. problem and promise
2. system architecture
3. hardware layer
4. backend reliability
5. tracker dashboard
6. beacon explorer
7. parcel explorer
8. close with why this is production-shaped

## 6. Slide-by-slide presentation script

### Slide 1: Title

Show:
- product name
- short subtitle: “Hardware to cloud parcel visibility”
- one hero screenshot of the tracker dashboard

Animation:
- slow fade in
- slight scale-in on the dashboard screenshot

Voiceover:
"This is Parcel Tracker, an end-to-end parcel visibility system we built across embedded firmware, Raspberry Pi edge software, a cloud backend, and an operator dashboard. The goal is simple: know where the tracker is, know which parcel beacon it is seeing, and make that operationally usable."

### Slide 2: The problem

Show:
- 3 simple blocks: parcel, vehicle, operator
- arrows with labels: “identity”, “location”, “decision”

Animation:
- animate arrows one at a time from left to right

Voiceover:
"The problem is that parcel location is not one signal. GPS tells us where the vehicle is. BLE or RFID tells us that a parcel-related beacon was seen. Operators then still need one joined answer: which parcel is where, and how confident are we?"

### Slide 3: System architecture

Show:
- a horizontal pipeline:
  - beacon firmware
  - Raspberry Pi tracker
  - Convex backend
  - dashboard
- small labels under each stage

Animation:
- build the pipeline one stage at a time
- add a final glow pass across the full chain

Voiceover:
"The system is deliberately split into four layers. The beacon advertises identity. The Pi collects GPS, BLE, and RFID signals. The backend validates and stores the events, then resolves ownership state. The dashboard turns all of that into something an operator can actually use."

### Slide 4: Hardware layer

Show:
- product photo or icon of the XIAO ESP32-C3 beacon
- product photo or icon of the Raspberry Pi tracker
- callouts: BLE beacon, GNSS, LTE, RFID

Animation:
- pulse animation on the beacon
- dotted motion path from beacon to Pi

Voiceover:
"At the edge, a XIAO ESP32-C3 beacon continuously advertises a small manufacturer payload. The Raspberry Pi tracker listens for those packets while also reading GNSS from the modem and RFID when available. This is the physical sensing layer of the product."

### Slide 5: Why the Pi runtime is important

Show:
- a simple 4-step flow:
  - collect signal
  - normalize event
  - queue locally
  - retry to cloud
- highlight the SQLite queue and LTE watchdog

Animation:
- event cards sliding into a queue
- a retry arrow looping once before succeeding

Voiceover:
"The Pi runtime is built for real-world unreliability. It does not just send live data and hope for the best. It normalizes events, stores them in a local SQLite outbox, retries with backoff, and keeps LTE health under watchdog control. That means brief network failures do not become silent data loss."

### Slide 6: Backend reliability and intelligence

Show:
- two columns:
  - reliability: contract validation, dedupe, append-only raw history, liveness table
  - intelligence: beacon ownership, conflict detection, route sessions, parcel model

Animation:
- left column appears first
- right column appears second

Voiceover:
"The backend does two jobs. First, reliability: it validates every event against a shared contract, deduplicates retries, stores raw history, and maintains a fast latest-state table. Second, intelligence: it resolves beacon ownership, tracks conflicts, builds route sessions, and powers the parcel model."

### Slide 7: Tracker dashboard

Show:
- the tracker overview screen
- call out:
  - tracker selector
  - time window controls
  - route map
  - speed chart
  - point inspector
  - KPI cards
  - event intelligence

Animation:
- slow zoom into the map
- draw-on animation over the route line
- count-up animation on KPI numbers

Voiceover:
"This is the tracker dashboard. It is the operational overview screen. An operator can pick a tracker, change the time window, inspect the route on the map, scrub the timeline, read the raw point details, and see event intelligence like GPS fixes, BLE scans, and ingest lag."

### Slide 8: Beacon explorer

Show:
- a mockup or screenshot crop of the beacon explorer section
- call out:
  - beacon id lookup
  - soft manual prior
  - current owner
  - conflict status
  - resolved path map
  - route sessions
  - assignment timeline

Animation:
- reveal cards from top to bottom
- use a branch-split animation to show “stable” vs “conflict”

Voiceover:
"The beacon explorer answers a harder operational question: who owns this beacon right now? It shows the current owner tracker, live parcel state, missed heartbeats, conflicts, resolved path points, route sessions, and the assignment timeline. Operators can also apply a soft manual prior when field reality needs to guide the model."

### Slide 9: Parcel explorer

Show:
- parcel page structure:
  - tracking id lookup
  - active beacon
  - live state
  - route summary
  - manifest editor
  - assignment history

Animation:
- open-from-center animation on the parcel card
- tab switch animation from overview to route to items

Voiceover:
"The parcel explorer makes the system useful at the parcel level, not just the tracker level. An operator can load a tracking ID, attach or clear a beacon, inspect live parcel location derived from beacon ownership, and maintain the parcel’s item manifest and assignment history."

### Slide 10: Why this is a complete product

Show:
- four badges or pillars:
  - embedded
  - edge
  - cloud
  - operator UX
- one closing sentence at center

Animation:
- each pillar fades in, then the center statement appears last

Voiceover:
"What makes this compelling is that it is not a single app pretending to be a product. It is a full stack system: embedded beacon firmware, edge collection on the Pi, backend validation and ownership logic, and a purpose-built operator interface."

## 7. Demo video script

Use this if you are recording a screen-and-voiceover demo rather than giving slides.

### Opening shot

Show:
- title card for 3 seconds
- then cut to the architecture slide

Voiceover:
"I’m going to show Parcel Tracker from the physical beacon all the way through to the operator dashboard."

### Segment 1: Architecture overview

Show:
- one clean architecture diagram

Voiceover:
"A beacon rides with the parcel. A Raspberry Pi tracker in the vehicle reads GPS, BLE, and optionally RFID. It sends normalized events to the backend, where those events are validated, deduplicated, stored, and resolved into tracker, beacon, and parcel state. The dashboard sits on top of that pipeline."

### Segment 2: Hardware and edge runtime

Show:
- hardware photo or diagram
- then a slide explaining Pi responsibilities

Voiceover:
"At the hardware layer, the beacon continuously advertises parcel identity over BLE. The Pi runtime is responsible for reading those signals, reading GNSS, emitting heartbeats, and surviving connection problems. It uses a local queue and retry logic, so the system is resilient even when LTE is unstable."

### Segment 3: Backend

Show:
- backend flow diagram
- optional callouts: `/ingest`, `raw_events`, `tracker_liveness`

Voiceover:
"Once events reach the backend, the system checks contract compatibility, validates event semantics, deduplicates retries, and stores everything in append-only raw history. It also updates a liveness table for fast status checks and runs beacon ownership logic so the UI can answer higher-level operational questions."

### Segment 4: Tracker dashboard live walkthrough

Show:
- tracker dashboard

Suggested moves:
1. start on the empty state
2. open tracker selector
3. show tracker list and status chips
4. show a populated route view
5. pan slightly across the map
6. move the timeline slider
7. pause on the point inspector
8. scroll to the KPI cards and event intelligence

Voiceover:
"This is the main tracker dashboard. The operator starts by choosing a tracker. The map shows route points, the chart shows speed over time, the point inspector gives exact telemetry details, and the lower section summarizes distance, speed, duration, signal state, and event mix. This makes it clear whether the tracker is healthy, stale, or only sending partial data."

### Segment 5: Beacon explorer

Show:
- beacon explorer screen or slide mockup

Suggested moves:
1. highlight beacon id input
2. highlight conflict and owner cards
3. highlight resolved path map
4. highlight route sessions and assignment timeline
5. highlight soft-prior controls

Voiceover:
"The beacon explorer focuses on ownership resolution. Instead of only asking where a vehicle is, we ask which tracker actually owns a beacon right now, whether that state is stable or ambiguous, whether heartbeats have gone missing, and how the route evolved over time."

### Segment 6: Parcel explorer

Show:
- parcel explorer screen or slide mockup

Suggested moves:
1. tracking ID lookup
2. active beacon and live state cards
3. route tab
4. items tab
5. history tab

Voiceover:
"The parcel explorer brings everything together at the parcel level. An operator can load a parcel by tracking ID, see which beacon is attached, inspect its live derived location, review historical route points, and edit the manifest of items assigned to that parcel."

### Closing shot

Show:
- return to the architecture slide
- finish on a simple summary line

Voiceover:
"Parcel Tracker is a complete chain from physical signal to operational decision. That is the core achievement of the product."

## 8. Best visuals to capture before presenting

Capture these in advance:

1. Tracker dashboard empty state
   - useful as the “start here” shot

2. Tracker selector open with status chips
   - useful for showing multi-tracker fleet support

3. Tracker dashboard populated route state
   - main hero product screenshot

4. One close crop of the point inspector
   - useful for explaining telemetry detail

5. One close crop of event intelligence cards
   - useful for talking about ingest lag, GPS, and beacon scans

6. One architecture diagram
   - use this as the backbone of the story

7. Optional hardware photo
   - beacon + Pi + modem stack

## 9. Recommended motion style

Keep animations simple and deliberate:

1. Use fades and slow zooms, not flashy transitions.
2. Use line-draw animations for data flow and route visuals.
3. Use number count-ups for KPI cards.
4. Use slide-in panels for “backend intelligence” and “parcel manifest” moments.
5. Keep each motion under about 0.8 seconds so the demo feels confident, not slow.

## 10. Best narration tone

Aim for this tone:
- calm
- confident
- plain English
- “this is what the operator can do” more than “this is a cool framework”

Avoid:
- too much implementation detail too early
- deep database talk before the audience understands the user problem
- jumping between tracker, beacon, and parcel views without explaining why

## 11. Fallback plan if live telemetry is empty

This matters because on March 9, 2026, the live dashboard showed trackers in an offline or empty-data state during review.

Use this fallback:

1. Start from the real dashboard anyway.
2. Show the empty or stale state for a few seconds and say that the UI explicitly surfaces no-data conditions instead of hiding them.
3. Open Settings.
4. Click `Load demo route`.
5. Switch the tracker selector from the live tracker to the demo tracker if needed.
6. Continue the walkthrough with the populated route, chart, and event intelligence.

Suggested line:
"The live fleet is quiet right now, which is actually a useful thing to show because the UI handles stale and empty states explicitly. For the rest of the walkthrough I’m switching to the built-in demo dataset so you can see the full interaction model."

## 12. Likely questions and short answers

### “What happens if the Pi loses connectivity?”

Answer:
The Pi queues events locally in SQLite and retries later, so brief outages do not lose telemetry.

### “How do you prevent bad data from breaking the system?”

Answer:
The backend validates every event against a shared contract and event-specific rules before storing it.

### “How do you handle duplicate sends?”

Answer:
The backend deduplicates by `eventId`, so retries are safe.

### “Is this only a map dashboard?”

Answer:
No. The product has tracker monitoring, beacon ownership resolution, and parcel-level workflow with manifests and history.

### “Why split this into multiple repositories?”

Answer:
Because firmware, Pi runtime, backend, contract, and dashboard all have different release cycles and should be deployable independently.

## 13. Presenter cheat sheet

If you get nervous, remember this sequence:

1. parcel beacon
2. Pi collects signals
3. backend validates and stores
4. backend resolves ownership
5. dashboard makes it usable

That is the whole story.

## 14. Q&A file map

Use this only if someone asks where a feature lives in the code.

### Beacon firmware

- advertising payload and BLE behavior:
  `repos/parcel-tracker-beacon/firmware/xiao_ble_beacon/xiao_ble_beacon.ino`
- beacon identity and tuning values:
  `repos/parcel-tracker-beacon/firmware/xiao_ble_beacon/beacon_config.h`

### Pi runtime

- GPS, heartbeat, queueing, retry logic:
  `repos/parcel-tracker-pi/runtime/location_uplink.py`
- BLE scan ingest:
  `repos/parcel-tracker-pi/runtime/ble_uplink.py`
- RFID ingest:
  `repos/parcel-tracker-pi/runtime/rfid_uplink.py`
- LTE bootstrap:
  `repos/parcel-tracker-pi/runtime/lte-init.sh`
- LTE watchdog and failover:
  `repos/parcel-tracker-pi/runtime/lte_watchdog.sh`

### Shared contract

- contract version:
  `repos/parcel-tracker-contract/CONTRACT_VERSION`
- shared schema:
  `repos/parcel-tracker-contract/schemas/raw_event.schema.json`

### Backend

- HTTP ingest entrypoints:
  `repos/parcel-tracker-convex/convex/http.ts`
- event validation and dedupe:
  `repos/parcel-tracker-convex/convex/ingest.ts`
- database tables:
  `repos/parcel-tracker-convex/convex/schema.ts`
- tracker queries:
  `repos/parcel-tracker-convex/convex/queries.ts`
- beacon ownership APIs:
  `repos/parcel-tracker-convex/convex/beaconOwnership.ts`
- beacon ownership engine:
  `repos/parcel-tracker-convex/convex/beaconOwnershipEngineV2.ts`
- parcel model:
  `repos/parcel-tracker-convex/convex/parcels.ts`

### Dashboard

- main tracker and beacon UI:
  `repos/tracker-dashboard/src/components/tracker-dashboard.tsx`
- parcel explorer UI:
  `repos/tracker-dashboard/src/components/parcel-dashboard.tsx`
- map component:
  `repos/tracker-dashboard/src/components/route-map.tsx`
- payload normalization:
  `repos/tracker-dashboard/src/lib/tracker.ts`
