# SSL (unused when using host proxy)

When you use **host nginx as proxy** (see `host-proxy.conf.example`), the certificate and key live **only on the host**—not in Docker.

This folder is not used in that setup. You can leave it empty or remove it. Certs are configured in the host nginx config (e.g. `ssl_certificate` and `ssl_certificate_key` in `/etc/nginx/sites-available/fixedservices.conf`).
