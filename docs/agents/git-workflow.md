# Git Workflow

Branch policy for this project:

- Push completed work to `main` in each affected repository.

When a child repository changes:

1. Commit and push the changed child repo to `origin/main`.
2. In the master repo, refresh submodule pointers:
   - `git submodule update --init --recursive --remote`
3. Commit and push updated submodule pointers from the master repo to `origin/main`.

## Contract Version Workflow

When `repos/parcel-tracker-contract/CONTRACT_VERSION` changes:

1. Commit/push the contract repo change first.
2. In the master repo, run:
   - `./scripts/sync_contract_version.sh`
3. Commit/push generated version sync changes in:
   - `repos/parcel-tracker-convex`
   - `repos/parcel-tracker-pi`
4. Deploy Convex before rolling Pi runtime updates.
5. Refresh root submodule pointers and commit/push this repo:
   - `git submodule update --init --recursive --remote`
