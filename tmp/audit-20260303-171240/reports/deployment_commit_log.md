# Deployment and Commit Log

## Child Repos

### tracker-dashboard
- Commit: `bb54ecd30fb2510f81526b12d5e7283df35266a9`
- Message: `Harden tracker parsing against invalid coordinates and speed spikes`
- Push: `origin/main` updated (`2400240 -> bb54ecd`)

### parcel-tracker-convex
- Commit: `a8fd1783ac990df523139e8ad2d438f2264b1fc5`
- Message: `Enforce ingest bounds and sourcePayload object semantics`
- Push: `origin/main` updated (`5501b56 -> a8fd178`)
- Deploy: `npx convex deploy --yes` successful to `https://dutiful-bison-575.convex.cloud`

## Master Repo (Submodule Pointers)
- Commit: `4cb084cbf4e4263f9ec741882380feea20c30f91`
- Message: `Update Convex and dashboard submodule pointers after audit fixes`
- Push: `origin/main` updated (`8467312 -> 4cb084c`)

## Notes
- Pre-existing local unstaged deletions in `repos/parcel-tracker-convex/convex/_generated/ce_*` were left untouched by design.
