#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="${1:-}"
DEPLOYMENT_ID="${2:-}"
HEALTH_URL="${3:-}"
HOST_PORT="${4:-}"
CONTAINER_PORT="${5:-}"

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "HEALTH_URL" "$HEALTH_URL" "HOST_PORT" "$HOST_PORT" "CONTAINER_PORT" "$CONTAINER_PORT"

log_info "Starting rollback for $REPO_NAME"
update_state "ROLLBACK_STARTED"

REPO_DIR="$REPOS_DIR/$REPO_NAME"
ACTIVE_CONTAINER_FILE="$REPO_DIR/active_container.txt"
ACTIVE_IMAGE_FILE="$REPO_DIR/active_image.txt"
PREVIOUS_IMAGE_FILE="$REPO_DIR/previous_image.txt"

if [ ! -f "$PREVIOUS_IMAGE_FILE" ]; then
    log_error "No previous image found — cannot rollback"
    update_state "FAILED" "No previous image for rollback"
    exit 1
fi

GOOD_IMG=$(cat "$PREVIOUS_IMAGE_FILE")

if [ ! -f "$ACTIVE_CONTAINER_FILE" ]; then
    log_error "No active container file — cannot determine container to stop"
    update_state "FAILED" "No active container file"
    exit 1
fi
BROKEN_CONTAINER=$(cat "$ACTIVE_CONTAINER_FILE")

log_info "Rolling back from $BROKEN_CONTAINER to image $GOOD_IMG"

if docker inspect "$BROKEN_CONTAINER" > /dev/null 2>&1; then
    docker rm -f "$BROKEN_CONTAINER" || { update_state "FAILED" "Rollback failed at docker rm"; exit 1; }
else
    log_warn "Container '$BROKEN_CONTAINER' not found — skipping stop/rm"
fi

docker run -d --restart unless-stopped -p "$HOST_PORT:$CONTAINER_PORT" --name "$REPO_NAME" "$GOOD_IMG" || { update_state "FAILED" "Rollback failed at docker run"; exit 1; }
echo "$REPO_NAME" > "$ACTIVE_CONTAINER_FILE" || { update_state "FAILED" "Cannot write active_container_file"; exit 1; }
echo "$GOOD_IMG" > "$ACTIVE_IMAGE_FILE" || { update_state "FAILED" "Cannot write active_image_file"; exit 1; }

./verify.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL" || { update_state "FAILED" "Rollback verify failed"; exit 1; }

update_state "ROLLED_BACK"
log_info "Rollback completed"
exit 0