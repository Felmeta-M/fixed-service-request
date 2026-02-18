# Host Nginx Setup — SSL and External Access

This doc explains how **external traffic** reaches the app and how to configure **host Nginx** (SSL + reverse proxy). SSL and public ports live **only on the host**; Docker runs HTTP internally.

---

## 1. How external traffic reaches the app

```
Internet (users, Telebirr, etc.)
         │
         │  HTTPS :443  (or HTTP :80 → redirect to HTTPS)
         ▼
   ┌─────────────────────────────────────┐
   │  HOST NGINX (this machine)           │
   │  - Listens: 80, 443                  │
   │  - SSL certificate lives here        │
   │  - Decrypts HTTPS, forwards HTTP     │
   └─────────────────────────────────────┘
         │
         │  HTTP to localhost only (not exposed to internet)
         │  Production → 127.0.0.1:9991   Staging → 127.0.0.1:9993
         ▼
   ┌─────────────────────────────────────┐
   │  DOCKER NGINX (inside container)     │
   │  - Listens: 80 (mapped to 9991/9993) │
   │  - No SSL, no certificate            │
   │  - Proxies to PHP-FPM                │
   └─────────────────────────────────────┘
         │
         ▼
   Laravel app (PHP-FPM)
```

**Summary**

| Side        | Port | Who connects                    |
|------------|------|----------------------------------|
| **External** | 80   | Users, Telebirr → host (then redirect to 443) |
| **External** | 443  | Users, Telebirr → host Nginx (SSL)             |
| **Internal** | 9991 | Host Nginx → Docker (production)               |
| **Internal** | 9993 | Host Nginx → Docker (staging)                  |

Docker ports 9991 and 9993 are **not** required to be open to the internet; only host 80/443 need to be.

---

## 2. Host Nginx: what to configure

| Server name (Host header)     | SSL cert (on host)        | Proxy to (on same machine) |
|------------------------------|---------------------------|-----------------------------|
| `fixedservices.ethiotelecom.et`   | Your production cert      | `http://127.0.0.1:9991`     |
| `dev.fixedservices.ethiotelecom.et` | Let's Encrypt (see below) | `http://127.0.0.1:9993`     |

- **Port 80:** For each server name, return `301` to `https://<same host>`.
- **Port 443:** Use the cert for that server name and `proxy_pass` to the correct local port (9991 or 9993).

---

## 3. Step-by-step setup

### 3.1 Install Nginx on the host (if not already)

```bash
# Debian/Ubuntu
sudo apt update && sudo apt install -y nginx

# Enable and start
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3.2 Copy the example config

```bash
sudo cp docker/nginx/host-proxy.conf.example /etc/nginx/sites-available/fixedservices.conf
sudo ln -s /etc/nginx/sites-available/fixedservices.conf /etc/nginx/sites-enabled/
```

### 3.3 Production: set SSL certificate paths

Edit `/etc/nginx/sites-available/fixedservices.conf` and set the **production** server block (first HTTPS block):

- `ssl_certificate`     → path to your production fullchain/crt.
- `ssl_certificate_key` → path to your production private key.

Example (replace with your real paths):

```nginx
ssl_certificate     /path/to/fixedservices.ethiotelecom.et/fullchain.pem;
ssl_certificate_key /path/to/fixedservices.ethiotelecom.et/privkey.pem;
```

### 3.4 Staging: get Let's Encrypt cert and keep default paths

For **dev.fixedservices.ethiotelecom.et** the example already points to Let's Encrypt paths. Get the cert on the host:

```bash
# Install certbot if needed (Debian/Ubuntu)
sudo apt install -y certbot python3-certbot-nginx

# Get cert (Nginx must be running and port 80 open; DNS must point to this host)
sudo certbot certonly --nginx -d dev.fixedservices.ethiotelecom.et
```

Cert and key will be at:

- `/etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/fullchain.pem`
- `/etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/privkey.pem`

The example config already uses these paths for the staging HTTPS server.

### 3.5 Test and reload Nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 3.6 Ensure Docker is listening on localhost

- **Production:** `compose.yml` maps container port 80 to host `9991` (e.g. `"9991:80"`).
- **Staging:** `compose.staging.yml` maps container port 80 to host `9993` (e.g. `"9993:80"`).

So long as production and staging stacks are started with the usual compose commands, host Nginx can reach them at `127.0.0.1:9991` and `127.0.0.1:9993`.

---

## 4. External communication (who talks to what)

| Who / What        | Connects to                         | Purpose |
|-------------------|-------------------------------------|--------|
| **Users (browsers)** | `https://fixedservices.ethiotelecom.et` or `https://dev.fixedservices.ethiotelecom.et` | Web UI and API |
| **Telebirr**      | `https://.../telebirr/notify` (production or staging) | Payment callbacks (must be HTTPS) |
| **FAYDA / other** | Your app’s HTTPS URLs               | Callbacks, redirects |

All of these hit the **host** on 80/443. Host Nginx terminates SSL and forwards to Docker on 127.0.0.1:9991 or 127.0.0.1:9993. No need to expose 9991/9993 to the internet.

---

## 5. Cert renewal (Let's Encrypt)

Renew and reload Nginx (e.g. from cron or systemd timer):

```bash
sudo certbot renew --quiet
sudo nginx -t && sudo systemctl reload nginx
```

Docker does not need a restart when you renew certs.

---

## 6. Reference: config file location

- **Example (in repo):** `docker/nginx/host-proxy.conf.example`
- **Active config (on host):** `/etc/nginx/sites-available/fixedservices.conf` (and symlink in `sites-enabled/`)

For more detail on SSL/TLS and ports, see [NGINX_SSL_ARCHITECTURE.md](NGINX_SSL_ARCHITECTURE.md).
