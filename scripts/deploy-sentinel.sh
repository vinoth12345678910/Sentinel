#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="$1"
DEPLOYMENT_ID="$2"
HOST_PORT="$3"
HEALTH_PATH=$4

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "HOST_PORT" "$HOST_PORT"

SENTINEL_HOME="${SENTINEL_HOME:-/opt/Sentinel}"
SOURCE_DIR="$REPOS_DIR/$REPO_NAME/source"
BACKUP_DIR="$REPOS_DIR/$REPO_NAME/backups"
HEALTH_URL="http://localhost:$HOST_PORT$HEALTH_PATH"

log_info "Starting Sentinel self-deploy (deployment: $DEPLOYMENT_ID)"
log_info "Source: $SOURCE_DIR → $SENTINEL_HOME"

if [ ! -d "$SOURCE_DIR" ]; then
    log_error "Source directory does not exist: $SOURCE_DIR"
    update_state "FAILED_AT_DEPLOY" "Source directory missing"
    exit 1
fi

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre-deploy-$DEPLOYMENT_ID.tar.gz"

log_info "Backing up current Sentinel to $BACKUP_FILE"
tar -czf "$BACKUP_FILE" \
    --exclude="$SENTINEL_HOME/logs" \
    --exclude="$SENTINEL_HOME/node_modules" \
    --exclude="$BACKUP_DIR" \
    -C "$(dirname "$SENTINEL_HOME")" "$(basename "$SENTINEL_HOME")" 2>/dev/null || {
    log_warn "Backup failed — continuing anyway"
}

log_info "Syncing new source to $SENTINEL_HOME"
rsync -a --delete \
    --exclude='.env' \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='data/apps/*.json' \
    --exclude='repos' \
    "$SOURCE_DIR/" "$SENTINEL_HOME/" || {
    log_error "Failed to sync source to $SENTINEL_HOME"
    update_state "FAILED_AT_DEPLOY" "Source sync failed"
    exit 1
}

log_info "Installing dependencies"
cd "$SENTINEL_HOME" || exit 1
npm install --production 2>&1 | while IFS= read -r line; do log_info "npm: $line"; done
if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    log_error "npm install failed"
    update_state "FAILED_AT_DEPLOY" "npm install failed"
    exit 1
fi

chmod +x "$SENTINEL_HOME/scripts/"*.sh

log_info "Reloading Sentinel via PM2"
pm2 reload sentinel --update-env --wait-ready 2>&1 | while IFS= read -r line; do log_info "pm2: $line"; done
RELOAD_EXIT=${PIPESTATUS[0]}
if [ "$RELOAD_EXIT" -ne 0 ]; then
    log_error "PM2 reload failed (exit: $RELOAD_EXIT)"
    update_state "FAILED_AT_DEPLOY" "PM2 reload failed"
    exit 1
fi

log_info "Waiting for new Sentinel to accept connections"
sleep 3

update_state "DEPLOYED"

log_info "Verifying new Sentinel health at $HEALTH_URL"
./verify.sh "$REPO_NAME" "$DEPLOYMENT_ID" "$HEALTH_URL"
VERIFY_EXIT=$?
if [ "$VERIFY_EXIT" -ne 0 ]; then
    log_error "Health check failed — initiating rollback"
    update_state "FAILED_AT_VERIFY" "Health check failed after deploy"

    if [ -f "$BACKUP_FILE" ]; then
        log_info "Restoring backup from $BACKUP_FILE"
        tar -xzf "$BACKUP_FILE" -C "$(dirname "$SENTINEL_HOME")" || {
            log_error "Backup restore failed — manual intervention required"
            update_state "FAILED" "Backup restore failed"
            exit 1
        }
        cd "$SENTINEL_HOME" || exit 1
        npm install --production 2>/dev/null || true
        chmod +x "$SENTINEL_HOME/scripts/"*.sh
        pm2 reload sentinel --update-env --wait-ready 2>&1 || {
            log_error "PM2 reload of previous version failed"
            update_state "FAILED" "Rollback PM2 reload failed"
            exit 1
        }
        log_info "Rollback complete — previous Sentinel restored"
        update_state "ROLLED_BACK"
    else
        log_error "No backup available — cannot rollback"
        update_state "FAILED" "No backup available for rollback"
    fi
    exit 1
fi

log_info "Sentinel self-deploy completed successfully"
exit 0
