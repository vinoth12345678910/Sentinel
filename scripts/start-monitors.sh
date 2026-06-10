#!/bin/bash
set -euo pipefail
#!/bin/bash
# PM2-managed supervisor that keeps per-app monitors alive
# Spawns monitor.sh for each deployed app and restarts on failure

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/common.sh"

log_info "Monitor supervisor started"

while true; do
    for app_dir in "$REPOS_DIR"/*/; do
        [ -d "$app_dir" ] || continue
        APP_NAME=$(basename "$app_dir")
        MONITOR_PID_FILE="$app_dir/.monitor.pid"
        HOST_PORT_FILE="$app_dir/host_port.txt"

        [ -f "$HOST_PORT_FILE" ] || continue

        if [ -f "$MONITOR_PID_FILE" ]; then
            OLD_PID=$(cat "$MONITOR_PID_FILE")
            if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
                continue
            fi
        fi

        HOST_PORT=$(cat "$HOST_PORT_FILE")
        HEALTH_PATH_FILE="$app_dir/health_path.txt"
        HEALTH_PATH=$(cat "$HEALTH_PATH_FILE" 2>/dev/null || echo "/health")
        HEALTH_URL="http://localhost:$HOST_PORT$HEALTH_PATH"

        nohup "$SCRIPT_DIR/monitor.sh" "$APP_NAME" "$HEALTH_URL" > /dev/null 2>&1 &
        PID=$!
        echo "$PID" > "$MONITOR_PID_FILE"
        log_info "Started monitor for $APP_NAME (PID $PID)"
    done

    sleep 60
done
