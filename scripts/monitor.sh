#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="${1:-}"
HEALTH_URL="${2:-}"

validate_args "REPO_NAME" "$REPO_NAME" "HEALTH_URL" "$HEALTH_URL"

log_info "Starting monitor for $REPO_NAME at $HEALTH_URL"

REPO_DIR="$REPOS_DIR/$REPO_NAME"
MONITOR_DIR="$REPO_DIR/monitor"
PREVIOUS_IMAGE_FILE="$REPO_DIR/previous_image.txt"
HOST_PORT_FILE="$REPO_DIR/host_port.txt"
CONTAINER_PORT_FILE="$REPO_DIR/container_port.txt"

ACTIVE_CONTAINER_FILE="$REPO_DIR/active_container.txt"
FAILURE_COUNT_FILE="$MONITOR_DIR/failure_count.txt"
ROLLBACK_COUNT_FILE="$MONITOR_DIR/rollback_count.txt"

mkdir -p "$MONITOR_DIR"

if [ ! -f "$FAILURE_COUNT_FILE" ]; then
    echo "0" > "$FAILURE_COUNT_FILE"
fi

if [ ! -f "$ROLLBACK_COUNT_FILE" ]; then
    echo "0" > "$ROLLBACK_COUNT_FILE"
fi

while true
do
    if [ ! -f "$ACTIVE_CONTAINER_FILE" ]; then
        sleep 30
        continue
    fi

    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$HEALTH_URL")

    FAILURE_COUNT=$(cat "$FAILURE_COUNT_FILE")

    if [ "$STATUS_CODE" = "200" ]; then
        echo "0" > "$FAILURE_COUNT_FILE"
    else
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        echo "$FAILURE_COUNT" > "$FAILURE_COUNT_FILE"

        if [ "$FAILURE_COUNT" -ge 5 ]; then
            ROLLBACK_COUNT=$(cat "$ROLLBACK_COUNT_FILE")
            if [ "$ROLLBACK_COUNT" -ge 3 ]; then
                log_error "Max rollbacks reached ($ROLLBACK_COUNT) — stopping monitor"
                exit 1
            fi

            if [ ! -f "$PREVIOUS_IMAGE_FILE" ]; then
                log_error "No previous image to rollback to — stopping monitor"
                exit 1
            fi

            ROLLBACK_COUNT=$((ROLLBACK_COUNT + 1))
            echo "$ROLLBACK_COUNT" > "$ROLLBACK_COUNT_FILE"

            HOST_PORT=$(cat "$HOST_PORT_FILE" 2>/dev/null || echo "3000")
            CONTAINER_PORT=$(cat "$CONTAINER_PORT_FILE" 2>/dev/null || echo "3000")
            ./rollback.sh "$REPO_NAME" "monitor-triggered" "$HEALTH_URL" "$HOST_PORT" "$CONTAINER_PORT"
            echo "0" > "$FAILURE_COUNT_FILE"
        fi
    fi

    sleep 30
done
