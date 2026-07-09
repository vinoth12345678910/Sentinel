#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="${1:-}"
DEPLOYMENT_ID="${2:-}"
REPO_URL="${3:-}"
COMMIT_HASH="${4:-}"
HOST_PORT="${5:-}"
CONTAINER_PORT="${6:-}"
HEALTH_PATH="${7:-}"
ENV_FILE="${8:-}"
BRANCH="${9:-main}"

HEALTH_URL="http://localhost:$HOST_PORT$HEALTH_PATH"

IS_PREVIEW=false
if [ "$BRANCH" != "main" ]; then
    IS_PREVIEW=true
fi

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "REPO_URL" "$REPO_URL" "COMMIT_HASH" "$COMMIT_HASH" "HOST_PORT" "$HOST_PORT" "CONTAINER_PORT" "$CONTAINER_PORT" "HEALTH_PATH" "$HEALTH_PATH"

IS_SENTINEL=false
REPO_NAME_LOWER=$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]')
if [ "$REPO_NAME_LOWER" = "sentinel" ]; then
    IS_SENTINEL=true
    log_info "Detected Sentinel self-deploy — using PM2 path"
fi

log_info "Pipeline started for $REPO_NAME (deployment: $DEPLOYMENT_ID)"
update_state "STARTED"

STEP_TIMEOUT=600  # 10 minutes per step
run_step() {
  local label="$1"
  shift
  log_info "Step: $label"
  timeout "$STEP_TIMEOUT" "$@" || {
    local rc=$?
    if [ "$rc" = "124" ]; then
      log_error "Step '$label' timed out after ${STEP_TIMEOUT}s"
    fi
    return "$rc"
  }
}

LOCK_FILE="$REPOS_DIR/$REPO_NAME/.deploy.lock"
CURRENT_TIME=$(date +%s)

cleanup() {
    rm -f "$LOCK_FILE"
}

trap cleanup EXIT

if [ -f "$LOCK_FILE" ] && [ "$(wc -l < "$LOCK_FILE" 2>/dev/null || echo 0)" -ge 3 ]; then
    {
        read -r LOCK_TIME
        read -r LOCK_PID
        read -r LOCK_DEPLOY
    } < "$LOCK_FILE"

    AGE=$((CURRENT_TIME - LOCK_TIME))
elif [ -f "$LOCK_FILE" ]; then
    log_warn "Lock file is malformed — removing"
    rm -f "$LOCK_FILE"
fi

if [ -n "${LOCK_PID:-}" ]; then

    if kill -0 "$LOCK_PID" 2>/dev/null && [ "$AGE" -lt 1800 ]; then
        log_error "Deployment already running for $REPO_NAME (lock held by PID $LOCK_PID)"
        update_state "FAILED"
        exit 1
    fi

    log_warn "Removing stale deployment lock (age: ${AGE}s)"
    rm -f "$LOCK_FILE"
fi

{
    echo "$CURRENT_TIME"
    echo "$$"
    echo "$DEPLOYMENT_ID"
} > "$LOCK_FILE"

log_info "Stage 1: Cloning/pulling repository"
run_step "Clone/Pull" ./clone_pull.sh "$REPO_NAME" "$REPO_URL" "$COMMIT_HASH" "$DEPLOYMENT_ID" "$BRANCH" || {
    log_error "Clone/pull failed"
    update_state "FAILED_AT_CLONE"
    exit 1
}

if [ "$IS_SENTINEL" = true ]; then
    log_info "Stage 2: Deploying Sentinel via PM2"
    run_step "Deploy-Sentinel" ./deploy-sentinel.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HOST_PORT" "$HEALTH_PATH"
    DEPLOY_EXIT=$?
    if [ "$DEPLOY_EXIT" -ne 0 ]; then
        log_error "Sentinel self-deploy failed"
        update_state "FAILED_AT_DEPLOY"
        exit 1
    fi
else
    log_info "Stage 2: Building Docker image"
    run_step "Build" ./build.sh "$REPO_NAME" "$DEPLOYMENT_ID" || {
        log_error "Build failed"
        exit 1
    }

    log_info "Stage 3: Deploying container"
    run_step "Deploy" ./deploy.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HOST_PORT" "$CONTAINER_PORT" "$HEALTH_PATH" "$ENV_FILE"
    DEPLOY_EXIT=$?
    if [ "$DEPLOY_EXIT" -ne 0 ]; then
        log_error "Deploy failed"
        update_state "FAILED_AT_DEPLOY"
        run_step "Rollback" ./rollback.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL" "$HOST_PORT" "$CONTAINER_PORT" || {
            log_error "Rollback also failed"
            update_state "FAILED"
        }
        exit 1
    fi

    log_info "Stage 4: Verifying deployment health"
    run_step "Verify" ./verify.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL"
    VERIFY_EXIT=$?
    if [ "$VERIFY_EXIT" -ne 0 ]; then
        log_error "Verification failed — starting rollback"
        update_state "FAILED_AT_VERIFY"
        run_step "Rollback" ./rollback.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL" "$HOST_PORT" "$CONTAINER_PORT" || {
            log_error "Rollback also failed"
            update_state "FAILED"
        }
        exit 1
    fi
fi

log_info "Stage 5: Configuring Nginx reverse proxy"

