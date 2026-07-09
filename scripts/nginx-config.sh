#!/bin/bash
set -euo pipefail
. ./common.sh

REPO_NAME="$1"
HOST_PORT="$2"
DOMAIN="${3:-}"

validate_args "REPO_NAME" "$REPO_NAME" "HOST_PORT" "$HOST_PORT"

# If domain not explicitly provided, auto-generate from repo name
if [ -z "$DOMAIN" ]; then
    BASE_DOMAIN="${BASE_DOMAIN:-vinoth-sntl.uk}"
    DOMAIN=$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]')."$BASE_DOMAIN"
fi

log_info "Generating Nginx config for $DOMAIN → localhost:$HOST_PORT"

NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
CONFIG_FILE="sentinel-$(echo "$DOMAIN" | sed 's/[^a-zA-Z0-9-]/-/g').conf"
CONFIG_PATH="$NGINX_AVAILABLE/$CONFIG_FILE"

mkdir -p "$NGINX_AVAILABLE" "$NGINX_ENABLED" || { log_error "Cannot create nginx config directories"; exit 1; }

# Build server_name with all domains
SERVER_NAME="$DOMAIN"
if [ -n "${CUSTOM_DOMAINS:-}" ]; then
    IFS=',' read -ra DOMAINS <<< "$CUSTOM_DOMAINS"
    for CD in "${DOMAINS[@]}"; do
        # trim whitespace using read
        read -r CD_TRIMMED <<< "$CD"
        if [ -n "$CD_TRIMMED" ]; then
            SERVER_NAME="$SERVER_NAME $CD_TRIMMED"
        fi
    done
fi

cat > "$CONFIG_PATH" <<CFGEOF
# Sentinel - $REPO_NAME
# Generated on $(date)
server {
    listen 80;
    server_name $SERVER_NAME;

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

# Provision SSL if possible (non-blocking — app works via HTTP even if SSL fails)
SSL_OK=0
if [ -f "./provision-ssl.sh" ]; then
    CUSTOM_DOMAINS_ARGS=()
    if [ -n "${CUSTOM_DOMAINS:-}" ]; then
        IFS=',' read -ra DOMAINS <<< "$CUSTOM_DOMAINS"
        for CD in "${DOMAINS[@]}"; do
            read -r CD_TRIMMED <<< "$CD"
            if [ -n "$CD_TRIMMED" ]; then
                CUSTOM_DOMAINS_ARGS+=("$CD_TRIMMED")
            fi
        done
    fi
    if ./provision-ssl.sh "$DOMAIN" "${CUSTOM_DOMAINS_ARGS[@]}" 2>&1; then
        SSL_OK=1
        log_info "SSL provisioned for $DOMAIN"
    fi
fi

echo "$DOMAIN"
echo "SSL_OK=$SSL_OK"
exit 0
