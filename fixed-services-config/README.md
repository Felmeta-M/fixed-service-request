# fixed-services-config

**Clone of production config** for easy shipping. The **deployed app is not touched** — it uses `docker/` at the repository root. This directory is a copy of that production config so you can ship or replicate it elsewhere.

## Purpose

- **Production** keeps using `docker/` in the repo root (compose, Dockerfile, nginx, php config). No changes to the live deployment.
- **fixed-services-config** is a **clone** of that config: same files, same layout. Use it to:
  - Ship a single directory with the full production config (zip, archive, handoff).
  - Replicate or compare config on another environment.
  - Keep a reference copy without editing the deployed app.

## Port pattern: &lt;ServiceID&gt;&lt;DefaultPort&gt;

Host ports follow **&lt;ServiceID&gt;&lt;DefaultPort&gt;** (one digit ServiceID + default port):

| Stack     | ServiceID | Service   | DefaultPort | Host port   | Mapping        |
|-----------|-----------|-----------|-------------|-------------|----------------|
| Production | 1         | nginx     | 80          | **10080**   | 10080:80       |
| Production | 1         | postgres  | 5432        | **15432**   | 15432:5432     |
| Production | 1         | pgbouncer | 6432        | **16432**   | 16432:6432     |
| Production | 1         | redis     | 6379        | **16379**   | 16379:6379     |
| Staging   | 2         | nginx     | 80          | **20080**   | 20080:80       |
| Staging   | 2         | postgres  | 5432        | **25432**   | 25432:5432     |
| Staging   | 2         | pgbouncer | 6432        | **26432**   | 26432:6432     |
| Staging   | 2         | redis     | 6379        | **26379**   | 26379:6379     |
| **Dev**   | 3         | nginx     | 80          | **30080**   | 30080:80       |
| Dev       | 3         | postgres  | 5432        | **35432**   | 35432:5432     |
| Dev       | 3         | pgbouncer | 6432        | **36432**   | 36432:6432     |
| Dev       | 3         | redis     | 6379        | **36379**   | 36379:6379     |

Host Nginx should proxy to `127.0.0.1:10080` (production) or `127.0.0.1:20080` (staging). Staging can also be exposed as **:8443** on the host (see host-proxy-staging-8443.conf.example).

## Contents (mirror of production)

| Path | Description |
|------|-------------|
| **compose.yml** | Production stack (app, scheduler, queue, nginx, postgres, pgbouncer, redis). |
| **compose.staging.yml** | Staging stack (staging on port **8443** via host Nginx). |
| **compose.dev.yml** | Local dev stack for stress testing on Mac/Linux — app on **http://localhost:30080**. |
| **docker/nginx/default.conf** | Docker Nginx — production (HTTP, app:9000). |
| **docker/nginx/default-staging.conf** | Docker Nginx — staging (fbb_staging_app:9000). |
| **docker/nginx/host-proxy.conf.example** | Host Nginx — staging HTTPS (dev.fixedservices, proxy to 20080). |
| **docker/nginx/host-proxy-dev.fixedservices.conf.example** | Host Nginx — staging HTTPS (dev.fixedservices, full). |
| **docker/nginx/host-proxy-staging-8443.conf.example** | Host Nginx — staging on **:8443** (same hostname as prod). |
| **docker/nginx/host-letsencrypt-dev.fixedservices.conf.example** | Host Nginx — Let's Encrypt ACME challenge only. |
| **docker/nginx/host-proxy-dev-http-only.conf.example** | Host Nginx — staging HTTP only (no SSL, testing). |
| **docker/nginx/host-proxy-staging-ip.conf.example** | Host Nginx — staging by IP (HTTP, internal). |
| **docker/php/Dockerfile** | App image (PHP-FPM, Composer, Node/pnpm, Vite). |
| **docker/php/entrypoint.sh** | Container entrypoint. |
| **docker/php/www.conf** | PHP-FPM pool. |
| **docker/php/custom.ini** | PHP runtime settings. |
| **postgresql.conf** | PostgreSQL server overrides. |
| **pg_hba.conf** | PostgreSQL client auth. |

## Using the clone for a new deploy

1. Copy `fixed-services-config/docker/` over the repo’s `docker/` (or merge the files) so the app’s `docker/` matches this clone.
2. Run `docker compose` from the **repository root** (where `compose.yml` is). Running from inside this folder will give "compose file not found".

## Local dev stack (stress testing on your Mac)

Use **compose.dev.yml** to run the full stack locally and hit **http://localhost:30080** with the stress scripts.

**From the repository root:**

```bash
cd /path/to/fixed-service-request

# Ensure .env exists (copy from .env.example if needed). Set APP_ENV=local and DB_HOST=fbb_dev_pgbouncer, REDIS_HOST=fbb_dev_redis for dev.
docker compose -f fixed-services-config/compose.dev.yml -p fbb_dev up -d

# After containers are healthy, run migrations and then stress test:
docker compose -f fixed-services-config/compose.dev.yml -p fbb_dev exec app php artisan migrate --force
python scripts/stress/simple_load.py --url http://localhost:30080/ --concurrency 10 --total 200
```

Stop when done: `docker compose -f fixed-services-config/compose.dev.yml -p fbb_dev down`

## Keeping the clone in sync

When you change production config in `docker/` at the repo root, copy the updated files into `fixed-services-config/docker/` (and optionally `postgresql.conf` / `pg_hba.conf`) so the clone stays a true copy for shipping.
