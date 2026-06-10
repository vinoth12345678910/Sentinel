#!/bin/bash
set -e
. ./common.sh

REPO_NAME=$1
HOST_PORT=$2
DOMAIN=$3

validate_args "REPO_NAME" "$REPO_NAME" "HOST_PORT" "$HOST_PORT"

log_info "Generating Nginx config for $REPO_NAME on port $HOST_PORT"

NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

CONFIG_FILE="sentinel-$REPO_NAME.conf"
CONFIG_PATH="$NGINX_AVAILABLE/$CONFIG_FILE"

if [ -z "$DOMAIN" ]; then
    DOMAIN="${REPO_NAME,,}.vinoth-sntl.uk"
fi

log_info "Using domain: $DOMAIN"

HTTP_BLOCK="server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 5M;

    location / {
        proxy_pass http://localhost:$HOST_PORT;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Host \$host;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}"

SSL_CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    log_info "SSL certificate found for $DOMAIN — generating HTTPS config"

    cat > "$CONFIG_PATH" <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 5M;

    location / {
        proxy_pass http://localhost:$HOST_PORT;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Host \$host;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}
EOF
else
    log_info "No SSL certificate found for $DOMAIN — generating HTTP-only config"
    echo "$HTTP_BLOCK" > "$CONFIG_PATH"
fi

ln -sf "$CONFIG_PATH" "$NGINX_ENABLED/$CONFIG_FILE"

nginx -t 2>&1 || {
    log_error "Nginx configuration test failed for $REPO_NAME"
    rm -f "$NGINX_ENABLED/$CONFIG_FILE"
    exit 1
}

systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || log_warn "Could not reload nginx — reload manually"

log_info "Nginx config generated and loaded for $DOMAIN → localhost:$HOST_PORT"
exit 0
