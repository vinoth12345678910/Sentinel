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

## License

MIT
