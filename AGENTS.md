# AGENTS.md

`parcel-tracker-master` is the coordination repo for Parcel Tracker: it tracks submodules and cross-repo docs, while most product code lives in child repositories.

## Essentials

- Package manager: none at root; use each child repo's package manager/tooling.
- Commits are essential after code changes:
  - Commit and push changes in each modified child repo.
  - Then update submodules at root and commit/push the updated submodule pointers in this repo.
  - Do not stop at local commits: always push completed changes to GitHub unless explicitly told not to push.
- Root-level required sync command after child repo changes:
  - `git submodule update --init --recursive --remote`
- Final branch target for all repos: `main`.

## Contract Sync (Required)

- `parcel-tracker-contract` is required. It is the shared schema/version authority between Pi and Convex.
- Source of truth for contract version:
  - `repos/parcel-tracker-contract/CONTRACT_VERSION`
- When `CONTRACT_VERSION` changes, you must sync dependent repos from root:
  - `./scripts/sync_contract_version.sh`
- To verify sync without editing files:
  - `./scripts/sync_contract_version.sh --check`
- Required release order when contract changes:
  1. Update and push `repos/parcel-tracker-contract` (schema/examples/version).
  2. Run `./scripts/sync_contract_version.sh` in this master repo.
  3. Commit and push resulting changes in `repos/parcel-tracker-convex`, deploy Convex.
  4. Commit and push resulting changes in `repos/parcel-tracker-pi`, roll out Pi update.
  5. Run `git submodule update --init --recursive --remote`, then commit/push updated submodule pointers in this repo.

## Detailed Guidance

- Repo map and deployment notes: [docs/agents/repo-map.md](docs/agents/repo-map.md)
- Git/submodule workflow: [docs/agents/git-workflow.md](docs/agents/git-workflow.md)
- Documentation upkeep rules: [docs/agents/documentation-upkeep.md](docs/agents/documentation-upkeep.md)
- Where to read first: [docs/agents/reading-order.md](docs/agents/reading-order.md)
- Browser automation setup (`browser-use`): [docs/agents/browser-use.md](docs/agents/browser-use.md)
