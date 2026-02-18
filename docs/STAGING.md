# Staging Server

Staging is a **clone of production**: same codebase and same env as production, but using **`.env.staging`** — a copy of `.env.production` with **ffd renamed to fbb** (database name, container hostnames) and staging URLs. Staging uses the **fbb** naming (project `fbb-staging`, containers `fbb_staging_*`, database `fbb`). Host and container stay **in sync** via bind mounts.

**Contents:** [Quick reference](#quick-reference) · [Ports](#ports) · [One-time setup](#one-time-setup) · [Run staging](#run-staging) · [Commands](#commands) · [Related docs](#related-docs)

---

## Quick reference

| | Production | Staging |
|---|------------|--------|
| **Compose** | `compose.yml` | `compose.staging.yml` |
| **Project** | default | **fbb-staging** (`-p fbb_staging`) |
| **Env** | `.env` | **`.env.staging`** (copy of `.env.production`, ffd→fbb) |
| **Naming** | ffd | **fbb** (containers, DB name) |
| **Port (HTTP)** | 9991 | **9992** |
| **Start** | `docker compose up -d` | `docker compose -f compose.staging.yml -p fbb_staging up -d` |

Production **`compose.yml`** and **`.env`** are never modified.

---

## Overview

- **Same config as production** — `.env.staging` is a copy of `.env.production` with every **ffd** replaced by **fbb** and staging-specific values (APP_ENV, APP_URL, DB_HOST, REDIS_HOST, DB_DATABASE=fbb, etc.). See `.env.staging.example` for the exact steps.
- **Host sync** — App, scheduler, queue, and nginx use the repo on the host (`.:/var/www`). Edits on the host are used on the next request or job.
- **Isolated data** — Staging has its own Postgres (database **fbb**) and Redis (containers `fbb_staging_*`). No shared data with production.

---

## Ports

| Service | Production | Staging |
|---------|------------|--------|
| Nginx (HTTP) | 9991 | **9992** |
| Postgres | 2345 | **2346** |
| PgBouncer | 6633 | **6634** |
| Redis | 6363 | **6364** |

Containers are named **`fbb_staging_*`** (e.g. `fbb_staging_app`, `fbb_staging_nginx`, `fbb_staging_pgsql`, `fbb_staging_pgbouncer`, `fbb_staging_redis`). Database name is **fbb**.

---

## One-time setup

1. **Create `.env.staging` (copy of `.env.production`, ffd→fbb)**  
   See **`.env.staging.example`** for full instructions. Summary:
   ```bash
   cp .env.production .env.staging
   sed -i '' 's/ffd/fbb/g' .env.staging   # macOS; on Linux use: sed -i 's/ffd/fbb/g' .env.staging
   ```
   Then in `.env.staging` set (staging URL: **https://dev.fixedservices.ethiotelecom.et**; HTTPS required for Telebirr notify callback):
   - `APP_ENV=staging`
   - `APP_DEBUG=true` (optional; set `false` to mirror production)
   - `APP_URL=https://dev.fixedservices.ethiotelecom.et`
   - `DB_HOST=fbb_staging_pgbouncer`
   - `DB_DATABASE=fbb`
   - `REDIS_HOST=fbb_staging_redis`
   - `SESSION_DOMAIN=dev.fixedservices.ethiotelecom.et`
   - `FRONTEND_URL=https://dev.fixedservices.ethiotelecom.et`
   - `NOTIFY_URL=https://dev.fixedservices.ethiotelecom.et/telebirr/notify`
   - `FAYDA_REDIRECT_URI=https://dev.fixedservices.ethiotelecom.et/callback`
   - `VITE_API_BASE_URL=https://dev.fixedservices.ethiotelecom.et/api/v1`
   - `VITE_API_PUBLIC_URL=https://dev.fixedservices.ethiotelecom.et/api/v1`

2. **HTTPS (Let's Encrypt) and host proxy**  
   Telebirr sends payment callbacks to `NOTIFY_URL`; it **must** be **HTTPS**. Use Let's Encrypt on the host and proxy to staging:
   - Add a server block for **dev.fixedservices.ethiotelecom.et** in the host nginx config (see `docker/nginx/host-proxy.conf.example`).
   - Obtain a certificate, e.g.:  
     `sudo certbot certonly --nginx -d dev.fixedservices.ethiotelecom.et`  
     (or use webroot/standalone; then point nginx to `/etc/letsencrypt/live/dev.fixedservices.ethiotelecom.et/`).
   - Proxy HTTPS (443) to `127.0.0.1:9992` (Docker staging nginx). Reload host nginx after changes.

3. **Frontend build (host sync)**  
   Staging serves from the host mount. Build assets on the host:
   ```bash
   VITE_API_BASE_URL=https://dev.fixedservices.ethiotelecom.et/api/v1 \
   VITE_API_PUBLIC_URL=https://dev.fixedservices.ethiotelecom.et/api/v1 \
   pnpm run build
   ```

---

## Run staging

From the project root:

```bash
# Build and start
docker compose -f compose.staging.yml -p fbb_staging build
docker compose -f compose.staging.yml -p fbb_staging up -d

# Migrate (database fbb)
docker compose -f compose.staging.yml -p fbb_staging exec app php artisan migrate --force
```

- **Staging (HTTPS):** https://dev.fixedservices.ethiotelecom.et (requires host nginx + Let's Encrypt; proxy 443 → `127.0.0.1:9992`)  
- **Local (no SSL):** http://localhost:9992  
- See [NGINX_SSL_ARCHITECTURE.md](NGINX_SSL_ARCHITECTURE.md) and `docker/nginx/host-proxy.conf.example` for the staging server block and cert paths.

---

## Host sync

| Service | Volume | Effect |
|---------|--------|--------|
| app, scheduler, queue, queue-sms | `.:/var/www` | Code and config on host = code in container. PHP/config changes apply on next request/job. |
| nginx | `.:/var/www:ro` | Serves from host `public/` (and `public/build/` after `pnpm run build`). |

Storage and logs are under the repo on the host and are shared with the containers via this mount.

---

## Commands

| Action | Command |
|--------|--------|
| Logs (follow) | `docker compose -f compose.staging.yml -p fbb_staging logs -f app` |
| Logs (all) | `docker compose -f compose.staging.yml -p fbb_staging logs -f` |
| Shell in app | `docker compose -f compose.staging.yml -p fbb_staging exec app bash` |
| Artisan | `docker compose -f compose.staging.yml -p fbb_staging exec app php artisan <command>` |
| Restart app | `docker compose -f compose.staging.yml -p fbb_staging restart app` |
| Stop | `docker compose -f compose.staging.yml -p fbb_staging down` |
| Stop + remove volumes | `docker compose -f compose.staging.yml -p fbb_staging down -v` |

---

## Data and production safety

- Staging uses **its own** Postgres (database **fbb**, port 2346) and Redis (port 6364). It does **not** use production DB or Redis.
- To mirror production data into staging, use your own dump/restore into the staging Postgres. Do **not** point staging at production databases.
- Only **compose.staging.yml** and **.env.staging** are used for staging. **compose.yml** and **.env** remain for production only.

---

## Related docs

- [NGINX_SSL_ARCHITECTURE.md](NGINX_SSL_ARCHITECTURE.md) — Host proxy and SSL in front of Docker
- [SCALING_AND_OPERATIONS.md](SCALING_AND_OPERATIONS.md) — PHP-FPM, queues, Postgres, Redis
- [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md) — Common Docker/Laravel issues
