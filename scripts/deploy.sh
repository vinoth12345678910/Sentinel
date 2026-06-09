#!/bin/bash
. ./common.sh

REPO_NAME=$1
DEPLOYMENT_ID=$2
HOST_PORT=$3
CONTAINER_PORT=$4
HEALTH_PATH=$5

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "HOST_PORT" "$HOST_PORT" "CONTAINER_PORT" "$CONTAINER_PORT" "HEALTH_PATH" "$HEALTH_PATH"

log_info "Starting deploy for $REPO_NAME"

REPO_DIR="$REPOS_DIR/$REPO_NAME"
BUILDS_DIR="$REPO_DIR/builds"
BUILD_FILE="$BUILDS_DIR/current_build.txt"
ACTIVE_CONTAINER_FILE="$REPO_DIR/active_container.txt"
ACTIVE_IMAGE_FILE="$REPO_DIR/active_image.txt"
PREVIOUS_IMAGE_FILE="$REPO_DIR/previous_image.txt"
HOST_PORT_FILE="$REPO_DIR/host_port.txt"
CONTAINER_PORT_FILE="$REPO_DIR/container_port.txt"

if [ ! -f "$BUILD_FILE" ]; then
    log_error "Build file not found: $BUILD_FILE"
    update_state "FAILED_AT_DEPLOY"
    exit 1
fi

IMAGE_TAG=$(cat "$BUILD_FILE")
log_info "Current image tag: $IMAGE_TAG"

if [ -f "$ACTIVE_CONTAINER_FILE" ]; then
    OLD_CONTAINER=$(cat "$ACTIVE_CONTAINER_FILE")
    log_info "Old container found: $OLD_CONTAINER"

    if docker inspect "$OLD_CONTAINER" > /dev/null 2>&1; then
        OLD_IMAGE=$(cat "$ACTIVE_IMAGE_FILE")
        echo "$OLD_IMAGE" > "$PREVIOUS_IMAGE_FILE"
        docker stop "$OLD_CONTAINER" || { update_state "FAILED_AT_DEPLOY"; exit 1; }
        docker rm "$OLD_CONTAINER" || { update_state "FAILED_AT_DEPLOY"; exit 1; }
    else
        log_warn "Old container '$OLD_CONTAINER' not found — skipping stop/rm"
    fi

    docker run -d --restart unless-stopped -p "$HOST_PORT:$CONTAINER_PORT" --name "$REPO_NAME" "$IMAGE_TAG" || { update_state "FAILED_AT_DEPLOY"; exit 1; }
    echo "$REPO_NAME" > "$ACTIVE_CONTAINER_FILE"
    echo "$IMAGE_TAG" > "$ACTIVE_IMAGE_FILE"
else
    log_info "No active container found. First deployment."
    docker run -d --restart unless-stopped -p "$HOST_PORT:$CONTAINER_PORT" --name "$REPO_NAME" "$IMAGE_TAG" || { update_state "FAILED_AT_DEPLOY"; exit 1; }
    echo "$REPO_NAME" > "$ACTIVE_CONTAINER_FILE"
    echo "$IMAGE_TAG" > "$ACTIVE_IMAGE_FILE"
fi

echo "$HOST_PORT" > "$HOST_PORT_FILE"
echo "$CONTAINER_PORT" > "$CONTAINER_PORT_FILE"
echo "$HEALTH_PATH" > "$REPO_DIR/health_path.txt"

update_state "DEPLOYED"
log_info "Deploy completed successfully"
exit 0
