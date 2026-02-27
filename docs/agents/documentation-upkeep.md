# Documentation Upkeep

When behavior changes, update docs in the same PR/commit wave as the code.

Rules:

1. Update the nearest owner doc first.
- Pi runtime/service behavior -> `repos/parcel-tracker-pi/README.md` and Pi docs.
- Beacon firmware behavior/config -> `repos/parcel-tracker-beacon/README.md`.
- Backend ingest/queries -> `repos/parcel-tracker-convex/README.md` and Convex docs.
- Contract/schema semantics -> `repos/parcel-tracker-contract/README.md`.
- Dashboard UI behavior -> `repos/tracker-dashboard/README.md`.

2. Keep cross-repo docs high-level.
- `EXPLAINER.md` should describe system behavior and dependencies, not service-level command detail.

3. Avoid cross-repo detail leakage.
- Do not document Pi operational implementation details inside dashboard docs.
- Do not document dashboard UI specifics inside Pi docs.

4. If troubleshooting produced reusable runbook knowledge:
- Record it in the relevant child repo README/docs.
- If it affects overall system behavior, add a short high-level note to root `EXPLAINER.md`.
