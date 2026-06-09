#!/bin/bash
. ./common.sh

REPO_NAME=$1
REPO_URL=$2
COMMIT_HASH=$3
DEPLOYMENT_ID=$4

validate_args "REPO_NAME" "$REPO_NAME" "REPO_URL" "$REPO_URL" "COMMIT_HASH" "$COMMIT_HASH" "DEPLOYMENT_ID" "$DEPLOYMENT_ID"

log_info "Starting clone/pull for $REPO_NAME"

PATH_DIR="$REPOS_DIR/$REPO_NAME/source"
LOG_DIR="$REPOS_DIR/$REPO_NAME/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/sentinel.log"

if [[ -d "$PATH_DIR" ]]; then
    log_info "Repository exists. Pulling latest changes"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] [$DEPLOYMENT_ID] Repository already exists. Pulling latest changes of repo:$REPO_NAME" >> $LOG_FILE

    cd "$PATH_DIR" || { update_state "FAILED_AT_CLONE"; exit 1; }
    git fetch origin || { update_state "FAILED_AT_CLONE"; exit 1; }
    git checkout main || { update_state "FAILED_AT_CLONE"; exit 1; }
    git reset --hard origin/main || { update_state "FAILED_AT_CLONE"; exit 1; }
    git checkout "$COMMIT_HASH" || { update_state "FAILED_AT_CLONE"; exit 1; }

else
    log_info "Repository does not exist. Cloning"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] [$DEPLOYMENT_ID] Repository does not exist. Cloning of repo:$REPO_NAME" >> $LOG_FILE

    mkdir -p "$REPOS_DIR/$REPO_NAME"
    git clone "$REPO_URL" "$PATH_DIR" || { update_state "FAILED_AT_CLONE"; exit 1; }

    cd "$PATH_DIR" || { update_state "FAILED_AT_CLONE"; exit 1; }
    git checkout "$COMMIT_HASH" || { update_state "FAILED_AT_CLONE"; exit 1; }
fi

update_state "CLONED"
log_info "Clone/pull completed successfully"
exit 0
