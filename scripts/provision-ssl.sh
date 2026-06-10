#!/bin/bash
set -euo pipefail

# provision-ssl.sh — provisions Let's Encrypt SSL via Certbot for a domain
# Usage: ./provision-ssl.sh <domain>
# Exits 0 on success, 1 on failure (deployment continues regardless)

DOMAIN="$1"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

log_info() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  $1"; }
log_warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  $1"; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"; }

if [ -z "$DOMAIN" ]; then
    log_error "No domain provided"
    exit 1
fi

log_info "Provisioning SSL for $DOMAIN"

# Check if cert already exists and is valid
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    # Check if cert expires more than 30 days from now
    if openssl x509 -checkend $((30 * 86400)) -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null; then
        log_info "Valid SSL certificate already exists for $DOMAIN — skipping"
        exit 0
    fi
    log_info "Existing certificate for $DOMAIN expires soon — renewing"
fi

if [ -z "$CERTBOT_EMAIL" ]; then
    log_warn "CERTBOT_EMAIL not set — skipping SSL provisioning"
    exit 0
fi

# Run certbot
if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" 2>&1; then
    log_info "SSL provisioned successfully for $DOMAIN"
    exit 0
else
    log_error "SSL provisioning failed for $DOMAIN — app still accessible via HTTP"
    exit 1
fi
