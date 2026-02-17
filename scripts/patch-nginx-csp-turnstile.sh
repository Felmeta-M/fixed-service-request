#!/usr/bin/env bash
# Patch /etc/nginx/conf.d/fbb.conf so script-src-elem allows Cloudflare Turnstile.
# Run on the server: sudo bash scripts/patch-nginx-csp-turnstile.sh
# Then: sudo nginx -t && sudo systemctl reload nginx

set -e
CONF=/etc/nginx/conf.d/fbb.conf

# If script-src-elem already includes challenges.cloudflare.com, do nothing
if grep -q "script-src-elem.*challenges.cloudflare.com" "$CONF" 2>/dev/null; then
    echo "CSP script-src-elem already includes challenges.cloudflare.com. No change needed."
    exit 0
fi

# Add https://challenges.cloudflare.com to script-src-elem (before the semicolon after recaptcha.net)
# Pattern: ... https://www.recaptcha.net;  -> ... https://www.recaptcha.net https://challenges.cloudflare.com;
if grep -q "script-src-elem" "$CONF" 2>/dev/null; then
    sudo sed -i 's|https://www.recaptcha.net; style-src|https://www.recaptcha.net https://challenges.cloudflare.com; style-src|g' "$CONF"
    echo "Patched script-src-elem in $CONF to include https://challenges.cloudflare.com"
else
    echo "No script-src-elem found in $CONF. Add the full CSP line from nginx-fbb-csp-merged.conf manually."
    exit 1
fi
