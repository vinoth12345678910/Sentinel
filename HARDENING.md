# HARDENING.md — Sentinel Production Hardening Guide

**Date:** 2026-06-10  
**Audit Result:** 96/100 tests passing, 2 accepted risks, 3 production-only items

---

## Immediate Actions (Low Effort, High Impact)

### 1. Restrict `.env` File Permissions
```bash
chmod 600 /opt/Sentinel/.env
```
The `.env` file contains `GITHUB_WEBHOOK_SECRET`, `SENTINEL_API_KEY`, and `JWT_ACCESS_SECRET`.

### 2. Set Production Environment Variables
Add to `.env`:
```env
NODE_ENV=production
CORS_ORIGIN=https://vinoth-sntl.uk
ALLOWED_HOSTS=vinoth-sntl.uk,api.vinoth-sntl.uk
JWT_ACCESS_SECRET=<random-64-bytes-hex>
JWT_REFRESH_SECRET=<random-64-bytes-hex>
```

### 3. Enable Strict CSP in Helmet
In `src/app.js`, the current `contentSecurityPolicy: false` disables CSP. Enable it:
```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false, // keep false for now
}));
```

### 4. Add Read-Only Root Filesystem to Docker
```bash
# In scripts/deploy.sh, add to DOCKER_OPTS:
--read-only \
--tmpfs /tmp:rw,noexec,nosuid,size=100m \
--tmpfs /var/run:rw,noexec,nosuid,size=100m
```

### 5. Configure Docker Pull Policy
```bash
# In scripts/deploy.sh, before docker run:
docker pull --policy=always "$IMAGE_TAG" || docker pull --policy=never "$IMAGE_TAG"
```
Or set `--pull=never` on docker run to prevent tag confusion.

---

## Short-Term Improvements (1-2 Days)

### 6. Add User-to-App Ownership Model
This is the #1 architecture gap. Implement:
- Add `owner_id` column to `app_configs` table
- Auto-set `owner_id` on app creation (from authenticated user)
- Add middleware to check `req.user.id === app.owner_id || req.user.role === 'admin'`
- Routes: `GET/POST/PATCH/DELETE /apps/:name`, `env`, `deployments`

Migration SQL:
```sql
ALTER TABLE app_configs ADD COLUMN owner_id INTEGER REFERENCES users(id);
CREATE INDEX idx_app_configs_owner ON app_configs(owner_id);
```

### 7. Separate Rate Limiters Per Route Group
Currently all routes share one `apiRateLimiter`. Create separate instances:
- `authLimiter` (strict: 20/min) — login, register
- `deployLimiter` (moderate: 30/min) — deployments, apps
- `generalLimiter` (relaxed: 120/min) — health, metrics, static

### 8. Add Seccomp Profile
Create `/opt/Sentinel/seccomp/default.json` with a minimal Docker seccomp profile, then add to `DOCKER_OPTS`:
```bash
--security-opt seccomp=/opt/Sentinel/seccomp/default.json
```

### 9. Add Request ID Middleware
Add `express-request-id` or similar for traceability:
```js
const requestId = require('express-request-id');
app.use(requestId());
```
Include `requestId` in all log entries and error responses.

---

## Medium-Term Improvements (1 Week)

### 10. Replace In-Memory Rate Limiting with Redis
```bash
npm install rate-limit-redis ioredis
```

```js
const RedisStore = require('rate-limit-redis').default;
const client = require('ioredis').createClient();

const apiRateLimiter = rateLimit({
  store: new RedisStore({ client }),
  windowMs: 60 * 1000,
  max: 60,
});
```

### 11. Implement Trusted Registry Enforcement
Add a `ALLOWED_REGISTRIES` env var (e.g., `docker.io/vinothvinay`) and enforce in deploy.sh:
```bash
if ! echo "$IMAGE_TAG" | grep -qE "^($ALLOWED_REGISTRIES)/"; then
  log_error "Image not from trusted registry"
  exit 1
fi
```

### 12. Audit Log Enhancement
Add to `audit_log`:
- `user_agent` column
- `request_id` column  
- Action on all `PATCH /deployments/:id/state` calls
- Action on env var creates/reads/deletes

### 13. Database Backup Automation
```bash
# cron: nightly at 2am
0 2 * * * /opt/Sentinel/scripts/backup.sh >> /var/log/sentinel-backup.log 2>&1
```

---

## Long-Term Architecture (1 Month+)

### 14. Multi-Tenant Isolation
- Database-per-tenant or schema-per-tenant
- Separate Docker networks per team
- Resource quotas enforced at Docker level

### 15. Audit Trail for Pipeline Actions
- Every `docker run`, `docker rm`, `docker build` logged with full context
- Every `git clone`, `git checkout` logged
- Every `nginx -s reload` logged with config diff

### 16. Automated Security Scanning in CI
- `npm audit` on every push
- `docker scan` on every built image
- `shellcheck` on every `.sh` file change

---

## Production Checklist

### Pre-Deploy
- [ ] `.env` permissions: `chmod 600`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` set to dashboard domain
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` set to strong random values
- [ ] `ALLOWED_HOSTS` configured
- [ ] Nginx config updated with CSP headers, HSTS, TLS 1.3
- [ ] PM2 `ecosystem.config.js` has `max_memory_restart` and `max_restarts`
- [ ] Log rotation configured in PM2 or `logrotate`
- [ ] Prometheus target added to monitoring stack
- [ ] UFW/firewall allows only ports 80, 443, (optional: 9100 for node_exporter)

### Monitoring
- [ ] Disk usage alert at 80%
- [ ] Memory usage alert at 90%
- [ ] Failed deployment alert
- [ ] Rate limit saturation alert (>50% of max)
- [ ] SSL certificate expiry alert (30/14/7 days)

### Incident Response
1. **Webhook secret compromised**: Rotate `GITHUB_WEBHOOK_SECRET`, update GitHub webhook config, revoke all deployments
2. **Admin API key leaked**: Rotate `SENTINEL_API_KEY`, revoke all user API keys (`UPDATE users SET api_key = NULL`)
3. **JWT secret compromised**: Rotate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, revoke all refresh tokens
4. **Database compromised**: Restore from backup, rotate ALL secrets, audit all deployments for unauthorized changes

---

## Files Modified During Audit

| File | Change |
|------|--------|
| `.env` | Dev-local paths |
| `src/app.js` | Added CORS, hostValidation, updated imports |
| `src/middleware/authMiddleware.js` | Fixed timing-safe comparison |
| `src/middleware/hostValidation.js` | NEW — host header validation |
| `src/middleware/rateLimiter.js` | Added 429 logging |
| `src/middleware/validateInput.js` | Added max length checks |
| `src/routes/deployments.js` | Locked state PATCH to pipeline key |
| `src/routes/webhook.js` | Fixed HMAC comparison; added URL/hash validation |
| `src/routes/monitoring.js` | Added rate limiter |
| `scripts/*.sh` (12 files) | `set -euo pipefail`, quoting, Docker security, timeouts |

---

_End of hardening guide. Generated from audit results — 2026-06-10_
