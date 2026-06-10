#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="$1"
DEPLOYMENT_ID="$2"

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID"

log_info "Starting build for $REPO_NAME"

IMAGE_NAME=$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]')
IMAGE_TAG="$IMAGE_NAME:$DEPLOYMENT_ID"

SOURCE_DIR="$REPOS_DIR/$REPO_NAME/source"
BUILDS_DIR="$REPOS_DIR/$REPO_NAME/builds"

mkdir -p "$BUILDS_DIR"

cd "$SOURCE_DIR" || { update_state "FAILED_AT_BUILD"; exit 1; }

docker build -t "$IMAGE_TAG" . || { update_state "FAILED_AT_BUILD"; exit 1; }

BUILD_FILE="$BUILDS_DIR/current_build.txt"
echo "$IMAGE_TAG" > "$BUILD_FILE"

cd "$BUILDS_DIR" || { update_state "FAILED_AT_BUILD"; exit 1; }

tar -czvf "$BUILDS_DIR/$DEPLOYMENT_ID.tar.gz" "$SOURCE_DIR" || { update_state "FAILED_AT_BUILD"; exit 1; }

update_state "BUILT"
log_info "Build completed successfully"
exit 0
