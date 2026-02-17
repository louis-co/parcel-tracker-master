# AGENTS.md

`parcel-tracker-master` is the coordination repo for Parcel Tracker: it tracks submodules and cross-repo docs, while most product code lives in child repositories.

## Essentials

- Package manager: none at root; use each child repo's package manager/tooling.
- Root-level required sync command after child repo changes:
  - `git submodule update --init --recursive --remote`
- Final branch target for all repos: `main`.

## Detailed Guidance

- Repo map and deployment notes: [docs/agents/repo-map.md](docs/agents/repo-map.md)
- Git/submodule workflow: [docs/agents/git-workflow.md](docs/agents/git-workflow.md)
- Documentation upkeep rules: [docs/agents/documentation-upkeep.md](docs/agents/documentation-upkeep.md)
- Where to read first: [docs/agents/reading-order.md](docs/agents/reading-order.md)
- Browser automation setup (`browser-use`): [docs/agents/browser-use.md](docs/agents/browser-use.md)
