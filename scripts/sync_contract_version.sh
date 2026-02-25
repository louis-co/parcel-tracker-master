#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACT_FILE="$ROOT_DIR/repos/parcel-tracker-contract/CONTRACT_VERSION"
MODE="${1:-update}"

if [[ "$MODE" != "update" && "$MODE" != "--check" ]]; then
  echo "Usage: $0 [--check]" >&2
  exit 1
fi

CHECK_ONLY=0
if [[ "$MODE" == "--check" ]]; then
  CHECK_ONLY=1
fi

if [[ ! -f "$CONTRACT_FILE" ]]; then
  echo "ERROR: missing contract version file: $CONTRACT_FILE" >&2
  exit 1
fi

CONTRACT_VERSION="$(tr -d '[:space:]' < "$CONTRACT_FILE")"
if [[ ! "$CONTRACT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: CONTRACT_VERSION must be semver (x.y.z). Found '$CONTRACT_VERSION'." >&2
  exit 1
fi
if [[ "$CONTRACT_VERSION" == "0.0.0" ]]; then
  echo "ERROR: CONTRACT_VERSION cannot be 0.0.0. Set a real release version before syncing." >&2
  exit 1
fi
CONTRACT_MAJOR="${CONTRACT_VERSION%%.*}"

sync_line() {
  local rel_path="$1"
  local prefix="$2"
  local expected_line="$3"
  local abs_path="$ROOT_DIR/$rel_path"
  local mode=""

  if [[ ! -f "$abs_path" ]]; then
    echo "ERROR: missing file: $rel_path" >&2
    exit 1
  fi

  if [[ "$CHECK_ONLY" -eq 0 ]]; then
    local tmp
    tmp="$(mktemp)"
    set +e
    awk -v prefix="$prefix" -v replacement="$expected_line" '
      BEGIN { replaced = 0 }
      index($0, prefix) == 1 {
        print replacement
        replaced = 1
        next
      }
      { print }
      END {
        if (!replaced) {
          exit 42
        }
      }
    ' "$abs_path" > "$tmp"
    local awk_status=$?
    set -e
    if [[ $awk_status -ne 0 ]]; then
      rm -f "$tmp"
      if [[ $awk_status -eq 42 ]]; then
        echo "ERROR: did not find prefix '$prefix' in $rel_path" >&2
      else
        echo "ERROR: failed to update $rel_path" >&2
      fi
      exit 1
    fi
    if mode="$(stat -f '%Lp' "$abs_path" 2>/dev/null)"; then
      :
    else
      mode="$(stat -c '%a' "$abs_path")"
    fi

    mv "$tmp" "$abs_path"
    chmod "$mode" "$abs_path"
  fi

  if ! grep -Fqx -- "$expected_line" "$abs_path"; then
    echo "ERROR: expected line not present in $rel_path:" >&2
    echo "  $expected_line" >&2
    exit 1
  fi

  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    echo "checked: $rel_path"
  else
    echo "synced:  $rel_path"
  fi
}

# Contract repo (human-facing version references)
sync_line "repos/parcel-tracker-contract/README.md" "- Version: " "- Version: \`${CONTRACT_VERSION}\`"
sync_line "repos/parcel-tracker-contract/examples/raw_event.heartbeat.json" "  \"contractVersion\": " "  \"contractVersion\": \"${CONTRACT_VERSION}\","
sync_line "repos/parcel-tracker-contract/examples/raw_event.ble_scan.json" "  \"contractVersion\": " "  \"contractVersion\": \"${CONTRACT_VERSION}\","
sync_line "repos/parcel-tracker-contract/examples/raw_event.gps_cell_fallback.json" "  \"contractVersion\": " "  \"contractVersion\": \"${CONTRACT_VERSION}\","

# Convex backend
sync_line "repos/parcel-tracker-convex/convex/ingest.ts" "export const CURRENT_CONTRACT_VERSION = " "export const CURRENT_CONTRACT_VERSION = \"${CONTRACT_VERSION}\";"
sync_line "repos/parcel-tracker-convex/convex/ingest.ts" "export const MIN_COMPATIBLE_MAJOR = " "export const MIN_COMPATIBLE_MAJOR = ${CONTRACT_MAJOR};"
sync_line "repos/parcel-tracker-convex/scripts/smoke_ingest.sh" "CONTRACT_VERSION=\"\${CONTRACT_VERSION:-" "CONTRACT_VERSION=\"\${CONTRACT_VERSION:-${CONTRACT_VERSION}}\""

# Pi runtime defaults
sync_line "repos/parcel-tracker-pi/runtime/location_uplink.py" "CONTRACT_VERSION = os.environ.get(\"CONTRACT_VERSION\"," "CONTRACT_VERSION = os.environ.get(\"CONTRACT_VERSION\", \"${CONTRACT_VERSION}\")"
sync_line "repos/parcel-tracker-pi/runtime/ble_uplink.py" "CONTRACT_VERSION = os.environ.get(\"CONTRACT_VERSION\"," "CONTRACT_VERSION = os.environ.get(\"CONTRACT_VERSION\", \"${CONTRACT_VERSION}\")"
sync_line "repos/parcel-tracker-pi/runtime/rfid_uplink.py" "CONTRACT_VERSION = os.environ.get(\"CONTRACT_VERSION\"," "CONTRACT_VERSION = os.environ.get(\"CONTRACT_VERSION\", \"${CONTRACT_VERSION}\")"
sync_line "repos/parcel-tracker-pi/runtime/location_uplink.service" "Environment=CONTRACT_VERSION=" "Environment=CONTRACT_VERSION=${CONTRACT_VERSION}"
sync_line "repos/parcel-tracker-pi/runtime/ble_receiver.service" "Environment=CONTRACT_VERSION=" "Environment=CONTRACT_VERSION=${CONTRACT_VERSION}"
sync_line "repos/parcel-tracker-pi/runtime/rfid_uplink.service" "Environment=CONTRACT_VERSION=" "Environment=CONTRACT_VERSION=${CONTRACT_VERSION}"
sync_line "repos/parcel-tracker-pi/runtime/config/location.env.example" "CONTRACT_VERSION=" "CONTRACT_VERSION=${CONTRACT_VERSION}"
sync_line "repos/parcel-tracker-pi/runtime/config/ble.env.example" "CONTRACT_VERSION=" "CONTRACT_VERSION=${CONTRACT_VERSION}"
sync_line "repos/parcel-tracker-pi/runtime/config/rfid.env.example" "CONTRACT_VERSION=" "CONTRACT_VERSION=${CONTRACT_VERSION}"

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  echo "Contract version sync check passed for $CONTRACT_VERSION (major $CONTRACT_MAJOR)."
else
  echo "Contract version synced to $CONTRACT_VERSION (major $CONTRACT_MAJOR)."
fi
