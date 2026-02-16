# Scaling and Operations

> **Progressive doc.** Update this file when you change PHP-FPM, PHP limits, container resources, queues, PgBouncer, Redis, or scaling targets. Current targets: **250 concurrent web users**; second app (bill complaints) can run on the same host with reserved resources.

---

## 1. PHP-FPM Configuration

**File:** `docker/php/www.conf`

| Setting | Current | Purpose |
|--------|---------|--------|
| `pm` | `dynamic` | Process manager: scales child processes between min and max. |
| `pm.max_children` | `250` | **Max concurrent PHP requests.** Main concurrency cap. |
| `pm.start_servers` | `62` | Children created at startup. |
| `pm.min_spare_servers` | `38` | Minimum idle children. |
| `pm.max_spare_servers` | `112` | Maximum idle children. |
| `pm.max_requests` | `500` | Requests per child before respawn (reduces memory drift). |
| `request_terminate_timeout` | `300` | Max request time (seconds). |
| `request_slowlog_timeout` | `5s` | Log requests slower than this. |

**Concurrent users ≈ `pm.max_children`** (each child handles one request at a time).

**Monitoring:** `pm.status_path = /fpm-status`, `ping.path = /fpm-ping` (if exposed in nginx).

**When changing:** Keep `pm.max_children` in line with app container memory limit (~80MB per child). Scale `pm.start_servers` and spare range proportionally (e.g. start ≈ max_children/4, max_spare ≈ max_children×0.45).

---

## 2. PHP Memory Limits

**File:** `docker/php/custom.ini` (mounted into PHP/php-fpm containers)

| Setting | Current | Purpose |
|--------|---------|--------|
| `memory_limit` | `512M` | Max memory per PHP request/worker. |
| `max_execution_time` | `300` | Max script runtime (seconds). |
| `max_input_time` | `300` | Max time to parse input. |
| `upload_max_filesize` | `100M` | Max upload per file. |
| `post_max_size` | `120M` | Max POST body (must be ≥ upload_max_filesize). |
| `file_uploads` | `On` | Enable file uploads. |

**Rough container memory:** `pm.max_children × ~80MB` (typical usage per worker is below `memory_limit`). For 250 workers this is ~20 GB; do not set the app container limit below that.

---

## 3. Container Resource Allocation

**File:** `compose.yml`

| Service | Memory limit | CPU limit | Notes |
|---------|--------------|-----------|--------|
| **app** (PHP-FPM) | 20g | 6 | Sized for 250 PHP workers (~80MB each). Reservations: 4g, 1 CPU. |
| **nginx** | 256m | 0.5 | Front proxy; low footprint. |
| **postgres** | 12g | (none) | Reservations: 8g. `shm_size: 8gb`. |
| **redis** | (via `--maxmemory 6gb`) | (none) | Set in container command. |
| **pgbouncer** | (none) | (none) | Lightweight. |
| **scheduler** | (none) | (none) | One process. |
| **queue** | (none) | (none) | One worker process. |
| **queue-sms** | (none) | (none) | 8 replicas; scale via `deploy.replicas`. |

**Note:** `deploy.resources` is enforced in **Docker Swarm** (`docker stack deploy`). With plain `docker compose up`, size the host for both apps and use these numbers as planning targets.

**Multi-app host:** Cap this app (e.g. 20g / 6 CPUs) so the other app (e.g. bill complaints) has guaranteed headroom.

---

## 4. Queue Worker Configuration

**File:** `compose.yml` (service `command`)

| Service | Queue | Command flags | Replicas |
|---------|-------|----------------|----------|
| **queue** | default | `--sleep=3 --tries=3 --timeout=90` | 1 |
| **queue-sms** | `sms` | `--sleep=2 --tries=3 --timeout=30` | 8 |

**Scaling:** Change `queue-sms` concurrency by editing `deploy.replicas` (Compose) or scaling the service in Swarm. Add new services for other named queues (e.g. `queue-notifications`).

**Tuning:** Increase `--tries` for critical jobs; lower `--timeout` for fast jobs to free workers sooner. `--sleep` is idle time when queue is empty.

---

## 5. Database Connection Pooling

**File:** `pgbouncer.ini`

