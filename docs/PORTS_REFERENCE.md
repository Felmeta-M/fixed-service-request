# Ports and networks reference — Production vs Staging

Use this to confirm **no port or network conflicts** when production and staging run on the same host.

---

## Networks (separate, no conflict)

Each stack uses its **own** Docker network. Containers in one stack cannot talk to the other stack over the network.

| Stack       | Compose file           | Project name   | Network (in file) | Full network name (example)     |
|-------------|------------------------|----------------|-------------------|----------------------------------|
| **Production** | `compose.yml`        | (directory)    | `ffd_net`         | `<project>_ffd_net`              |
| **Staging**    | `compose.staging.yml` | `fbb-staging`  | `fbb_staging_net` | `fbb-staging_fbb_staging_net`    |

- Production services attach to **ffd_net** only.
- Staging services attach to **fbb_staging_net** only.
- No shared network, so no cross-stack traffic or name clashes.

---

## Host ports (must be unique per service)

Only services that **publish a host port** are listed; others (app, scheduler, queue, queue-sms) are internal and do not bind a host port.

| Service    | Production | Staging | Purpose |
|------------|------------|---------|--------|
| **Nginx**  | **9991**   | **9993** | HTTP (host proxy forwards 443 → 9991 or 9993) |
| **Postgres** | **2345** | **2346** | Direct DB access (e.g. pg_dump, tools) |
| **PgBouncer** | **6633** | **6634** | Connection pooling (Laravel uses internal hostname; port for admin/tools) |
| **Redis**  | **6363**   | **6364** | Redis (Laravel uses internal hostname; port for redis-cli/tools) |

Each row: production and staging use **different** host ports, so both stacks can run together.

---

## Internal only (no host port)

These services do **not** publish a host port. They are reachable only from other containers on the same Docker network, so they cannot conflict between production and staging:

- **app** (PHP-FPM)
- **scheduler**
- **queue**
- **queue-sms**

---

## Quick check (no conflicts)

| Port | Used by |
|------|---------|
| 9991 | Production nginx |
| 9993 | Staging nginx |
| 2345 | Production Postgres |
| 2346 | Staging Postgres |
| 6633 | Production PgBouncer |
| 6634 | Staging PgBouncer |
| 6363 | Production Redis |
| 6364 | Staging Redis |

If you run both stacks, ensure nothing else on the host uses 9991, 9993, 2345, 2346, 6633, 6634, 6363, 6364.

---

## Summary: no conflicts

| Resource   | Production     | Staging          |
|------------|----------------|------------------|
| **Network**| `ffd_net`      | `fbb_staging_net`|
| **Nginx**  | 9991           | 9993             |
| **Postgres** | 2345         | 2346             |
| **PgBouncer** | 6633        | 6634             |
| **Redis**  | 6363           | 6364             |

Ports and networks are distinct; production and staging can run on the same host.
