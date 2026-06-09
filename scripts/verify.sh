#!/bin/bash
. ./common.sh

REPO_NAME=$1
DEPLOYMENT_ID=$2
HEALTH_URL=$3

validate_args "REPO_NAME" "$REPO_NAME" "DEPLOYMENT_ID" "$DEPLOYMENT_ID" "HEALTH_URL" "$HEALTH_URL"

log_info "Starting verification for $REPO_NAME at $HEALTH_URL"

SUCCESS_COUNT=0

for ((i=1; i<=5; i++))
do
    log_info "Health check attempt $i"

    status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$HEALTH_URL")

    if [ "$status_code" = "200" ]; then
        ((SUCCESS_COUNT++))
        log_info "Attempt $i: 200 (consecutive: $SUCCESS_COUNT)"
    else
        SUCCESS_COUNT=0
        log_warn "Attempt $i: got $status_code"
    fi

    if [ "$SUCCESS_COUNT" -eq 3 ]; then
        log_info "Verification succeeded — 3 consecutive 200 responses"
        update_state "HEALTHY"
        exit 0
    fi

    sleep 3
done

log_error "Verification failed after 5 attempts"
update_state "FAILED_AT_VERIFY"
exit 1