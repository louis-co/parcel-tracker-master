# Full-System Audit Report (audit-20260303-171240)

## Scope Executed
- Production-focused end-to-end audit (`/ingest` -> Convex tables/queries -> live dashboard UI).
- Synthetic test namespace: `audit-20260303-171240`.
- Beacon engine lifecycle/conflict checks included.

## Findings

### [P0] Ingest accepted invalid coordinates (`lat=190`) before fix
- Root cause: `convex/ingest.ts` semantic checks lacked range enforcement for `location.lat`/`location.lon`.
- Evidence:
  - `phase2_ingest_matrix.ndjson` case `invalid_out_of_range_lat` returned `200` before fix.
  - Live dashboard rendered impossible coordinate (`190.00000`) in Beacon Explorer and previously crashed for tracker selection.
- Fix:
  - Added explicit finite/range checks in `repos/parcel-tracker-convex/convex/ingest.ts`.
- Verification:
  - `phase7_postdeploy_regression_subset.json` case `invalid_out_of_range_lat` now returns `400` in production.

### [P0] Ingest accepted non-object `sourcePayload` before fix
- Root cause: ingest validator accepted `sourcePayload` as `v.any()` without semantic object check.
- Evidence:
  - `phase2_ingest_matrix.ndjson` case `schema_probe_sourcePayload_scalar` returned `200` before fix.
- Fix:
  - Added semantic check requiring `sourcePayload` to be a non-null object (not array).
- Verification:
  - `phase7_postdeploy_regression_subset.json` case `invalid_sourcePayload_scalar` now returns `400`.

### [P1] Dashboard crash path on malformed coordinates
- Root cause: parser pipeline allowed invalid coordinate points through to map rendering.
- Evidence:
  - BrowserUse capture from live app: `dashboard_tracker_a.png` resulted in client-side exception before dashboard fix rollout.
- Fix:
  - Added coordinate validity guards in `repos/tracker-dashboard/src/lib/tracker.ts` for both raw and legacy paths.
- Verification:
  - Post-fix live capture `live_dashboard_tracker_a_postfix_check.png` loads correctly with no crash.

### [P2] Unrealistic derived speed spikes from tiny timestamp deltas
- Root cause: speed derivation computed distance/time for sub-second intervals, yielding extreme artifacts.
- Fix:
  - Added minimum derivation window (`>=5s`) and sanity cap (`<=300 km/h`) in `src/lib/tracker.ts`.
- Verification:
  - Local+live post-fix states show normalized speed values (`0.0 km/h` instead of multi-million km/h).

## End-to-End Validation Summary

### Ingest matrix (pre-fix baseline)
- Total cases: 76
- Success (2xx): 67
- Errors (4xx): 9
- Concurrency dedupe burst: `duplicate=false` 1 / `duplicate=true` 29

### Ingest matrix (post-fix full rerun)
- Total cases: 76
- Success (2xx): 65
- Errors (4xx): 11
- Expected additional rejects now enforced:
  - `invalid_out_of_range_lat`
  - `schema_probe_sourcePayload_scalar`
- Concurrency dedupe burst remains stable: `duplicate=false` 1 / `duplicate=true` 29

### Query integrity
- Event lookup checks passed for representative event IDs.
- Heartbeat policy behavior validated:
  - `all`: 8 heartbeat-like rows
  - `latest`: 1
  - `none`: 0
- Synthetic tracker liveness rows present for both audit trackers.

### Beacon engine deep checks
- Conflict activation validated (`conflict_list_contains_test_beacon=true`).
- Tracking assignment lifecycle operations succeeded (assign/reassign/clear).
- Route sessions closed on tracking change as expected.

### UI visual checks (BrowserUse)
- No tracker selected state captured.
- Stale tracker with route points captured.
- Heartbeat/no-GPS state captured.
- Beacon Explorer conflict + loaded beacon states captured.
- Post-fix crash regression checked on live dashboard.

## Production Deploy and Commits
- Convex repo commit: `a8fd1783ac990df523139e8ad2d438f2264b1fc5`
- Dashboard repo commit: `bb54ecd30fb2510f81526b12d5e7283df35266a9`
- Convex production deploy: executed `npx convex deploy --yes` successfully to `https://dutiful-bison-575.convex.cloud`.

## Artifact Index
- `responses/phase2_ingest_matrix.ndjson`
- `responses/phase2_ingest_matrix.summary.json`
- `responses/phase3_query_integrity.json`
- `responses/phase4_beacon_deep_audit.json`
- `responses/phase6_pi_logic_checks.json`
- `responses/phase7_postdeploy_regression_subset.json`
- `responses/phase7_full_matrix_after_fix.ndjson`
- `responses/phase7_full_matrix_after_fix.summary.json`
- `screenshots/dashboard_home_initial.png`
- `screenshots/dashboard_tracker_a.png` (pre-fix crash path)
- `screenshots/dashboard_pi1_last7d.png`
- `screenshots/dashboard_pi2.png`
- `screenshots/beacon_explorer_loaded_conflict.png`
- `screenshots/beacon_explorer_loaded_ble_with_path.png`
- `screenshots/live_dashboard_tracker_a_postfix_check.png`

## Residual Risks
- Existing historical bad rows already inserted before fix remain in data history.
- Convex repo local workspace still contains pre-existing unstaged deletions of `ce_*` files; these were not modified by this audit.
