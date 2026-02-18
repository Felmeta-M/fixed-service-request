# Nginx SSL: Host proxy only

SSL is **only on the host nginx** (proxy). Docker nginx serves HTTP only.

- **Host nginx** (see `docker/nginx/host-proxy.conf.example`): listens on 80 (redirect to HTTPS) and 443 (HTTPS), holds the certificate and key, proxies to Docker nginx.
- **Docker nginx**: listens on 80 only (ports 9991 production, 9993 staging). No certificate, no SSL.

## Ports

| Where   | Port | Purpose |
|--------|------|--------|
| Host   | 80   | HTTP → redirect to HTTPS |
| Host   | 443  | HTTPS (SSL) → proxy to backend |
| Docker | 9991 | HTTP (production backend) |
| Docker | 9993 | HTTP (staging backend) |

## Host server names

- **Production:** `fixedservices.ethiotelecom.et` → proxy to `127.0.0.1:9991`
- **Staging:** `dev.fixedservices.ethiotelecom.et` → proxy to `127.0.0.1:9993` (HTTPS required for Telebirr notify callback)

## Certificate and key

Put your **server.crt** and **server.key** on the **host** and point to them in the host nginx config. Do not put certs in Docker.

**Let's Encrypt (recommended for staging):**  
Use certbot for `dev.fixedservices.ethiotelecom.et`; typical paths:
- `ssl_certificate     /etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/fullchain.pem;`
- `ssl_certificate_key /etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/privkey.pem;`

Example: `sudo certbot certonly --nginx -d dev.fixedservices.ethiotelecom.et` (then add the server block from `host-proxy.conf.example` and reload nginx).

## Cert renewal

Renew on the host and reload host nginx:

```bash
sudo certbot renew --quiet   # if using Let's Encrypt
sudo nginx -t && sudo systemctl reload nginx
```

No Docker nginx reload needed.
