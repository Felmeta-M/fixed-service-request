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
| `dev.fixedservices.ethiotelecom.et` | Let's Encrypt or self-signed (see below) | `http://127.0.0.1:9993`     |

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

Host Nginx can use either:

- **`/etc/nginx/sites-available/`** and **`sites-enabled/`** (Debian/Ubuntu: copy then symlink), or  
- **`/etc/nginx/conf.d/`** (RHEL/Fedora, etc.: copy only; every `.conf` is loaded automatically).

If you use **conf.d** (e.g. you already have `fbb.conf`, `letsencrypt.conf` there), copy directly into `conf.d` and skip any symlink step below.

**Option A — Staging only, minimal (dev.fixedservices.ethiotelecom.et):**

```bash
# Debian/Ubuntu
sudo cp docker/nginx/host-proxy.conf.example /etc/nginx/sites-available/fbb.conf
sudo ln -s /etc/nginx/sites-available/fbb.conf /etc/nginx/sites-enabled/

# OR conf.d
sudo cp docker/nginx/host-proxy.conf.example /etc/nginx/conf.d/fbb.conf
```

**Option B — Staging only, with comments (same vhost):**

```bash
sudo cp docker/nginx/host-proxy-dev.fixedservices.conf.example /etc/nginx/sites-available/dev.fixedservices.conf
sudo ln -s /etc/nginx/sites-available/dev.fixedservices.conf /etc/nginx/sites-enabled/
# OR: sudo cp docker/nginx/host-proxy-dev.fixedservices.conf.example /etc/nginx/conf.d/fbb.conf
```

Then set cert paths in the copied file (see 3.4). Production (fixedservices.ethiotelecom.et) uses a separate config and proxy to 127.0.0.1:9991; no example is included in this repo.

### 3.4 Staging: get Let's Encrypt cert

For **dev.fixedservices.ethiotelecom.et** you need a certificate before the full HTTPS config can work.

**If dev is only in local /etc/hosts (not in public DNS):** use **Option C — DNS challenge** below. Options A and B require the domain to be publicly resolvable so Let's Encrypt can reach your server over HTTP.

**Option A — Let's Encrypt nginx config (when dev is in public DNS)**

Use the dedicated config that serves only the ACME challenge:

```bash
sudo mkdir -p /var/www/letsencrypt
# Debian/Ubuntu
sudo cp docker/nginx/host-letsencrypt-dev.fixedservices.conf.example /etc/nginx/sites-available/letsencrypt-dev.fixedservices.conf
sudo ln -sf /etc/nginx/sites-available/letsencrypt-dev.fixedservices.conf /etc/nginx/sites-enabled/
# OR conf.d
sudo cp docker/nginx/host-letsencrypt-dev.fixedservices.conf.example /etc/nginx/conf.d/letsencrypt.conf

sudo nginx -t && sudo systemctl reload nginx

# Obtain cert (webroot method) — only works if dev.fixedservices.ethiotelecom.et resolves publicly
sudo certbot certonly --webroot -w /var/www/letsencrypt -d dev.fixedservices.ethiotelecom.et
```

After success, enable the full SSL config and disable the Let's Encrypt one:

```bash
# Debian/Ubuntu
sudo ln -sf /etc/nginx/sites-available/dev.fixedservices.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/letsencrypt-dev.fixedservices.conf
# OR conf.d: remove or rename letsencrypt.conf, ensure fbb.conf (or your staging vhost) is present
sudo rm -f /etc/nginx/conf.d/letsencrypt.conf

sudo nginx -t && sudo systemctl reload nginx
```

