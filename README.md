# Sentinel

**Sentinel** is a lightweight, self-hosted deployment control plane for single-user VPS environments. It receives GitHub webhooks and orchestrates an automated pipeline — clone, build, deploy, verify, and monitor — with automatic rollback on failure.

No databases, no queues, no Kubernetes. Just Node.js, shell scripts, and Docker.

## How It Works

```
GitHub Push (main)
    │
    ▼
┌─ Sentinel Server (Node.js/Express) ──────────────────────┐
│  POST /webhook → HMAC verify → spawn pipeline (detached) │
└───────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Pipeline (scripts/pipeline.sh) ──────────────────────────┐
│  clone_pull → build → deploy → verify → monitor           │
│                                     ▼                     │
│                                ┌──────────┐               │
│                                │ verify.sh│               │
│                                │ (3 checks)│               │
│                                └────┬─────┘               │
│                                     │                     │
│                              success/ fail                │
│                                 │      │                  │
│                                 ▼      ▼                  │
│                          continue  rollback.sh            │
└───────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Monitor (scripts/monitor.sh) ────────────────────────────┐
│  Continuous health checks → auto-rollback after 5 fails   │
│  Supervised by PM2 (scripts/start-monitors.sh)            │
└───────────────────────────────────────────────────────────┘
```

## Features

- **GitHub Webhook Integration** — HMAC-SHA256 verification, non-main branch filtering, rate limiting
- **Docker Pipeline** — Clone (or pull existing), build image, deploy container with port mapping
- **Health Verification** — Configurable endpoint path, retry logic, 3 consecutive passes required
- **Auto-Rollback** — Failed verification triggers immediate rollback to previous image
- **Continuous Monitoring** — Per-app health monitor checks every 60s, auto-rollback after configurable failure threshold (5), rollback cap (3)
- **Port Auto-Assignment** — Automatic host port allocation with collision avoidance
- **PID-Based Locking** — Stale lock detection via PID liveness check (no 30-minute wait on crash)
- **PM2 Managed** — Two processes: `sentinel` (Node.js API) and `sentinel-monitors` (bash supervisor)
- **File-Based State** — No database dependency; state stored as JSON and text files under `REPOS_DIR`
- **Comprehensive Security** — Helmet, rate limiting, input validation, API key auth, unexpected field rejection

## Prerequisites

- Node.js >= 18
- Docker
- A GitHub repository with a webhook configured
- (Recommended) PM2 for production: `npm install -g pm2`

## Setup

```bash
# Install dependencies
npm install

# Make scripts executable
chmod +x scripts/*.sh

# Configure environment
cp .env.example .env
```

Edit `.env` with your settings:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `GITHUB_WEBHOOK_SECRET` | — | GitHub webhook secret |
| `SENTINEL_API_KEY` | — | API key for deployment status endpoints |
| `REPOS_BASE_PATH` | `./repos` | Path to repos directory |
| `SCRIPTS_PATH` | `./scripts` | Path to pipeline scripts |
| `DATA_PATH` | `./data` | Path to app config files |
| `BACKEND_URL` | `http://localhost:3000` | URL for scripts to reach the server |
| `NODE_ENV` | — | Set to `production` for deployment |

## Usage

```bash
# Development
npm run dev

# Production (PM2)
npm run prod

# View logs
npm run prod:logs

# Status
npm run prod:status
```

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/webhook` | HMAC | GitHub webhook receiver |
| `GET` | `/apps/:repoName` | API key | Get app configuration |
| `POST` | `/apps/:repoName/config` | API key | Update app configuration |
| `GET` | `/deployments` | — | List all deployments |
| `PATCH` | `/deployments/:id` | API key | Update deployment status (from scripts) |
| `GET` | `/health` | — | Sentinel health check |

## Pipeline Scripts

| Script | Purpose |
|---|---|
| `pipeline.sh` | Orchestrator — lock management, sequencing |
| `clone_pull.sh` | Clone or pull repository |
| `build.sh` | Docker image build |
| `deploy.sh` | Stop old container, start new one with port mapping |
| `verify.sh` | Health check with retry (3 consecutive passes) |
| `rollback.sh` | Restore previous image on failure |
| `monitor.sh` | Continuous health monitoring with auto-rollback |
| `start-monitors.sh` | PM2-supervised monitor process manager |

## App Configuration

Each deployed app is configured via the API:

```bash
# Get app config
curl -H "Authorization: Bearer $SENTINEL_API_KEY" http://localhost:3000/apps/myapp

# Update app config
curl -X POST \
  -H "Authorization: Bearer $SENTINEL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"host_port": 8080, "container_port": 3000, "health_path": "/health"}' \
  http://localhost:3000/apps/myapp/config
```

## Production Deployment

```bash
# 1. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 and Docker
npm install -g pm2
curl -fsSL https://get.docker.com | sh

# 3. Clone and configure
git clone <repo-url> sentinel
cd sentinel
npm install
cp .env.example .env
# Edit .env with your settings

