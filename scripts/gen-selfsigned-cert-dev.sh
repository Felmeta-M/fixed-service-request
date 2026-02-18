#!/usr/bin/env bash
# Generate a self-signed certificate for dev.fixedservices.ethiotelecom.et (host-only, no DNS/Let's Encrypt).
# Run on the HOST (with sudo) when you cannot use any DNS provider.
# See docs/HOST_NGINX_SETUP.md "Option D — Host-only: self-signed cert".

set -e
DOMAIN="dev.fixedservices.ethiotelecom.et"
DIR="${1:-/etc/nginx/ssl/selfsigned}"

echo "Creating $DIR and generating self-signed cert for $DOMAIN (valid 10 years, with SAN for browsers)."
sudo mkdir -p "$DIR"
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout "$DIR/${DOMAIN}.key" \
  -out    "$DIR/${DOMAIN}.crt" \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN"
sudo chmod 600 "$DIR/${DOMAIN}.key"

echo "Done. Cert: $DIR/${DOMAIN}.crt  Key: $DIR/${DOMAIN}.key"
echo "In Nginx set: ssl_certificate $DIR/${DOMAIN}.crt; ssl_certificate_key $DIR/${DOMAIN}.key;"