**Option B — certbot --nginx (when dev is in public DNS)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d dev.fixedservices.ethiotelecom.et
```

**Option C — DNS challenge (when dev is not in public DNS)**

Use this when **dev.fixedservices.ethiotelecom.et** is only in `/etc/hosts` (or similar) and not in public DNS. Let's Encrypt proves you control the domain by checking a **TXT** record you create; no HTTP to your server is needed.

You must be able to add DNS records for the domain (at whoever hosts the zone for `ethiotelecom.et` or `fixedservices.ethiotelecom.et` — e.g. your registrar, Cloudflare, or internal DNS).

**C1 — Manual DNS (any provider)**

1. Run certbot in manual DNS mode; it will print a TXT record you must create:

   ```bash
   sudo certbot certonly --manual --preferred-challenges dns -d dev.fixedservices.ethiotelecom.et
   ```

2. Certbot will show something like:
   - **Name:** `_acme-challenge.dev.fixedservices.ethiotelecom.et`
   - **Value:** a long token string

3. In your DNS provider’s panel, add a **TXT** record with that name and value. Save/publish.

4. Wait for DNS to propagate (often 1–5 minutes). Check from another network or with:
   ```bash
   dig TXT _acme-challenge.dev.fixedservices.ethiotelecom.et +short
   ```

5. When the TXT record is visible, press Enter in the certbot terminal. Certbot will verify and issue the cert.

6. Cert and key will be at:
   - `/etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/fullchain.pem`
   - `/etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/privkey.pem`

You can remove the `_acme-challenge` TXT record after the cert is issued (optional; renewal will need a new one).

**C2 — Automated DNS (if your provider has a certbot plugin)**

If your DNS is hosted by a provider with a Certbot plugin, you can automate the TXT record creation:

```bash
# Example: Cloudflare (zone managed by Cloudflare)
sudo apt install -y certbot python3-certbot-dns-cloudflare
# Create /etc/letsencrypt/cloudflare.ini with dns_cloudflare_api_token = YOUR_TOKEN (chmod 600)
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini -d dev.fixedservices.ethiotelecom.et
```

Other plugins: `certbot-dns-route53` (AWS), `certbot-dns-google` (Google Cloud DNS), etc. Run `certbot plugins` to see installed ones; install with `apt install python3-certbot-dns-<provider>`.

**Renewal with DNS challenge**

- **Manual:** `certbot renew --manual --preferred-challenges dns` will prompt you to add a new TXT record for each cert; you add it, wait, then continue.
- **Automated:** `certbot renew` works as usual if you used a DNS plugin.

**Cert paths (all options)**

- `/etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/fullchain.pem`
- `/etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/privkey.pem`

The full staging config (`host-proxy-dev.fixedservices.conf.example`) already uses these paths.

**Option D — Host-only: self-signed cert (no DNS provider, no Let's Encrypt)**

When **dev.fixedservices.ethiotelecom.et** is only in `/etc/hosts` and you **cannot** use any DNS provider (no TXT records, no API), Let's Encrypt cannot issue a cert for that name. The only option is a **self-signed certificate** created on the host. No external provider is involved.

- **Downside:** Browsers and API clients will show a certificate warning (e.g. "Your connection is not private"). Users must accept the exception once. Telebirr or other callbacks that validate the cert chain may reject it unless they allow self-signed.
- **Upside:** Works entirely on the host; no DNS, no certbot, no renewal.

**1. Create a directory and generate cert + key (on the host):**

Either run the helper script (from the project root):

```bash
./scripts/gen-selfsigned-cert-dev.sh
```

Or run openssl manually:

```bash
sudo mkdir -p /etc/nginx/ssl/selfsigned
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/selfsigned/dev.fixedservices.ethiotelecom.et.key \
  -out    /etc/nginx/ssl/selfsigned/dev.fixedservices.ethiotelecom.et.crt \
  -subj "/CN=dev.fixedservices.ethiotelecom.et"
sudo chmod 600 /etc/nginx/ssl/selfsigned/dev.fixedservices.ethiotelecom.et.key
```

**2. Point the staging Nginx config at these files:**

Edit your staging Nginx config (e.g. `/etc/nginx/sites-available/dev.fixedservices.conf` or `/etc/nginx/conf.d/fbb.conf`) and set:

```nginx
ssl_certificate     /etc/nginx/ssl/selfsigned/dev.fixedservices.ethiotelecom.et.crt;
ssl_certificate_key /etc/nginx/ssl/selfsigned/dev.fixedservices.ethiotelecom.et.key;
```

**3. Reload Nginx:**

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**4. In the browser:** Open `https://dev.fixedservices.ethiotelecom.et` (with dev in your `/etc/hosts`). Accept the security warning once; the site will then load over HTTPS.

No renewal is needed for many years (e.g. 3650 days above); you can recreate the cert later with the same command if you want to rotate.

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

## 6. Reference: config files

| File (in repo) | Use |
|----------------|-----|
| `docker/nginx/host-proxy.conf.example` | Staging only (minimal) — dev.fixedservices.ethiotelecom.et, proxy to 9993 |
| `docker/nginx/host-proxy-dev.fixedservices.conf.example` | Staging only (with comments) — same vhost, proxy to 9993 |
| `docker/nginx/host-letsencrypt-dev.fixedservices.conf.example` | **Let's Encrypt only** — serves ACME challenge on port 80 so certbot can issue the cert; use this before the full SSL config |

On the host, place the copied file in `/etc/nginx/sites-available/` and symlink into `sites-enabled/`, **or** (if you use **conf.d**) copy directly into `/etc/nginx/conf.d/` (e.g. `fbb.conf`, `letsencrypt.conf`).

For more detail on SSL/TLS and ports, see [NGINX_SSL_ARCHITECTURE.md](NGINX_SSL_ARCHITECTURE.md).