| Setting | Current | Purpose |
|--------|---------|--------|
| `pool_mode` | `transaction` | Release server connection after each transaction. |
| `max_client_conn` | `1000` | Max client connections to PgBouncer. |
| `default_pool_size` | `265` | Server connections per database (to Postgres). Must be ≥ PHP workers + queue workers. |
| `min_pool_size` | `10` | Minimum server connections kept open. |
| `reserve_pool_size` | `30` | Extra connections when pool is busy. |
| `reserve_pool_timeout` | `3` | Seconds to wait for pool before using reserve. |
| `query_timeout` | `300` | Max query time (seconds). |
| `query_wait_timeout` | `60` | Max wait for a server connection. |

**Postgres:** `compose.yml` sets `max_connections=300`. Keep `default_pool_size + reserve_pool_size` (and any other DB pools) below this.

**Rule of thumb:** `default_pool_size` ≥ concurrent PHP workers + queue workers (250 + 9 ≈ 259; we use 265 for headroom).

---

## 6. Redis Configuration

**File:** `compose.yml` (redis service `command`)

| Setting | Current | Purpose |
|--------|---------|--------|
| `--maxmemory` | `6gb` | Hard memory cap. |
| `--maxmemory-policy` | `allkeys-lru` | Evict any key (LRU) when full. |
| `--appendonly` | `yes` | Persist to AOF. |
| `--appendfsync` | `everysec` | Fsync AOF once per second. |

**Use:** Session, cache, queues (e.g. Laravel Redis driver). For more detail see `docs/REDIS_CONFIGURATION.md` if present.

**Scaling:** Increase `--maxmemory` if cache/session/queue usage grows; ensure host RAM allows it alongside app and Postgres.

---

## 7. Scaling Formulas

**Concurrent web users (PHP-bound):**

```text
concurrent_users ≈ pm.max_children
```

**App container memory (planning):**

```text
app_memory ≈ pm.max_children × 80MB   (typical per-worker usage)
```

**Example targets:**

| Concurrent users | pm.max_children | App memory (planning) | App CPU (ballpark) |
|------------------|-----------------|------------------------|--------------------|
| 60   | 60   | ~5–6 GB   | 2–4 |
| 100  | 100  | ~8 GB     | 4   |
| 250  | 250  | ~20 GB    | 6   |
| 500  | 500  | ~40 GB    | 8+  |

**Nginx:** Rate limiting at nginx is **disabled** so customers on shared public IPs (NAT, mobile carriers, corporate proxies) are not blocked. Throttling is done by Laravel only (see §9).

**Host sizing (this app + second app):**  
`host_ram ≥ app_ram + app2_ram + postgres_ram + redis_ram + nginx + OS` (e.g. 20 + 8 + 12 + 6 + 0.25 + 2 ≈ 48 GB for this app at 250 users plus a second app at ~100 users).

---

## 8. Common Scenarios

### Increase concurrent users (e.g. 250 → 300)

1. **PHP-FPM:** In `www.conf` set `pm.max_children = 300`, and scale `pm.start_servers` and spare range (e.g. start 75, min_spare 45, max_spare 135).
2. **App container:** In `compose.yml` raise app `deploy.resources.limits.memory` (e.g. 24g for 300 workers) and optionally CPUs.
3. **Laravel rate limits:** If authenticated users hit 429s, increase the relevant limiter in `AppServiceProvider` (see §9).
4. **PgBouncer:** Set `default_pool_size` ≥ 300 + queue workers (e.g. 315); keep Postgres `max_connections` in `compose.yml` above total pool usage.

### Add a second app on the same host (e.g. bill complaints)

1. Run the second app in a **separate Compose project** (different dir or `COMPOSE_PROJECT_NAME`), different port (e.g. 9992).
2. Set **resource limits** for both stacks (e.g. this app 20g/6 CPU, second app 8g/4 CPU) so neither starves the other.
3. Use **Docker Swarm** if you want `deploy.resources` to be enforced; otherwise size the host and tune `pm.max_children` so neither app can grow unbounded.

### Queue backlog growing (SMS or default)

1. Increase **replicas** for that queue service in `compose.yml` (`deploy.replicas` for queue-sms, or add more queue workers).
2. Optionally add a **dedicated queue** and worker service for the busiest job type.
3. Check **Redis** memory and **worker timeout** so jobs don’t hang and block workers.

### High memory or OOM on app container

