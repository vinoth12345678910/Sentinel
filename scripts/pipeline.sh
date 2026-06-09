#!/bin/bash
. ./common.sh

REPO_NAME=$1
DEPLOYMENT_ID=$2
REPO_URL=$3
COMMIT_HASH=$4
HOST_PORT=$5
CONTAINER_PORT=$6
HEALTH_PATH=$7

HEALTH_URL="http://localhost:$HOST_PORT$HEALTH_PATH"

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "REPO_URL" "$REPO_URL" "COMMIT_HASH" "$COMMIT_HASH" "HOST_PORT" "$HOST_PORT" "CONTAINER_PORT" "$CONTAINER_PORT" "HEALTH_PATH" "$HEALTH_PATH"

log_info "Pipeline started for $REPO_NAME"
update_state "STARTED"

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

    # If the locking PID is alive and lock is fresh, block
    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null && [ "$AGE" -lt 1800 ]; then
        log_error "Deployment already running for $REPO_NAME"
        exit 1
    fi

    log_warn "Removing stale deployment lock"
    rm -f "$LOCK_FILE"
fi

{
    echo "$CURRENT_TIME"
    echo "$$"
    echo "$DEPLOYMENT_ID"
} > "$LOCK_FILE"

./clone_pull.sh "$REPO_NAME" "$REPO_URL" "$COMMIT_HASH" "$DEPLOYMENT_ID" || exit 1

./build.sh "$REPO_NAME" "$DEPLOYMENT_ID" || exit 1

./deploy.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HOST_PORT" "$CONTAINER_PORT" "$HEALTH_PATH"
if [ $? -ne 0 ]; then
    update_state "FAILED_AT_DEPLOY"
    ./rollback.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL" "$HOST_PORT" "$CONTAINER_PORT"
    exit 1
fi

./verify.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL"
if [ $? -ne 0 ]; then
    update_state "FAILED_AT_VERIFY"
    ./rollback.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL" "$HOST_PORT" "$CONTAINER_PORT"
    exit 1
fi

docker system prune -f --filter "until=24h" 2>/dev/null || true

log_info "Pipeline completed successfully"
update_state "SUCCESS"
exit 0