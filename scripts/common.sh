# shared logging, validation and state updates
# source: . ./common.sh

REPOS_DIR="${REPOS_DIR:-/repos}"
: "${DEPLOYMENT_ID:=-}"

log_info()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  [$DEPLOYMENT_ID] $1"; }
log_warn()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  [$DEPLOYMENT_ID] $1"; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] [$DEPLOYMENT_ID] $1"; }

validate_args() {
  while [ "$#" -gt 0 ]; do
    name="$1"
    value="$2"
    shift 2
    if [ -z "$value" ]; then
      log_error "Missing required argument: $name"
      exit 1
    fi
  done
}

_build_json() {
  if command -v jq >/dev/null 2>&1; then
    if [ -n "${2:-}" ]; then
      jq -n --arg s "$1" --arg r "$2" '{state: $s, failure_reason: $r}' 2>/dev/null
    else
      jq -n --arg s "$1" '{state: $s}' 2>/dev/null
    fi
  elif command -v python3 >/dev/null 2>&1; then
    if [ -n "${2:-}" ]; then
      STATE="$1" REASON="$2" python3 -c "import os,json,sys; sys.stdout.write(json.dumps({'state':os.environ['STATE'],'failure_reason':os.environ['REASON']}))" 2>/dev/null
    else
      STATE="$1" python3 -c "import os,json,sys; sys.stdout.write(json.dumps({'state':os.environ['STATE']}))" 2>/dev/null
    fi
  fi
}

update_state() {
  state="$1"
  failure_reason="${2:-}"
  if [ -n "${BACKEND_URL:-}" ] && [ -n "${SENTINEL_API_KEY:-}" ] && [ -n "${DEPLOYMENT_ID:-}" ]; then
    json_data=$(_build_json "$state" "$failure_reason")
    if [ -z "$json_data" ]; then
      log_error "Failed to build JSON payload for update_state"
      return
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
