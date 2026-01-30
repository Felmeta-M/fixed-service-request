# Nginx SSL: Host proxy only

SSL is **only on the host nginx** (proxy). Docker nginx serves HTTP only.

- **Host nginx** (see `docker/nginx/host-proxy.conf.example`): listens on 80 (redirect to HTTPS) and 443 (HTTPS), holds the certificate and key, proxies to Docker nginx on `127.0.0.1:9991`.
- **Docker nginx**: listens on 80 only, serves the Laravel app via PHP-FPM. No certificate, no SSL.

## Ports

| Where   | Port | Purpose                          |
|--------|------|----------------------------------|
| Host   | 80   | HTTP → redirect to HTTPS         |
| Host   | 443  | HTTPS (SSL) → proxy to 9991      |
| Docker | 9991 | HTTP (backend for host proxy)    |

## Certificate and key

Put your **server.crt** and **server.key** on the **host** and point to them in the host nginx config (e.g. `/etc/nginx/sites-available/fixedservices.conf`). Do not put certs in Docker; the host proxy is the only place that uses them.

## Cert renewal

Renew on the host and reload host nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

No Docker nginx reload needed.
