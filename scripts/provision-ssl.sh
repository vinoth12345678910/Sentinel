#!/bin/bash
set -euo pipefail

# provision-ssl.sh — provisions Let's Encrypt SSL via Certbot for one or more domains
# Usage: ./provision-ssl.sh <primary-domain> [additional-domain ...]
# Exits 0 on success, 1 on failure (deployment continues regardless)

PRIMARY_DOMAIN="${1:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

log_info() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  $1"; }
log_warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  $1"; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"; }

if [ -z "$PRIMARY_DOMAIN" ]; then
    log_error "No primary domain provided"
    exit 1
fi

ALL_DOMAINS="$PRIMARY_DOMAIN"
ADDITIONAL_DOMAINS=""
shift || true
for AD in "$@"; do
    if [ -n "$AD" ]; then
        ADDITIONAL_DOMAINS="$ADDITIONAL_DOMAINS $AD"
        ALL_DOMAINS="$ALL_DOMAINS $AD"
    fi
done

log_info "Provisioning SSL for: $ALL_DOMAINS"

# Build certbot args using array
CERTBOT_ARGS=(--nginx -d "$PRIMARY_DOMAIN")
if [ -n "$ADDITIONAL_DOMAINS" ]; then
    read -ra DOMAIN_PARTS <<< "$ADDITIONAL_DOMAINS"
    for AD in "${DOMAIN_PARTS[@]}"; do
        if [ -n "$AD" ]; then
            CERTBOT_ARGS+=(-d "$AD")
        fi
    done
fi

# Check if cert already exists and is valid for the primary domain
CERT_FILE="/etc/letsencrypt/live/$PRIMARY_DOMAIN/fullchain.pem"
if [ -f "$CERT_FILE" ]; then
    if openssl x509 -checkend $((30 * 86400)) -noout -in "$CERT_FILE" 2>/dev/null; then
        log_info "Valid SSL certificate already exists for $PRIMARY_DOMAIN — skipping"
        exit 0
    fi
    log_info "Existing certificate for $PRIMARY_DOMAIN expires soon — renewing"
fi

if [ -z "$CERTBOT_EMAIL" ]; then
    log_warn "CERTBOT_EMAIL not set — skipping SSL provisioning"
    exit 0
fi

# Run certbot
if certbot "${CERTBOT_ARGS[@]}" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" 2>&1; then
    log_info "SSL provisioned successfully for: $ALL_DOMAINS"
    exit 0
else
    log_error "SSL provisioning failed for: $ALL_DOMAINS — app still accessible via HTTP"
    exit 1
fi
