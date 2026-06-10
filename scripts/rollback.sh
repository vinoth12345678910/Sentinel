#!/bin/bash
set -e
. ./common.sh

REPO_NAME=$1
DEPLOYMENT_ID=$2
HEALTH_URL=$3
HOST_PORT=$4
CONTAINER_PORT=$5

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "HEALTH_URL" "$HEALTH_URL" "HOST_PORT" "$HOST_PORT" "CONTAINER_PORT" "$CONTAINER_PORT"

log_info "Starting rollback for $REPO_NAME"
update_state "ROLLBACK_STARTED"

REPO_DIR="$REPOS_DIR/$REPO_NAME"
ACTIVE_CONTAINER_FILE="$REPO_DIR/active_container.txt"
ACTIVE_IMAGE_FILE="$REPO_DIR/active_image.txt"
PREVIOUS_IMAGE_FILE="$REPO_DIR/previous_image.txt"

if [ ! -f "$PREVIOUS_IMAGE_FILE" ]; then
    log_error "No previous image found — cannot rollback"
    exit 1
fi

GOOD_IMG=$(cat "$PREVIOUS_IMAGE_FILE")
BROKEN_CONTAINER=$(cat "$ACTIVE_CONTAINER_FILE")

log_info "Rolling back from $BROKEN_CONTAINER to image $GOOD_IMG"
docker stop "$BROKEN_CONTAINER" || exit 1
docker rm "$BROKEN_CONTAINER" || exit 1

docker run -d --restart unless-stopped -p "$HOST_PORT:$CONTAINER_PORT" --name "$REPO_NAME" "$GOOD_IMG" || exit 1
echo "$REPO_NAME" > "$ACTIVE_CONTAINER_FILE"
echo "$GOOD_IMG" > "$ACTIVE_IMAGE_FILE"

./verify.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL" || exit 1

update_state "ROLLED_BACK"
log_info "Rollback completed"
exit 0