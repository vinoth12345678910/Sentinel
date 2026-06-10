# shared logging, validation and state updates
# source: . ./common.sh

REPOS_DIR="${REPOS_DIR:-/repos}"
: "${DEPLOYMENT_ID:=-}"

log_info()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  [$DEPLOYMENT_ID] $1"; }
log_warn()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  [$DEPLOYMENT_ID] $1"; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] [$DEPLOYMENT_ID] $1"; }

validate_args() {
  while [ $# -gt 0 ]; do
    name="$1"
    value="$2"
    shift 2
    if [ -z "$value" ]; then
      log_error "Missing required argument: $name"
      exit 1
    fi
  done
}

update_state() {
  state="$1"
  failure_reason="$2"
  if [ -n "$BACKEND_URL" ] && [ -n "$SENTINEL_API_KEY" ] && [ -n "$DEPLOYMENT_ID" ]; then
    json_data="{\"state\":\"$state\"}"
    if [ -n "$failure_reason" ]; then
      json_data="{\"state\":\"$state\",\"failure_reason\":\"$failure_reason\"}"
    fi
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BACKEND_URL/deployments/$DEPLOYMENT_ID/state" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $SENTINEL_API_KEY" \
      -d "$json_data")
    if [ "$http_code" != "200" ]; then
      log_warn "update_state ($state) returned HTTP $http_code"
    fi
  fi
}
