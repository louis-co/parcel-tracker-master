# Regression Checklist

- [x] Contract sync check passed (`./scripts/sync_contract_version.sh --check`).
- [x] Ingest valid payloads accepted for all core event types.
- [x] Invalid payload classes rejected (json/semantics/shape).
- [x] Idempotency verified (sequential and concurrent replay).
- [x] Query discoverability and liveness checks passed.
- [x] Heartbeat collapse modes (`all/latest/none`) validated.
- [x] Beacon conflict activation verified with synthetic overlap.
- [x] Beacon tracking assign/reassign/clear flows validated.
- [x] Dashboard lint/build green after fixes.
- [x] Live dashboard crash regression retested post-fix.
- [x] Convex production deploy completed after backend fix.
