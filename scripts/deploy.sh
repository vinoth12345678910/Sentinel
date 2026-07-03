#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="${1:-}"
DEPLOYMENT_ID="${2:-}"
HOST_PORT="${3:-}"
CONTAINER_PORT="${4:-}"
HEALTH_PATH="${5:-}"
ENV_FILE="${6:-}"

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

# Save previous image info before deploying new one
if [ -f "$ACTIVE_CONTAINER_FILE" ]; then
    OLD_CONTAINER=$(cat "$ACTIVE_CONTAINER_FILE")
    if docker inspect "$OLD_CONTAINER" > /dev/null 2>&1; then
        if [ -f "$ACTIVE_IMAGE_FILE" ]; then
            OLD_IMAGE=$(cat "$ACTIVE_IMAGE_FILE")
            echo "$OLD_IMAGE" > "$PREVIOUS_IMAGE_FILE"
            log_info "Saved previous image: $OLD_IMAGE"
        fi
        docker rm -f "$OLD_CONTAINER" || { update_state "FAILED_AT_DEPLOY"; exit 1; }
        log_info "Removed old container: $OLD_CONTAINER"
    else
        log_warn "Old container '$OLD_CONTAINER' not found — skipping stop/rm"
    fi
else
    log_info "No active container found. First deployment."
fi

DOCKER_OPTS=(-d --restart unless-stopped -p "$HOST_PORT:$CONTAINER_PORT" --name "$REPO_NAME" \
  --memory="512m" --cpus="1.0" \
  --security-opt=no-new-privileges:true \
  --cap-drop=ALL --cap-add=NET_BIND_SERVICE \
  --user=1000:1000)
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
    DOCKER_OPTS+=(--env-file "$ENV_FILE")
    log_info "Using env file: $ENV_FILE"
fi
docker run "${DOCKER_OPTS[@]}" "$IMAGE_TAG" || { update_state "FAILED_AT_DEPLOY"; exit 1; }

echo "$REPO_NAME" > "$ACTIVE_CONTAINER_FILE"
echo "$IMAGE_TAG" > "$ACTIVE_IMAGE_FILE"
echo "$HOST_PORT" > "$HOST_PORT_FILE"
echo "$CONTAINER_PORT" > "$CONTAINER_PORT_FILE"
echo "$HEALTH_PATH" > "$REPO_DIR/health_path.txt"

update_state "DEPLOYED"
log_info "Deploy completed successfully"
exit 0
