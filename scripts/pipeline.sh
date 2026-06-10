#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="$1"
DEPLOYMENT_ID="$2"
REPO_URL="$3"
COMMIT_HASH="$4"
HOST_PORT="$5"
CONTAINER_PORT="$6"
HEALTH_PATH="$7"
ENV_FILE="$8"

HEALTH_URL="http://localhost:$HOST_PORT$HEALTH_PATH"

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "REPO_URL" "$REPO_URL" "COMMIT_HASH" "$COMMIT_HASH" "HOST_PORT" "$HOST_PORT" "CONTAINER_PORT" "$CONTAINER_PORT" "HEALTH_PATH" "$HEALTH_PATH"

IS_SENTINEL=false
if [ "${REPO_NAME,,}" = "sentinel" ]; then
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

if [ -f "$LOCK_FILE" ]; then
    {
        read -r LOCK_TIME
        read -r LOCK_PID
        read -r LOCK_DEPLOY
    } < "$LOCK_FILE"

    AGE=$((CURRENT_TIME - LOCK_TIME))

    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null && [ "$AGE" -lt 1800 ]; then
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

log_info "Stage 1/5: Cloning/pulling repository"
run_step "Clone/Pull" ./clone_pull.sh "$REPO_NAME" "$REPO_URL" "$COMMIT_HASH" "$DEPLOYMENT_ID" || {
    log_error "Clone/pull failed"
    exit 1
}

if [ "$IS_SENTINEL" = true ]; then
    log_info "Stage 2/5: Deploying Sentinel via PM2"
    run_step "Deploy-Sentinel" ./deploy-sentinel.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HOST_PORT" "$HEALTH_PATH"
    DEPLOY_EXIT=$?
    if [ "$DEPLOY_EXIT" -ne 0 ]; then
        log_error "Sentinel self-deploy failed"
        update_state "FAILED_AT_DEPLOY"
        exit 1
    fi
else
    log_info "Stage 2/5: Building Docker image"
    run_step "Build" ./build.sh "$REPO_NAME" "$DEPLOYMENT_ID" || {
        log_error "Build failed"
        exit 1
    }

    log_info "Stage 3/5: Deploying container"
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

    log_info "Stage 4/5: Verifying deployment health"
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

log_info "Stage 5/5: Configuring Nginx reverse proxy"
NGINX_OUTPUT=$(run_step "Nginx-Config" ./nginx-config.sh "$REPO_NAME" "$HOST_PORT" "$HEALTH_PATH" || echo "||FAILED||")
if [ "$NGINX_OUTPUT" != "||FAILED||" ]; then
    NGINX_DOMAIN=$(echo "$NGINX_OUTPUT" | head -1)
    SSL_OK=$(echo "$NGINX_OUTPUT" | grep "^SSL_OK=" | cut -d= -f2 || echo "0")
    log_info "Nginx configured for domain: $NGINX_DOMAIN"
    # Register domain with backend
    curl -s -o /dev/null -X PATCH "$BACKEND_URL/apps/$REPO_NAME/domain" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $SENTINEL_API_KEY" \
        -d "{\"domain\":\"$NGINX_DOMAIN\",\"ssl\":${SSL_OK:-false}}" || log_warn "Failed to register domain with backend"
else
    log_warn "Nginx config generation failed — deployment still healthy but may not be accessible via domain"
fi

if [ "$IS_SENTINEL" = false ]; then
    docker system prune -f --filter "until=24h" 2>/dev/null || true
fi

log_info "Pipeline completed successfully for $REPO_NAME"
update_state "SUCCESS"
exit 0