# Fetch custom domains from backend for this app
CUSTOM_DOMAINS=""
if [ "$IS_PREVIEW" = false ]; then
    APP_DATA=$(curl -s -H "x-api-key: $SENTINEL_API_KEY" "$BACKEND_URL/apps/$REPO_NAME" 2>/dev/null || echo "{}")
    CUSTOM_DOMAINS=$(echo "$APP_DATA" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    cds=d.get('custom_domains',{})
    print(','.join(cds.keys()))
except: print('')
" 2>/dev/null || echo "")
    if [ -n "$CUSTOM_DOMAINS" ]; then
        log_info "Custom domains: $CUSTOM_DOMAINS"
        export CUSTOM_DOMAINS
    fi
fi

if [ "$IS_PREVIEW" = true ]; then
    BASE_DOMAIN="${BASE_DOMAIN:-vinoth-sntl.uk}"
    PREVIEW_SLUG=$(echo "$BRANCH" | sed 's/[^a-zA-Z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | tr '[:upper:]' '[:lower:]')
    PREVIEW_DOMAIN="${PREVIEW_SLUG}--$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]').${BASE_DOMAIN}"
    log_info "Preview domain: $PREVIEW_DOMAIN"
    NGINX_DOMAIN=$(run_step "Nginx-Config" ./nginx-config.sh "$REPO_NAME" "$HOST_PORT" "$PREVIEW_DOMAIN" || echo "")
else
    NGINX_DOMAIN=$(run_step "Nginx-Config" ./nginx-config.sh "$REPO_NAME" "$HOST_PORT" "" || echo "")
fi

SSL_ENABLED=0
if [ -n "$NGINX_DOMAIN" ]; then
    log_info "Nginx configured for domain: $NGINX_DOMAIN"

    if [ "$IS_PREVIEW" = false ]; then
        # Stage 6: Provision SSL certificate (non-blocking — HTTP fallback)
        log_info "Stage 6: Provisioning SSL certificate for $NGINX_DOMAIN"
        update_state "SSL_PROVISIONING"

        # Collect custom domains for multi-domain cert
        SSL_DOMAINS=("$NGINX_DOMAIN")
        if [ -n "${CUSTOM_DOMAINS:-}" ]; then
            IFS=',' read -ra CDS <<< "$CUSTOM_DOMAINS"
            for CD in "${CDS[@]}"; do
                read -r CD_TRIMMED <<< "$CD"
                if [ -n "$CD_TRIMMED" ]; then
                    SSL_DOMAINS+=("$CD_TRIMMED")
                fi
            done
        fi

        # Retry up to 3 times with 30s delay for DNS propagation
        for attempt in 1 2 3; do
            if ./provision-ssl.sh "${SSL_DOMAINS[@]}" 2>&1; then
                SSL_ENABLED=1
                log_info "SSL certificate provisioned successfully for ${SSL_DOMAINS[*]}"
                nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || log_warn "Could not reload nginx after SSL provisioning"
                break
            fi
            if [ "$attempt" -lt 3 ]; then
                log_warn "SSL provisioning attempt $attempt failed — retrying in 30s (DNS propagation?)"
                sleep 30
            fi
        done

        if [ "$SSL_ENABLED" = "1" ]; then
            log_info "HTTPS enabled for $NGINX_DOMAIN"
        else
            log_warn "SSL provisioning failed after 3 attempts — app accessible via HTTP only"
        fi
    fi

    # Register domain with backend
    if [ "$IS_PREVIEW" = true ]; then
        PREVIEW_DATA=$(export BRANCH HOST_PORT NGINX_DOMAIN DEPLOYMENT_ID; python3 -c "
import os,json,sys
sys.stdout.write(json.dumps({
    'preview_branch': os.environ['BRANCH'],
    'host_port': int(os.environ['HOST_PORT']),
    'domain': os.environ['NGINX_DOMAIN'],
    'deployment_id': os.environ['DEPLOYMENT_ID']
}))
" 2>/dev/null || echo "")
        if [ -n "$PREVIEW_DATA" ]; then
            curl -s -o /dev/null -X PUT "$BACKEND_URL/apps/$REPO_NAME/previews/$BRANCH" \
                -H "Content-Type: application/json" \
                -H "x-api-key: $SENTINEL_API_KEY" \
                -d "$PREVIEW_DATA" || log_warn "Failed to register preview with backend"
        else
            log_warn "Failed to build preview JSON payload"
        fi
    else
        DOMAIN_DATA=$(export NGINX_DOMAIN SSL_ENABLED; python3 -c "
import os,json,sys
sys.stdout.write(json.dumps({
    'domain': os.environ['NGINX_DOMAIN'],
    'ssl': os.environ.get('SSL_ENABLED', '0') == '1'
}))
" 2>/dev/null || echo "")
        if [ -n "$DOMAIN_DATA" ]; then
            curl -s -o /dev/null -X PATCH "$BACKEND_URL/apps/$REPO_NAME/domain" \
                -H "Content-Type: application/json" \
                -H "x-api-key: $SENTINEL_API_KEY" \
                -d "$DOMAIN_DATA" || log_warn "Failed to register domain with backend"
        else
            log_warn "Failed to build domain JSON payload"
        fi
    fi
else
    log_warn "Nginx config generation failed — deployment still healthy but may not be accessible via domain"
fi

if [ "$IS_SENTINEL" = false ]; then
    docker system prune -f --filter "until=24h" 2>/dev/null || true
fi

log_info "Pipeline completed successfully for $REPO_NAME"
update_state "SUCCESS"
exit 0
