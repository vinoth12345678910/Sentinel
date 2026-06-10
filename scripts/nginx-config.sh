#!/bin/bash
set -e
. ./common.sh

REPO_NAME=$1
HOST_PORT=$2
DOMAIN_ARGS=$3

validate_args "REPO_NAME" "$REPO_NAME" "HOST_PORT" "$HOST_PORT"

log_info "Generating Nginx config for $REPO_NAME on port $HOST_PORT"

NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

CONFIG_FILE="sentinel-$REPO_NAME.conf"
CONFIG_PATH="$NGINX_AVAILABLE/$CONFIG_FILE"

# Parse domain arguments: domain1:ssl_flag,domain2:ssl_flag,...
DOMAINS=()
SSL_DOMAINS=()
HTTP_DOMAINS=()
if [ -n "$DOMAIN_ARGS" ]; then
    IFS=',' read -ra ENTRIES <<< "$DOMAIN_ARGS"
    for entry in "${ENTRIES[@]}"; do
        domain="${entry%%:*}"
        ssl_flag="${entry##*:}"
        DOMAINS+=("$domain")
        if [ "$ssl_flag" = "1" ]; then
            SSL_DOMAINS+=("$domain")
        else
            HTTP_DOMAINS+=("$domain")
        fi
    done
fi

if [ ${#DOMAINS[@]} -eq 0 ]; then
    DEFAULT_DOMAIN="${REPO_NAME,,}.vinoth-sntl.uk"
    DOMAINS+=("$DEFAULT_DOMAIN")
    HTTP_DOMAINS+=("$DEFAULT_DOMAIN")
fi

SERVER_NAMES=$(IFS=' '; echo "${DOMAINS[*]}")
log_info "Domains: $SERVER_NAMES"

# Generate SSL configs for each SSL domain
SSL_SERVER_BLOCKS=""
for domain in "${SSL_DOMAINS[@]}"; do
    SSL_CERT="/etc/letsencrypt/live/$domain/fullchain.pem"
    SSL_KEY="/etc/letsencrypt/live/$domain/privkey.pem"
    if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
        SSL_SERVER_BLOCKS+="
server {
    listen 443 ssl http2;
    server_name $domain;

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
"
    fi
done

HAS_SSL=${#SSL_DOMAINS[@]}
HAS_HTTP=${#HTTP_DOMAINS[@]}

cat > "$CONFIG_PATH" <<CFGEOF
# Sentinel - $REPO_NAME
# Generated on $(date)

CFGEOF

if [ "$HAS_SSL" -gt 0 ] && [ "$HAS_HTTP" -gt 0 ]; then
    # HTTP redirect for non-SSL domains + SSL blocks
    cat >> "$CONFIG_PATH" <<CFGEOF
server {
    listen 80;
    server_name $(IFS=' '; echo "${HTTP_DOMAINS[*]}");
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

$SSL_SERVER_BLOCKS
CFGEOF
elif [ "$HAS_SSL" -gt 0 ]; then
    # All domains have SSL -> redirect all HTTP to HTTPS
    cat >> "$CONFIG_PATH" <<CFGEOF
server {
    listen 80;
    server_name $SERVER_NAMES;
    return 301 https://\$server_name\$request_uri;
}

$SSL_SERVER_BLOCKS
CFGEOF
else
    # No SSL -> plain HTTP
    cat >> "$CONFIG_PATH" <<CFGEOF
server {
    listen 80;
    server_name $SERVER_NAMES;
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
CFGEOF
fi

ln -sf "$CONFIG_PATH" "$NGINX_ENABLED/$CONFIG_FILE"

nginx -t 2>&1 || {
    log_error "Nginx configuration test failed for $REPO_NAME"
    rm -f "$NGINX_ENABLED/$CONFIG_FILE"
    exit 1
}

systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || log_warn "Could not reload nginx — reload manually"

log_info "Nginx config generated and loaded for $REPO_NAME"
exit 0
