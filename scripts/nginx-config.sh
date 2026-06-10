#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="$1"
HOST_PORT="$2"
HEALTH_PATH="${3:-/health}"

validate_args "REPO_NAME" "$REPO_NAME" "HOST_PORT" "$HOST_PORT"

BASE_DOMAIN="${BASE_DOMAIN:-vinoth-sntl.uk}"
DOMAIN=$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]')."$BASE_DOMAIN"

log_info "Generating Nginx config for $DOMAIN → localhost:$HOST_PORT"

NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
CONFIG_FILE="sentinel-$REPO_NAME.conf"
CONFIG_PATH="$NGINX_AVAILABLE/$CONFIG_FILE"

mkdir -p "$NGINX_AVAILABLE" "$NGINX_ENABLED"

cat > "$CONFIG_PATH" <<CFGEOF
# Sentinel - $REPO_NAME
# Generated on $(date)
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:$HOST_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
    }
}
CFGEOF

ln -sf "$CONFIG_PATH" "$NGINX_ENABLED/$CONFIG_FILE"

nginx -t 2>&1 || {
    log_error "Nginx config test failed for $DOMAIN"
    rm -f "$NGINX_ENABLED/$CONFIG_FILE"
    exit 1
}

systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || log_warn "Could not reload nginx — reload manually"

log_info "Nginx config live: http://$DOMAIN → localhost:$HOST_PORT"
echo "$DOMAIN"
exit 0
