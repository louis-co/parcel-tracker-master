#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

git pull --ff-only
git submodule sync --recursive
git submodule update --init --recursive --remote

echo "Submodules synced. Review with:"
echo "  git submodule status --recursive"
