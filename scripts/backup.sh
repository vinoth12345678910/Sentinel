#!/bin/bash
. ./common.sh

REPO_NAME=$1

validate_args "REPO_NAME" "$REPO_NAME"

log_info "Starting backup for $REPO_NAME"

REPO_DIR="$REPOS_DIR/$REPO_NAME"
BACKUP_DIR="$REPO_DIR/backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

ARCHIVE_NAME="backup-$TIMESTAMP.tar.gz"

tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" --exclude="backups" "$REPO_DIR" || exit 1

cd "$BACKUP_DIR" || exit 1

ls -tp *.tar.gz | tail -n +6 | xargs -r rm --

exit 0