1. **Lower** `pm.max_children` and/or **lower** `memory_limit` in `custom.ini` (per-request cap).
2. **Raise** app container memory limit if the host has room and you need more concurrent users.
3. **Inspect** `request_slowlog_timeout` and slow log; optimize slow requests to reduce per-request memory and time.

### Database connection errors or timeouts

1. **PgBouncer:** Increase `default_pool_size` / `reserve_pool_size` so they’re ≥ PHP workers + queue workers.
2. **Postgres:** Ensure `max_connections` &gt; sum of all PgBouncer pool sizes.
3. **Laravel:** Use `DATABASE_URL` pointing at PgBouncer (e.g. `ffd_pgbouncer:6432`), not directly at Postgres.

---

## 9. Laravel Rate Limiting (Scalability)

Rate limiting is **only** applied in Laravel (nginx rate limiting is disabled so shared public IPs are not blocked). Limits are **per key** (per user when authenticated, per IP for guests). This scales with user count: more users = more independent buckets.

### Where it is configured

| Location | Purpose |
|----------|---------|
| `app/Providers/AppServiceProvider.php` | Defines named limiters (`RateLimiter::for(...)`). |
| `routes/api.php` | Assigns limiters to route groups via `throttle:name` middleware. |

### Cache driver (important for scale)

Laravel stores rate-limit state in the **default cache** (`config/cache.php` → `CACHE_STORE`).

| Driver | Use case | Scale note |
|--------|----------|------------|
| `database` | Default; single app instance. | Fine for small/medium. Table can grow. |
| **`redis`** | **Recommended for production.** | Fast, shared across workers/containers; supports high request volume. Set `CACHE_STORE=redis` and ensure Redis is used for cache. |

For 250+ concurrent users or multiple app/queue workers, use **Redis** as cache so all PHP processes see the same rate-limit counters.

### Named limiters and limits

| Limiter name | Key | Limit | Applied to (routes) |
|--------------|-----|-------|----------------------|
| **service_client** | IP | 30 / min | `POST /api/v1/issue-token`, `GET /api/v1/fetch-token` |
| **api_public** | IP | 180 / min | Public API: survey-types, bandwidth-options, locations, geocode, tt/lookup-service, tt/create-guest, etc. |
| **api_authenticated** | User ID (or IP if guest) | 300 / min | Customer queries, survey orders list, account, payments/show, subscription-order-status, purchased-offering, change-primary-offering, etc. |
| **api_critical** | User ID (or IP) | 60 / min | `POST /api/v1/services/subscription`, `POST /api/v1/create-order` (payments) |
| **api_heavy** | User ID (or IP) | 120 / min | Customer create, survey create, survey create-manual |
| **api_trouble_tickets** | User ID (or IP) | 120 / min | Trouble ticket list, show, query, create, detail, confirm |
| **send-sms** | IP + phone | 3 / min per IP, 5 / hour per phone | SMS/OTP sending (web routes using this limiter) |

**Per-user vs per-IP:** Authenticated API routes use `$request->user()->id` as the key, so each logged-in user has their own limit even when many users share one IP. Public/guest routes use IP.

### Scaling and tuning

- **Increase limits:** Edit the `Limit::perMinute(...)` (or equivalent) values in `AppServiceProvider::boot()`. Example: 300 → 400 for `api_authenticated` if power users hit 429s.
- **Add a new limiter:** Call `RateLimiter::for('name', fn (Request $request) => Limit::perMinute(n)->by($key))`, then use `throttle:name` in `routes/api.php`.
- **Use Redis for cache:** Set `CACHE_STORE=redis` in `.env` and configure `config/cache.php` / `config/database.php` Redis so rate-limit state is shared and fast.
- **429 responses:** Clients receive HTTP 429 with JSON `message` and optional `retry_after`. Ensure `ThrottleRequestsException` is handled in the API exception handler (see `app/Exceptions/Handler.php` and `ApiResponse::rateLimited()`).

### Quick reference: change a limit

1. Open `app/Providers/AppServiceProvider.php`.
2. Find the `RateLimiter::for('api_xxx', ...)` block.
3. Change `Limit::perMinute(n)` to the new value; save.
4. No restart required for next request (opcache may cache the file until reload).

---

*Last updated: 250 concurrent users; PHP-FPM, compose, PgBouncer, Postgres max_connections, and Laravel rate limiting aligned to this target.*
