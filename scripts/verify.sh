#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="$1"
DEPLOYMENT_ID="$2"
HEALTH_URL="$3"

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "HEALTH_URL" "$HEALTH_URL"

log_info "Starting verification for $REPO_NAME at $HEALTH_URL"

update_state "VERIFYING"

REQUIRED_PASSES=3
MAX_ATTEMPTS=10
SUCCESS_COUNT=0

for ((i=1; i<=MAX_ATTEMPTS; i++))
do
    log_info "Health check attempt $i of $MAX_ATTEMPTS"

    status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")

    if [ "$status_code" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        log_info "Attempt $i: HTTP 200 (consecutive passes: $SUCCESS_COUNT)"
    else
        SUCCESS_COUNT=0
        log_warn "Attempt $i: HTTP $status_code — resetting consecutive counter"
    fi

    if [ "$SUCCESS_COUNT" -ge "$REQUIRED_PASSES" ]; then
        log_info "Verification passed — $REQUIRED_PASSES consecutive HTTP 200 responses"
        update_state "HEALTHY"
        exit 0
    fi

    if [ "$i" -lt "$MAX_ATTEMPTS" ]; then
        BACKOFF=$(( 2 ** (i > 6 ? 6 : i) ))
        BACKOFF=$(( BACKOFF > 30 ? 30 : BACKOFF ))
        JITTER=$(( RANDOM % 3 ))
        SLEEP=$(( BACKOFF + JITTER ))
        log_info "Waiting ${SLEEP}s before next attempt"
        sleep "$SLEEP"
    fi
done

log_error "Verification failed after $MAX_ATTEMPTS attempts"
update_state "FAILED_AT_VERIFY"
exit 1
