# Second-Pass Audit Report (User-Focused Edge Cases)

Audit run: `audit-20260303-2ndpass-173416`
Date: 2026-03-03

## What was checked
1. Reversed date ranges (end before start) across dashboard and Convex public APIs.
2. Injection/bad-data handling in user-editable fields.
3. Dashboard validation behavior for malformed settings (`Convex URL`, query path, args JSON).
4. Load speed and mobile friendliness.
5. Slow-internet loading behavior and skeleton visibility.
6. UX/UI pass for clarity of errors and edge-case feedback.

## Findings (before fixes)
1. **P1**: Convex queries threw server errors when date ranges were reversed.
- Repro evidence: `responses/prepatch_edge_inputs.ndjson` (`reversed_*` cases returned `status:error`).

2. **P1**: `trackerPlates:assignLicensePlate` accepted injection-style strings.
- Repro evidence: `responses/prepatch_edge_inputs.ndjson` (`injection_trackerPlates` returned `status:success`).

3. **P2**: Dashboard allowed malformed query path/args to be applied without immediate validation.
- User got runtime fetch errors rather than direct form validation.

## Fixes applied
### Convex
1. `/convex/queries.ts`
- Replaced hard range assertion with normalization (auto-swap reversed start/end).
- Applied to:
  - `getDashboardEvents`
  - `getTrackerEventHistory`
  - `getEventsByType`
  - `getBeaconHistory`

2. `/convex/beaconOwnership.ts`
- Replaced range assertion with normalization in:
  - `getAssignmentTimeline`
  - `getResolvedPath`
- Added identifier validation for `beaconId`/`trackerId`.
- Added optional note sanitization and max length.
- Added tracking-number max length guard.

3. `/convex/beaconTracking.ts`
- Added `beaconId` validation (trim, max length, safe charset) for mutations/queries.

4. `/convex/trackerPlates.ts`
- Added strict normalization/validation for `trackerName` and `licensePlate`.

### Dashboard
1. `/src/components/tracker-dashboard.tsx`
- Added client-side validation for:
  - function path format (`module:function`)
  - args JSON object validity
  - identifier/license-plate/tracking-number constraints
  - beacon prior note length/control chars
- Added input `maxLength` and safer input attributes on critical fields.
- Added explicit range note when user selects reversed date/time.
- Added early guard in query execution for invalid function path.

## Post-fix verification
1. Reversed range API calls now succeed (auto-normalized):
- `responses/postdeploy_edge_inputs.ndjson`
  - `reversed_getDashboardEvents`: `status:success`
  - `reversed_getTrackerEventHistory`: `status:success`
  - `reversed_beaconAssignmentTimeline`: `status:success`

2. Injection-style payloads now rejected:
- `responses/postdeploy_edge_inputs.ndjson`
  - `injection_trackerPlates`: `status:error`
- `responses/postdeploy_additional_input_rejection.ndjson`
  - beacon ownership/tracking invalid IDs: `status:error`

3. Browser edge-case validation checks passed:
- `responses/playwright_edge_audit_summary.json`
  - `reversedDateNoteVisible: true`
  - `invalidJsonRejected: true`
  - `invalidPathRejected: true`
  - `injectionStylePlateRejected: true`
  - `skeletonVisibleUnderSlowQuery: true`
  - `mobileHorizontalOverflow: false`

## Performance and mobile results
1. Lighthouse desktop (live Vercel):
- `responses/lighthouse_desktop_live.summary.json`
- Performance 97, Accessibility 87, Best Practices 96, SEO 100
- FCP ~372ms, LCP ~1208ms

2. Lighthouse mobile (live Vercel):
- `responses/lighthouse_mobile_live.summary.json`
- Performance 80, Accessibility 87, Best Practices 96, SEO 100
- FCP ~1126ms, LCP ~5387ms

3. Local runtime timings (Playwright):
- `responses/playwright_edge_audit_summary.json`
- Desktop FCP ~344ms, Mobile FCP ~1832ms (local run with selected tracker state)

## UX/UI observations
1. Reversed date ranges are now explicitly communicated in UI (not silently corrected).
2. Form-level validation now provides immediate actionable error messages.
3. Loading skeleton appears under delayed query response (verified under simulated slow query).
4. Mobile layouts for `/` and `/beacons` show no horizontal overflow in test run.

## Screenshots
- `screenshots/live_tracker_browseruse.png`
- `screenshots/local_desktop_loaded.png`
- `screenshots/local_reversed_date_note.png`
- `screenshots/local_invalid_json_error.png`
- `screenshots/local_invalid_path_error.png`
- `screenshots/local_plate_validation_error.png`
- `screenshots/local_slow_network_skeleton_retry.png`
- `screenshots/local_mobile_tracker.png`
- `screenshots/local_mobile_beacons.png`

## Deployment and git state
1. `tracker-dashboard` pushed to `main` at `5710559`.
2. `parcel-tracker-convex` pushed to `main` at `4f56cb0`.
3. Convex production deploy completed to `https://dutiful-bison-575.convex.cloud`.
4. Root submodule pointers updated and pushed at `6e58c9f`.

## Residual risk
1. Convex HTTP query API still returns generic `Server Error` envelopes for rejected calls, so users won’t always see detailed backend validation text over HTTP.
2. Existing historical bad rows (created pre-hardening) are not auto-cleaned by this pass.

## Convex Production Log Remediation (DB Error)

### Issue discovered from production logs
- Source: `logs/convex_prod_logs_2000.errors.jsonl`
- Error: `beaconOwnershipEngineV2:resolveBeaconWindowHmm` repeatedly failed with:
  - `Too many reads in a single function execution (limit: 4096)`
- Trigger path: hourly ownership maintenance action (`runHourlyOwnershipMaintenance`) in shadow mode.

### Root cause
- `replaceShadowWindowRows` used unbounded `.collect()` over historical shadow bucket/path windows.
- On high-history beacons, this pulled ~9.5k documents in one mutation, exceeding Convex read limit.

### Fixes applied
- File: `repos/parcel-tracker-convex/convex/beaconOwnershipEngineV2.ts`
1. Narrowed segment-delete candidate selection to in-window + limited lookback.
2. Added capped per-table rewrites (`MAX_WINDOW_REWRITE_DELETE_ROWS = 800`) for:
  - `beacon_hmm_bucket_observations_shadow`
  - `beacon_hmm_path_shadow`
  - in-window segment rows
  - canonical scan/segment rewrites

### Verification
1. Manual production run before final cap fix:
- `npx convex run beaconOwnershipEngineV2:runHourlyOwnershipMaintenance ...`
- Result: `failedCount: 6`
- Errors confirmed in `logs/convex_prod_logs_post_manual_run.errors.jsonl`

2. Manual production run after final fix/deploy:
- Result: `failedCount: 0`, `processedCount: 3`, `status: interrupted` (time-budget stop, not error)
- RequestId: `a487a186290b2de6`
- All `resolveBeaconWindowHmm` executions completed with no error.
- Read documents reduced to ~3220 per run (below 4096), confirmed in:
  - `logs/convex_prod_logs_post_fix_validation.jsonl`
