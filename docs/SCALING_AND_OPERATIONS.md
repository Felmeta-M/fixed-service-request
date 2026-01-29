# Scaling and Operations

> **Progressive doc.** Update this file when you change PHP-FPM, PHP limits, container resources, queues, PgBouncer, Redis, or scaling targets. Current targets: **~200 concurrent web users**; second app (bill complaints) on same host.

---

## 1. PHP-FPM Configuration

**File:** `docker/php/www.conf`

| Setting | Current | Purpose |
|--------|---------|--------|
| `pm` | `dynamic` | Process manager: scales child processes between min and max. |
| `pm.max_children` | `200` | **Max concurrent PHP requests.** Main concurrency cap. |
| `pm.start_servers` | `50` | Children created at startup. |
| `pm.min_spare_servers` | `30` | Minimum idle children. |
| `pm.max_spare_servers` | `90` | Maximum idle children. |
| `pm.max_requests` | `500` | Requests per child before respawn (reduces memory drift). |
| `request_terminate_timeout` | `300` | Max request time (seconds). |
| `request_slowlog_timeout` | `5s` | Log requests slower than this. |

**Concurrent users ≈ `pm.max_children`** (each child handles one request at a time).

**Monitoring:** `pm.status_path = /fpm-status`, `ping.path = /fpm-ping` (if exposed in nginx).

**When changing:** Keep `pm.max_children` in line with app container memory limit (~80MB per child). Increase `pm.start_servers` / spare range proportionally.

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

**Rough container memory:** `pm.max_children × ~80MB` (typical usage per worker is below `memory_limit`). Don’t set container limit below this.

---

## 3. Container Resource Allocation

**File:** `compose.yml`

| Service | Memory limit | CPU limit | Notes |
|---------|--------------|-----------|--------|
| **app** (PHP-FPM) | 16g | 6 | Sized for ~200 PHP workers. Reservations: 4g, 1 CPU. |
| **nginx** | 256m | 0.5 | Front proxy; low footprint. |
| **postgres** | 12g | (none) | Reservations: 8g. `shm_size: 8gb`. |
| **redis** | (via `--maxmemory 8gb`) | (none) | Set in container command. |
| **pgbouncer** | (none) | (none) | Lightweight. |
| **scheduler** | (none) | (none) | One process. |
| **queue** | (none) | (none) | One worker process. |
| **queue-sms** | (none) | (none) | 8 replicas; scale via `deploy.replicas`. |

**Note:** `deploy.resources` is enforced in **Docker Swarm** (`docker stack deploy`). With plain `docker compose up`, size the host for both apps and use these numbers as planning targets.

**Multi-app host:** Cap this app (e.g. 16g / 6 CPUs) so the other app (e.g. bill complaints) has guaranteed headroom.

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
| `default_pool_size` | `100` | Server connections per database (to Postgres). |
| `min_pool_size` | `10` | Minimum server connections kept open. |
| `reserve_pool_size` | `25` | Extra connections when pool is busy. |
| `reserve_pool_timeout` | `3` | Seconds to wait for pool before using reserve. |
| `query_timeout` | `300` | Max query time (seconds). |
| `query_wait_timeout` | `60` | Max wait for a server connection. |

**Postgres:** `compose.yml` sets `max_connections=200`. Ensure `default_pool_size + reserve_pool_size` and total pools across DBs stay below this.

**Rule of thumb:** `default_pool_size` ≥ concurrent PHP workers + queue workers that use DB (e.g. 200 + 9 ≈ 210; current 100 may be tight under full load—consider raising if you see connection waits).

---

## 6. Redis Configuration

**File:** `compose.yml` (redis service `command`)

| Setting | Current | Purpose |
|--------|---------|--------|
| `--maxmemory` | `8gb` | Hard memory cap. |
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
| 60  | 60  | ~5–6 GB  | 2–4 |
| 100 | 100 | ~8 GB    | 4   |
| 200 | 200 | ~16 GB   | 6   |
| 500 | 500 | ~40 GB   | 8+  |

**Per-IP rate (nginx):** `limit_req rate` × `burst` should allow enough headroom so nginx isn’t the bottleneck. Current: 20 r/s, burst 40.

**Host sizing (this app + second app):**  
`host_ram ≥ app_ram + app2_ram + postgres_ram + redis_ram + nginx + OS` (e.g. 16 + 8 + 12 + 8 + 0.25 + 2 ≈ 46 GB for two apps at 200 + 100 users).

---

## 8. Common Scenarios

### Increase concurrent users (e.g. 200 → 300)

1. **PHP-FPM:** In `www.conf` set `pm.max_children = 300`, scale `pm.start_servers` and spare range (e.g. start 75, min_spare 45, max_spare 135).
2. **App container:** In `compose.yml` raise app `deploy.resources.limits.memory` (e.g. 24g) and optionally CPUs.
3. **Nginx:** In `docker/nginx/default.conf` optionally increase `limit_req` rate and burst (e.g. 25 r/s, burst 50).
4. **PgBouncer:** Ensure `default_pool_size` (and reserve) can handle 300 + queue workers; raise if needed. Keep Postgres `max_connections` above total pool usage.

### Add a second app on the same host (e.g. bill complaints)

1. Run the second app in a **separate Compose project** (different dir or `COMPOSE_PROJECT_NAME`), different port (e.g. 9992).
2. Set **resource limits** for both stacks (e.g. this app 16g/6 CPU, second app 8g/4 CPU) so neither starves the other.
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

*Last updated: reflect here when you change PHP-FPM, PHP limits, compose resources, queues, PgBouncer, or Redis.*
