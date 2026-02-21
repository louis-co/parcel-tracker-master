# Code Explainer: `.gitmodules`

## Source File
`.gitmodules`

## System Context (From Project Docs)
This file lives in the coordination repo scope and supports cross-repository operations and documentation coherence.

Context sources:
- `README.md`
- `EXPLAINER.md`

## What This Specific File Does (Plain English)
This repository control file tells Git what to include/ignore or how submodules are wired.

## Code Snapshot
```
[submodule "repos/tracker-dashboard"]
	path = repos/tracker-dashboard
	url = https://github.com/louis-co/tracker-dashboard.git
[submodule "repos/parcel-tracker-pi"]
	path = repos/parcel-tracker-pi
	url = https://github.com/louis-co/parcel-tracker-pi.git
[submodule "repos/parcel-tracker-contract"]
	path = repos/parcel-tracker-contract
	url = https://github.com/louis-co/parcel-tracker-contract.git
[submodule "repos/parcel-tracker-convex"]
	path = repos/parcel-tracker-convex
	url = https://github.com/louis-co/parcel-tracker-convex.git
```

## Important Sections
- This maps submodule names/paths to their upstream repositories.
- It is required so the master repo can pin exact child-repo commits.

## Beginner Tip
Start by matching this file to where it is consumed (service file, script, backend function, or UI import). Then follow one data path end-to-end.