# 4. Start
npm run prod
```

Configure nginx as a reverse proxy with Let's Encrypt SSL (see `nginx.conf`).

## Architecture Notes

- **Single-user design** — No multi-tenant isolation, no user management, no SaaS patterns
- **No database** — State persisted as JSON files in `DATA_PATH` and text files in each repo's app directory under `REPOS_DIR`
- **No queues** — Pipeline runs as a detached child process; concurrent deploys are blocked by PID-based lock files
- **Scripts update state via API** — Each pipeline step calls `PATCH /deployments/:id` with status updates using `SENTINEL_API_KEY`
- **`REPOS_DIR` override** — All scripts read `$REPOS_DIR` (default `/repos`), overridable via environment variable for local testing

## What We Fixed — The Journey

Sentinel went through several architectural hurdles to reach production stability. Here is what was found, what conflicted, and how each was resolved.

### 1. Dual-Storage Inconsistency (SQLite ↔ JSON)

**Problem:** App configurations were written to both SQLite (`app_configs` table) and JSON files (`data/apps/*.json`). The two stores drifted — JSON files were orphaned or stale, and reads from different code paths returned different data. Cross-user data leaks occurred when `GET /apps` returned every app regardless of ownership.

**Fix:** Removed all JSON file reads/writes. SQLite became the single source of truth. Created migration v3 adding `user_id`, `domain`, `ssl`, and `previews` columns to `app_configs`. Queries were scoped to `req.user.id`. Dual-write paths in `POST /apps/import` and `DELETE /apps/:repoName` were deleted.

### 2. Pipeline Domain Capture Contaminated by Log Output

**Problem:** `pipeline.sh` captured the nginx domain via `NGINX_DOMAIN=$(./nginx-config.sh ...)`. But `nginx-config.sh` called `log_info` (which wrote to stdout), and `nginx -t` (which printed "syntax is ok" / "test is successful" to stdout). Both leaked into the captured variable, producing garbage like:
```
[INFO] Generating Nginx config for test.vinoth-sntl.uk...
nginx: the configuration file syntax is ok
test.vinoth-sntl.uk
```
This multi-line string was then passed to certbot (`-d` argument) causing "Non-ASCII domain names not supported" and written to `app_configs.domain` corrupting the database.

**Fix (three rounds):**
- Round 1: Redirected all `log_info`/`log_warn`/`log_error` functions to stderr (`>&2`) in `common.sh` and `provision-ssl.sh`.
- Round 2: Redirected `nginx -t` and `systemctl reload nginx` output to `/dev/null` so only the final `echo "$DOMAIN"` reaches stdout.
- Round 3: Added `certbot install --cert-name DOMAIN --nginx` to the existing-cert path so the SSL block is re-wired into freshly generated HTTP-only nginx configs.

### 3. SSL Config Wiped Every Deploy

**Problem:** `nginx-config.sh` always wrote a fresh HTTP-only nginx config on every deploy. If a valid Let's Encrypt cert already existed from a previous deploy, `provision-ssl.sh` skipped re-issuance but also did nothing to re-wire the cert — leaving HTTPS silently broken despite valid cert files on disk.

**Fix:** Replaced the empty `exit 0` skip with `certbot install --cert-name "$PRIMARY_DOMAIN" --nginx`. This tells certbot: "edit the nginx server block to add `listen 443 ssl`, `ssl_certificate`, and HTTP→HTTPS redirect without requesting a new certificate." No Let's Encrypt rate-limit is consumed.

### 4. Admin API Key Bypass for Pipeline Backend Calls

**Problem:** The pipeline sends API requests to the backend with the `SENTINEL_API_KEY` (user id 0). But `requireAppOwnership` rejected these because apps are owned by real user ids (≥ 1). This broke `PATCH /apps/:repoName/domain` and `GET /apps/:repoName` when called from shell scripts.

**Fix:** Added an early return in `requireAppOwnership`: if `userId === 0`, return truthy immediately. The admin API key is already a full-access secret (the deployment state endpoint trusts it the same way), so the same trust level applies to ownership checks.

### 5. Deployment Status Not Visible in App Detail

**Problem:** `GET /apps/:repoName` returned app config but no deployment status. Users had no way to see if their app was healthy, deploying, or failed from the API.

**Fix:** Added `latestDeploymentStatus()` helper that reads the latest deployment from JSON files (the deployment source of truth for shell rollback scripts) and appends a `status` field to the app response. `GET /apps` also adds status for admin users.

### Summary

| Issue | Category | Resolution |
|-------|----------|------------|
| SQLite/JSON dual-write | Data integrity | SQLite single source of truth |
| Log output in command substitution | Pipeline reliability | `>&2` redirect on all log functions |
| `nginx -t` stdout leak | Pipeline reliability | `>/dev/null 2>&1` on `nginx -t` |
| SSL config lost on redeploy | HTTPS reliability | `certbot install` instead of skip |
| Admin API key rejected | Auth | Ownership bypass for user id 0 |
| No deployment status | UX | `latestDeploymentStatus()` API |

## License

MIT
