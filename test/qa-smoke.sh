#!/bin/bash
set -euo pipefail

# QA Smoke Test — validates deploy.sh non-root container support
# Run: bash test/qa-smoke.sh
# or via: npm test (called from verify-build.js)

PASS=0
FAIL=0
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/scripts/deploy.sh"

assert() {
  local name="$1" cond="$2"
  if eval "$cond"; then
    echo "  PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=== QA Smoke Test: Non-Root Container Support ==="
echo ""

# 1. deploy.sh exists
assert "deploy.sh exists" "[ -f '$DEPLOY_SCRIPT' ]"

# 2. tmpfs mount for /var/cache/nginx present
assert "tmpfs /var/cache/nginx:uid=1000" \
  "grep -q '/var/cache/nginx:uid=1000' '$DEPLOY_SCRIPT'"

# 3. tmpfs mount for /var/run present
assert "tmpfs /var/run:uid=1000" \
  "grep -q '/var/run:uid=1000' '$DEPLOY_SCRIPT'"

# 4. tmpfs mount for /tmp present
assert "tmpfs /tmp:uid=1000" \
  "grep -q '/tmp:uid=1000' '$DEPLOY_SCRIPT'"

# 5. --user=1000:1000 present
assert "--user=1000:1000 present" \
  "grep -q -- '--user=1000:1000' '$DEPLOY_SCRIPT'"

# 6. --security-opt=no-new-privileges present
assert "no-new-privileges present" \
  "grep -q 'no-new-privileges:true' '$DEPLOY_SCRIPT'"

# 7. --cap-drop=ALL present
assert "cap-drop=ALL present" \
  "grep -q 'cap-drop=ALL' '$DEPLOY_SCRIPT'"

# 8. --cap-add=NET_BIND_SERVICE present (allows binding to privileged ports)
assert "cap-add=NET_BIND_SERVICE present" \
  "grep -q 'NET_BIND_SERVICE' '$DEPLOY_SCRIPT'"

# 9. Memory limit present
assert "memory limit present" \
  "grep -q -- '--memory=.512m.' '$DEPLOY_SCRIPT'"

# 10. CPU limit present
assert "CPU limit present" \
  "grep -q -- '--cpus=.1.0.' '$DEPLOY_SCRIPT'"

# 11. ENV_FILE readability check
assert "ENV_FILE readable check added" \
  "grep -q 'ENV_FILE.*-r' '$DEPLOY_SCRIPT'"

# 12. State file writes protected with update_state
assert "active_container_file write protected" \
  "grep -q 'update_state.*active_container_file' '$DEPLOY_SCRIPT'"

# 13. rollback.sh has update_state on failure
ROLLBACK_SCRIPT="$SCRIPT_DIR/scripts/rollback.sh"
assert "rollback.sh has update_state for missing image" \
  "grep -q 'No previous image' '$ROLLBACK_SCRIPT'"
assert "rollback.sh checks ACTIVE_CONTAINER_FILE exists" \
  "grep -q 'No active container file' '$ROLLBACK_SCRIPT'"
assert "rollback.sh uses docker rm -f" \
  "grep -q 'docker rm -f' '$ROLLBACK_SCRIPT'"
assert "rollback.sh calls update_state on docker run failure" \
  "grep -q 'update_state.*docker run' '$ROLLBACK_SCRIPT'"

# 14. common.sh uses safe JSON builder (jq or python3)
COMMON_SCRIPT="$SCRIPT_DIR/scripts/common.sh"
assert "common.sh uses _build_json helper" \
  "grep -q '_build_json' '$COMMON_SCRIPT'"
assert "common.sh prefers jq for JSON" \
  "grep -q 'command -v jq' '$COMMON_SCRIPT'"
assert "common.sh falls back to python3 for JSON" \
  "grep -q 'command -v python3' '$COMMON_SCRIPT'"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
exit $((FAIL > 0 ? 1 : 0))
