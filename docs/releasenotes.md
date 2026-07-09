# Release Notes

## v1.1.0 — Stale State Cleanup

### Startup Cleanup Script

`server.js:cleanupStaleDeployments()` runs at startup and every 5 minutes. It marks any
`PENDING` or `STARTED` deployment older than 10 minutes as `FAILED_AT_SPAWN` (timed out).
This prevents ghost deployments from blocking future pipelines.

### Removed Blog Staging State

The deployment pipeline previously advertised a "Blog" staging state accessible at
`http://<host>/staging/blog`. This state was removed from the pipeline. Any references
on the VPS (README, welcome messages, dashboard instructions) should be updated or
removed — the state no longer exists.

### Breaking Changes

- `http://<host>/staging/blog` route no longer exists. Use the main dashboard at
  `http://<host>/dashboard` instead.
- `--user=1000:1000` with non-root base images now requires `--tmpfs` mounts (see deploy.sh).
