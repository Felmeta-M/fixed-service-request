# Fixed Service Request System  
## Student Training Manual

**Version:** 1.0  
**Audience:** Software engineering students (deployment and payment integration)  
**Prerequisites:** PHP/Laravel basics, Docker, REST APIs, basic Linux administration  
**Estimated study time:** 12–16 hours (including hands-on deployment)

---

## Document purpose

This manual is the single source of training material for the Fixed Service Request application. It is organized in chapters that progress from concepts to hands-on deployment. Use it for coursework, labs, and assessment preparation.

---

## Table of contents

| Chapter | Title |
|--------:|-------|
| 1 | [Introduction, purpose, and bottlenecks](#chapter-1-introduction-and-learning-objectives) |
| 2 | [System architecture](#chapter-2-system-architecture) |
| 3 | [Application Docker stack — Dockerfile, entrypoint, and Compose](#chapter-3-application-docker-stack--dockerfile-entrypoint-and-compose) |
| 4 | [Development environment setup](#chapter-4-development-environment-setup) |
| 5 | [Payment gateway integration (Telebirr)](#chapter-5-payment-gateway-integration-telebirr) |
| 6 | [Deployment — Staging environment](#chapter-6-deployment--staging-environment) |
| 7 | [Deployment — Production and host Nginx (SSL)](#chapter-7-deployment--production-and-host-nginx-ssl) |
| 8 | [Database and operations basics](#chapter-8-database-and-operations-basics) |
| 9 | [Summary and quick reference](#chapter-9-summary-and-quick-reference) |
| 10 | [Optimization at each stage](#chapter-10-optimization-at-each-stage) |
| 11 | [Automated Python scripts for stress testing](#chapter-11-automated-python-scripts-for-stress-testing) |

---

# Chapter 1: Introduction and learning objectives

## 1.1 What is the Fixed Service Request system?

The Fixed Service Request application allows customers to order and pay for fixed-line services (e.g. data, voice, combo). It integrates with **Telebirr** for payment and runs in **Docker** for both staging and production.

## 1.2 Learning objectives

By the end of this training you will be able to:

| # | Objective |
|---|-----------|
| 1 | Describe the system architecture (host Nginx, Docker stack, database, Redis). |
| 2 | Set up a local development environment using Docker. |
| 3 | Explain the payment flow (create order → redirect → webhook) and protection layers. |
| 4 | Deploy the application to a **staging** environment (Docker Compose, HTTPS, host Nginx). |
| 5 | Configure **production**-style deployment (SSL, reverse proxy, environment variables). |
| 6 | Perform basic database and operations tasks (migrations, health checks). |

## 1.3 Conventions used in this manual

- **Code blocks** are used for commands, configuration snippets, and file paths.
- **Bold** indicates important terms or actions.
- **Tables** summarize ports, endpoints, and options.
- Commands are shown for a **Linux** host; adapt as needed for your environment.

## 1.4 System purpose

The **purpose** of the Fixed Service Request system is to:

| Purpose | Description |
|--------|-------------|
| **Order management** | Let customers request fixed-line services (data, voice, combo) and track their orders end to end. |
| **Payment integration** | Collect payment securely via Telebirr (mobile money) without handling card or wallet credentials; the gateway handles PCI-sensitive data. |
| **Service activation** | After successful payment, trigger activation of the ordered service and keep records for support and auditing. |
| **Deployment flexibility** | Run the same application in development, staging, and production using Docker and host Nginx so students and operators can practice deployment safely. |

Understanding this purpose helps you see why certain components exist (e.g. webhook for payment result, HTTPS for notify URL, separate staging database).

## 1.5 Bottlenecks: explanation and how they are addressed

A **bottleneck** is a part of the system that limits throughput or causes delay. Below are common bottlenecks in this system and how they are **explained** and **addressed**:

| Bottleneck | Explanation | How it is addressed |
|------------|-------------|----------------------|
| **Database connections** | Each PHP request can open a DB connection; under load the database can run out of connections. | **PgBouncer** connection pool: the app talks to PgBouncer, which maintains a smaller pool of real PostgreSQL connections and multiplexes many app connections onto them. |
| **Concurrent payment requests** | Double-clicks or multiple tabs can create duplicate orders or race conditions. | **Distributed lock** (e.g. Redis): only one “create order” flow runs per order at a time; others get a clear “already in progress” response. |
| **Webhook delivery** | If our server is down or slow, Telebirr’s callback may fail and we never see the payment result. | **Reconciliation**: when the user clicks “Pay” again, we query Telebirr for the existing order and, if paid, confirm locally so we recover without manual intervention. |
| **Duplicate webhooks** | The gateway may send the same notification more than once; applying it twice could double-activate or double-charge. | **Idempotency**: the webhook handler checks “already paid?” and skips updates if so; it still returns 200 so the gateway does not keep retrying. |
| **Token API load** | Calling Telebirr for a new token on every payment would add latency and load on their API. | **Token caching**: we obtain a token once and cache it until expiry, so multiple payments reuse the same token. |
| **SSL termination** | Doing TLS inside Docker would require certs in every container and more complex config. | **Host Nginx**: SSL is terminated once on the host; traffic to Docker is plain HTTP on localhost, simplifying containers and cert renewal. |
| **Per-IP rate limiting** | Many users share the same public IP (NAT, mobile). Per-IP limits would block whole networks. | **No Nginx rate limit** for shared IPs; **Laravel** throttles by authenticated user or by route where it makes sense. |
| **Large headers / responses** | Big cookies, OAuth tokens, or Filament/Livewire responses can cause “buffer too small” errors. | **Nginx buffer settings**: `large_client_header_buffers`, `fastcgi_buffers`, `fastcgi_buffer_size`, and proxy buffers are set so large headers and responses are accepted. |

These choices are reflected in the config files and code; the manual and comments in the configs refer to them where relevant.

---

# Chapter 2: System architecture

## 2.1 High-level architecture

The system runs in two tiers:

1. **Host** — Nginx (SSL termination, reverse proxy), optional Let's Encrypt.
2. **Docker** — Application (Laravel/PHP-FPM), Nginx (HTTP), PostgreSQL, PgBouncer, Redis, scheduler, queues.

External traffic never hits Docker directly; it goes to the host on ports 80/443, then is proxied to the appropriate container port.

## 2.2 Traffic flow

```
Internet (users, Telebirr callbacks)
         │
         │  HTTPS :443  (or HTTP :80 → redirect to HTTPS)
         ▼
   ┌─────────────────────────────────────┐
   │  HOST NGINX                          │
   │  • Listens: 80, 443                  │
   │  • SSL certificate on host           │
   │  • Decrypts HTTPS, forwards HTTP    │
   └─────────────────────────────────────┘
         │
         │  HTTP to localhost (e.g. 127.0.0.1:10080 or 127.0.0.1:20080)
         ▼
   ┌─────────────────────────────────────┐
   │  DOCKER NGINX (inside container)     │
   │  • Listens: 80 (mapped to host port) │
   │  • No SSL                            │
   │  • Proxies to PHP-FPM                │
   └─────────────────────────────────────┘
         │
         ▼
   Laravel application (PHP-FPM)
```

## 2.3 Ports and environments

| Environment | Host Nginx | Docker HTTP (host port) | Purpose |
|-------------|------------|--------------------------|---------|
| **Production** | 80, 443 | 10080 | Main application |
| **Staging** | 80, 443 | 20080 | Clone for testing |

PostgreSQL, PgBouncer, and Redis use different host ports for production vs staging so both stacks can run on the same machine without conflict.

## 2.4 Key components

| Component | Role |
|-----------|------|
| **Laravel app** | Web API, business logic, Telebirr integration. |
| **PostgreSQL** | Primary database. |
| **PgBouncer** | Connection pooler for PostgreSQL. |
| **Redis** | Cache, sessions, queues, distributed locks. |
| **Scheduler** | Runs Laravel scheduled tasks (e.g. cron). |
| **Queue workers** | Process jobs (e.g. notifications, background tasks). |

---

# Chapter 3: Application Docker stack — Dockerfile, entrypoint, and Compose

This chapter gives a **holistic** view of how the application runs in Docker: the **Dockerfile** (what the image contains), the **entrypoint** (what runs when a container starts), and **Compose** (how services, volumes, and configuration are wired together). Understanding these three and their configuration files will help you deploy, debug, and modify the stack.

## 3.1 Purpose of the Docker stack

The Docker stack for the Fixed Service Request application:

- Runs the **Laravel app** (PHP-FPM), **Nginx** (HTTP only), **PostgreSQL**, **PgBouncer**, and **Redis** in isolated containers.
- Uses the **same app image** for the web app, the scheduler, and queue workers; only the **command** (and sometimes volumes) differ per service.
- Exposes host ports using the **&lt;ServiceID&gt;&lt;DefaultPort&gt;** pattern so production and staging can run on the same host without port conflicts.
- Keeps **SSL and public ports** on the host; Docker receives HTTP and internal traffic only.

The stack is defined in **compose.yml** (production) and **compose.staging.yml** (staging). Both use the same **Dockerfile** and **entrypoint**; staging adds host-sync volumes and different env/ports.

## 3.2 Dockerfile — purpose and structure

**Location:** `docker/php/Dockerfile`  
**Purpose:** Build a single image that contains the Laravel application, PHP-FPM, Composer, Node/pnpm, and the built frontend (Vite). This image is used for the **app**, **scheduler**, **queue**, and **queue-sms** services.

**Stages (conceptual):**

| Stage | Purpose |
|-------|---------|
| **Base** | Start from `php:8.4-fpm`; install system packages and PHP extensions (pdo_pgsql, zip, bcmath, intl, mbstring, xml, redis). |
| **Composer** | Copy Composer binary; install PHP dependencies (`composer install --no-dev`) so vendor is in the image. |
| **Node / Vite** | Install Node.js 20 and pnpm; build frontend assets with Vite so `public/build/` exists in the image. |
| **Entrypoint** | Copy `docker/php/entrypoint.sh` and `docker/php/www.conf` into the image; set `ENTRYPOINT` and default `CMD` to PHP-FPM. |

**Build-time arguments (ARG/ENV):**  
`VITE_APP_NAME`, `VITE_API_BASE_URL`, `VITE_API_PUBLIC_URL`, `VITE_TURNSTILE_SITE_KEY` are passed from Compose at build time so the frontend is built with the correct API URLs and keys. They are also exposed as ENV so the **entrypoint** can run a Vite build again when using host-sync (staging) if the image’s `public/build` is hidden by a bind mount.

**Result:** An image with `/var/www` as the app root, PHP-FPM listening on 9000, and `entrypoint.sh` as the single entry point for every container that uses this image.

## 3.3 Entrypoint — purpose and behaviour

**Location:** `docker/php/entrypoint.sh`  
**Purpose:** Run **once** when the container starts, before the main process (PHP-FPM, or the overridden command for scheduler/queue). It prepares the filesystem and permissions so Laravel and PHP-FPM can run correctly under both **immutable** (named volumes) and **host-sync** (bind mount) setups.

**What the entrypoint does (in order):**

| Step | Purpose |
|------|---------|
| **Composer** | If `vendor/autoload.php` is missing (e.g. host-sync without vendor), run `composer install` so dependencies exist. |
| **Storage link** | Run `php artisan storage:link` so `public/storage` points to `storage/app/public`; fixes broken or missing link after rebuild or when volumes replace the image’s storage. |
| **Host-sync frontend** | If there is **no** `public_volume` directory and `public/build/assets` is missing or empty, run `pnpm install` and `pnpm run build` so the app can serve JS/CSS when the image’s build is hidden by a bind mount (e.g. staging). |
| **Immutable public sync** | If `public_volume` **exists** (production with named volume), rsync or copy `public/` from the image into `public_volume` so Nginx (which mounts the same volume) serves the built assets. |
| **Directories** | Create required Laravel dirs: `storage/app/keys`, `storage/app/public`, `storage/framework/*`, `storage/logs/*`, `bootstrap/cache`. Ensures Telebirr keys path and log channels exist. |
| **Permissions** | Set ownership to `www-data` and permissions (775/664) on `storage` and `bootstrap/cache` so PHP-FPM can write logs, cache, and uploads. |
| **Cache clear** | Run `config:clear`, `cache:clear`, `view:clear` to avoid stale paths from a previous run or host. |
| **Main process** | `exec "$@"` — run the Compose **command** (PHP-FPM for app, or `php artisan schedule:run` / `queue:work` for scheduler/queue). |

**Why it matters:** The same image is used for app, scheduler, and queue; the entrypoint makes the filesystem and permissions correct regardless of whether code comes from the image only (immutable) or from a host bind mount (host-sync).

## 3.4 Compose — purpose and configuration

**Files:** `compose.yml` (production), `compose.staging.yml` (staging)  
**Purpose:** Define all services, their build context, env, volumes, networks, ports, and health checks so a single `docker compose up` brings up the full stack.

### 3.4.1 Services overview

| Service | Image / build | Purpose |
|---------|----------------|---------|
| **app** | Built from `docker/php/Dockerfile` | Laravel web app (PHP-FPM). Serves HTTP via Nginx. |
| **scheduler** | Same image | Runs `php artisan schedule:run` every 60 seconds (Laravel cron). |
| **queue** | Same image | Runs `php artisan queue:work` for the default queue. |
| **queue-sms** | Same image | Runs `queue:work --queue=sms` for SMS jobs. |
| **nginx** | `nginx:alpine` | Reverse proxy; serves static files and passes PHP to **app:9000**. Publishes host port (e.g. 10080). |
| **postgres** | `postgres:17` | Primary database. Data in named volume `pgdata`. |
| **pgbouncer** | `edoburu/pgbouncer` | Connection pooler; app connects to PgBouncer, not Postgres directly. |
| **redis** | `redis:alpine` | Cache, sessions, queues, and distributed locks. |

### 3.4.2 Build and env configuration

- **Build:** `context: .` (repo root), `dockerfile: docker/php/Dockerfile`. Build args (`VITE_*`) are set under each service that builds (app, scheduler, queue, queue-sms).
- **Env:** `env_file: .env` (production) or `.env.staging` (staging). Scheduler and queue workers can override `DATABASE_URL` to point at PgBouncer by hostname.

### 3.4.3 Volumes

| Volume | Mounted in | Purpose |
|--------|------------|---------|
| **fbb_storage** | `/var/www/storage/app` (app, scheduler, queue) | Persistent uploads and app storage. |
| **fbb_logs** | `/var/www/storage/logs` | Persistent Laravel and payment logs. |
| **fbb_public** | `/var/www/public_volume` (app) and `/var/www/public` (nginx) | Shared built assets; entrypoint syncs image `public/` into this volume so Nginx can serve them. |
| **pgdata** | `/var/lib/postgresql/data` (postgres) | Persistent database. |
| **custom.ini** | `/usr/local/etc/php/conf.d/custom.ini:ro` | PHP runtime settings (memory, upload size, timeouts). |

In **staging**, a bind mount `.:/var/www` (host-sync) is often used so code changes apply without rebuilding; the entrypoint then handles missing `public/build` by building on startup if needed.

### 3.4.4 Ports (host mapping)

Ports follow **&lt;ServiceID&gt;&lt;DefaultPort&gt;** (see Chapter 2 and the compose file comments):

- **Production (ServiceID 1):** nginx 10080:80, postgres 15432:5432, pgbouncer 16432:6432, redis 16379:6379.
- **Staging (ServiceID 2):** nginx 20080:80, postgres 25432:5432, pgbouncer 26432:6432, redis 26379:6379.

Only these services publish host ports; **app**, **scheduler**, and **queue** are reached only via the internal network (e.g. Nginx → app:9000).

### 3.4.5 Networks and health checks

- All services attach to a single bridge network (**fbb_net** or **fbb_staging_net**) so they resolve each other by service name.
- **postgres**, **pgbouncer**, and **redis** have health checks; **app** `depends_on` them with `condition: service_healthy`. **nginx** depends on **app** so the stack starts in order.

## 3.5 Configuration files (summary)

| File | Purpose |
|------|---------|
| **docker/php/Dockerfile** | Defines the app image (PHP, Composer, Node, Vite build, entrypoint). |
| **docker/php/entrypoint.sh** | Startup script: storage link, optional frontend build, public sync, directories, permissions, cache clear; then runs the service command. |
| **docker/php/www.conf** | PHP-FPM pool: listen 9000, dynamic pm, max_children 250, timeouts, slow log, status/ping paths. |
| **docker/php/custom.ini** | PHP ini: memory_limit 512M, upload_max_filesize 100M, post_max_size 120M, max_execution_time 300. Mounted read-only in Compose. |
| **docker/nginx/default.conf** | Nginx server block inside the container: root, location /build/, location /, PHP-FPM proxy to app:9000, X-Forwarded-* headers. Used by the **nginx** service. |
| **compose.yml** / **compose.staging.yml** | Declare all services, volumes, networks, ports, and commands. |

Together, the **Dockerfile** produces one app image; the **entrypoint** adapts it to immutable vs host-sync and prepares storage and permissions; **Compose** wires that image into multiple services (app, scheduler, queue) and connects them to Nginx, Postgres, PgBouncer, and Redis with the correct ports and configuration.

---

# Chapter 4: Development environment setup

## 4.1 Requirements

- Docker and Docker Compose
- Git
- Node.js and pnpm (for frontend build)
- Access to the project repository

## 4.2 Clone and configure environment

```bash
git clone <repository-url>
cd fixed-service-request
```

Create environment file from the production template (or use the provided example). Ensure at least the following are set:

- `APP_ENV`, `APP_DEBUG`, `APP_URL`
- `DB_*` (host, database name, user, password)
- `REDIS_HOST`
- `TELEBIRR_*` and `NOTIFY_URL` if testing payments

## 4.3 Run with Docker Compose

**Production-like stack (default compose):**

```bash
docker compose build
docker compose up -d
```

**Staging stack (separate project name and compose file):**

```bash
docker compose -f compose.staging.yml -p fbb_staging build
docker compose -f compose.staging.yml -p fbb_staging up -d
```

Use `.env` for the default compose and `.env.staging` for the staging stack.

## 4.4 Run migrations

```bash
# Default (production) stack
docker compose exec app php artisan migrate --force

# Staging stack
docker compose -f compose.staging.yml -p fbb_staging exec app php artisan migrate --force
```

## 4.5 Build frontend assets

Build on the host so that the container (with host sync in staging) or the built image (production) serves the assets:

```bash
# Set API URLs to match your environment, then:
pnpm install
pnpm run build
```

## 4.6 Verify

- Open the application in the browser (e.g. `http://localhost:10080` or `http://localhost:20080` for staging).
- Confirm health checks pass: `docker compose ps` (or equivalent for staging).

---

# Chapter 5: Payment gateway integration (Telebirr)

## 5.1 Role of a payment gateway

A **payment gateway** accepts payment requests from the merchant (this app), presents a secure payment UI to the customer, processes the money transfer, and notifies the merchant of the result. The app never handles card numbers or mobile money credentials; Telebirr does.

## 5.2 Synchronous vs asynchronous payment

| Pattern | Description |
|---------|-------------|
| **Synchronous** | Customer pays on our page; we wait for a response in the same request. |
| **Asynchronous** | Customer is redirected to the gateway; the gateway calls us back later (webhook). |

This application uses the **asynchronous** pattern: we create an order, get a URL, redirect the customer to Telebirr, and Telebirr sends a **webhook** (callback) with the result.

## 5.3 End-to-end flow

```
1) Customer clicks `Pay`

   CUSTOMER -> OUR APP
   OUR APP -> TELEBIRR: `POST /payment/v1/token`
   TELEBIRR -> OUR APP: `token`

2) OUR APP creates a Telebirr pre-order
   OUR APP -> TELEBIRR: `POST /payment/v1/merchant/preOrder`
   TELEBIRR -> OUR APP: `prepay_id`

3) OUR APP redirects the customer
   CUSTOMER <- OUR APP: Redirect URL (Telebirr H5)

4) Customer pays on Telebirr page
   CUSTOMER -> TELEBIRR

5) Telebirr sends webhook result
   TELEBIRR -> OUR APP: `POST /telebirr/notify`

6) OUR APP confirms payment + activates the service (if paid)

7) Customer reaches the success page
```

- **Outbound:** Our app calls Telebirr (token, preOrder, queryOrder).
- **Inbound:** Telebirr calls our webhook (`POST /telebirr/notify`). The notify URL must be **HTTPS** and publicly reachable.

## 5.4 Key techniques

### Token-based API authentication

Before calling Telebirr payment APIs, the app obtains an access token. The token is cached until expiry to reduce latency and load.

### Webhook handling

- Accept `POST /telebirr/notify`.
- Find the payment by `merch_order_id`, update state via `PaymentService->confirmPayment()`, and trigger deduction/activation only when the payment is not already paid.
- **Always return 200 OK** so Telebirr does not retry unnecessarily (log errors internally).

### Distributed lock

To prevent duplicate orders from double-clicks or concurrent requests, a **cache lock** (e.g. Redis) is used per order for a short period (e.g. 10 seconds).

### Idempotency

The webhook may be delivered more than once. The handler must be **idempotent**: if the payment is already marked paid (`Payment->isPaid()`), skip side-effects and still return 200.

### Reconciliation

If the customer paid but our webhook was never received, the next time they click “Pay” we **query Telebirr** for the existing order. If Telebirr reports success, we confirm the payment locally (and optionally show “already processed”).

## 5.5 Protection layers (double payment prevention)

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| 1. Lock | Cache lock for a few seconds | Prevents concurrent create-order requests |
| 2. DB check | Payment already paid | Prevents creating a new order for paid orders |
| 3. Reconciliation | Query Telebirr before creating a new order | Recovers from missed webhooks |
| 4. Idempotency | Skip if already paid in webhook | Handles duplicate webhook deliveries |

When `POST /api/v1/create-order` is blocked (lock in progress, or payment already paid), this app returns `HTTP 422` with a human-readable message so the frontend can show feedback instead of a generic `500`.

## 5.6 Security

- **RSA signing:** Requests to Telebirr are signed with the merchant’s private key; Telebirr verifies with the public key.
- **Secrets:** App secret and private key are stored in environment variables and key files, never in version control.
- **HTTPS:** The notify URL must use HTTPS so callbacks are encrypted and verifiable.

### 5.6.1 RSA signing and secrets — explained by code

**Flow between this app and the third party (Telebirr):**

```
┌─────────────────────────────────────┐     HTTP request + sign     ┌─────────────────────────────────────┐
│  This app (merchant)                 │  ───────────────────────►  │  Telebirr (third party)             │
│  • Build request (method, biz_content)│                            │  • Receives body + sign             │
│  • Build canonical string (sorted)    │                            │  • Builds same canonical string     │
│  • Sign with OUR private key (RSA)   │                            │  • Verifies sign with OUR public key│
│  • Send body + sign in request       │                            │  • If valid → process; else reject  │
└─────────────────────────────────────┘                             └─────────────────────────────────────┘
```

**1. Secrets: where they live (this app)**

Secrets are not hardcoded; they come from environment variables and a key file. The app reads them via config:

```php
// config/services.php (excerpt)
'telebirr' => [
    'base_url'       => env('TELEBIRR_BASE_URL'),
    'fabric_app_id'  => env('TELEBIRR_APP_ID'),
    'app_secret'     => env('TELEBIRR_APP_SECRET'),
    'merchant_code'  => env('TELEBIRR_MERCHANT_CODE'),
    'private_key'   => env('TELEBIRR_PRIVATE_KEY'),   // or path to PEM file
    'notify_url'     => env('NOTIFY_URL'),
],
```

The private key used for signing is loaded from disk (and is in `.gitignore`):

```php
// config/telebirr.php
return [
    'private_key_path' => storage_path('app/keys/private.pem'),
    'exclude_fields'   => ['sign', 'sign_type', 'header', 'refund_info', 'openType', 'raw_request'],
];
```

**2. This app: building and signing the request**

Before sending a request to Telebirr (e.g. create order or query order), the app builds a payload, then computes a signature over a **canonical string** (sorted key=value, excluding `sign` and `sign_type`). The signature is added to the payload and sent.

```php
// CreateOrderService.php (simplified) — build request then sign
$request = [
    'nonce_str'   => (string) TelebirrHelper::createNonceStr(),
    'method'      => 'payment.preorder',
    'timestamp'   => (string) TelebirrHelper::createTimeStamp(),
    'version'     => '1.0',
    'biz_content' => [ /* appid, merch_code, merch_order_id, total_amount, ... */ ],
    'sign_type'   => 'SHA256WithRSA',
];
$request['sign'] = app(TelebirrSignerService::class)->sign($request);  // add signature
// Then: HTTP POST this $request as JSON to Telebirr
```

**3. What is the canonical string?**

The **canonical string** is the exact sequence of characters that both we and Telebirr use for the signature. It must be **deterministic**: same request → same string every time. That way, when we sign it with our private key and Telebirr verifies with our public key, they are checking the same bytes. The API contract (and `config/telebirr.php`) defines which fields are excluded (`sign`, `sign_type`, etc.) and how nested fields like `biz_content` are flattened into key=value pairs.

**4. This app: the two steps that produce the string to sign**

The signer first builds a key=value string from the request, then sorts the **segments** (each `key=value` part) so the final order is fully deterministic:

```php
// TelebirrSignerService.php
public function sign(array $request): string
{
    $string = $this->buildString($request);   // Step A: request array → "key=value&key=value&..."
    $sortedString = $this->sortedString($string);  // Step B: sort segments, rejoin
    return $this->signWithRSA($sortedString);  // Step C: sign that string, return Base64
}
```

- **Step A — `buildString($request)`:** Turns the request array into one string: sort top-level keys, drop excluded fields, flatten `biz_content` (and nested arrays like `wallet_reference_data`) into key=value pairs, then join with `&`.
- **Step B — `sortedString($string)`:** Splits the string by `&`, sorts the resulting segments alphabetically, and joins again with `&`. So the string we actually sign has a single, well-defined order (e.g. `appid=...&biz_content_key1=...&method=...`).

**5. Laravel collection chains used (for students)**

**In `buildString()` — step-by-step:**

| Step | Laravel method | What it does |
|------|----------------|---------------|
| 1 | `collect($request)` | Wraps the request array in a Laravel Collection so we can chain methods. |
| 2 | `->sortKeys()` | Sorts the collection by key (e.g. `biz_content`, `method`, `nonce_str`, `timestamp`, `version`). |
| 3 | `->reject(fn($value, $key) => in_array($key, $this->excludeFields))` | Removes entries whose key is in `exclude_fields` (`sign`, `sign_type`, etc.) so they are not part of the string we sign. |
| 4 | `->flatMap(function ($value, $key) { ... })` | For each key-value pair: if the key is `biz_content` and the value is an array, flatten it (and any nested arrays like `wallet_reference_data`) into key-value pairs; otherwise keep the pair as-is. Result is a single flat list of key-value pairs. |
| 5 | `->map(fn($value, $key) => "{$key}={$value}")` | Turns each pair into a string `"key=value"`. |
| 6 | `->values()` | Resets array keys to 0, 1, 2, … so we have a plain list of segments. |
| 7 | `->implode('&')` | Joins all segments with `&`, e.g. `"appid=1297...&method=payment.preorder&..."`. |

**In `sortedString()` — step-by-step:**

| Step | Code | What it does |
|------|------|---------------|
| 1 | `explode('&', $stringApplet)` | Splits the string into an array of segments, e.g. `["appid=1297...", "method=payment.preorder", ...]`. |
| 2 | `collect(...)` | Wraps the array in a Collection. |
| 3 | `->sort()` | Sorts segments alphabetically (so the full string has a unique, deterministic order). |
| 4 | `->implode('&')` | Joins the sorted segments back into one string. That final string is the **canonical string** we pass to `signWithRSA()`. |

**Example (simplified) for students:**

- **Input request (conceptually):** `['method' => 'payment.preorder', 'version' => '1.0', 'biz_content' => ['appid' => 'A1', 'merch_order_id' => 'M1'], 'sign_type' => 'SHA256WithRSA']`
- **After `buildString()`:** Top-level keys sorted; `sign_type` excluded; `biz_content` flattened so its inner keys become top-level pairs. You might get:  
  `appid=A1&merch_order_id=M1&method=payment.preorder&version=1.0`  
  (All key=value pairs in one flat list, joined with `&`.)
- **After `sortedString()`:** Segments sorted alphabetically and rejoined. Here they are already in order, so the canonical string is the same. In general, this step ensures a single deterministic order. That final string is what both we and Telebirr use for signing/verification.

**6. Signing the canonical string**

```php
public function signWithRSA(string $data): ?string
{
    $rsa = PublicKeyLoader::loadPrivateKey(file_get_contents(storage_path('app/keys/private.pem')));
    $signatureBytes = $rsa->sign($data);
    return base64_encode($signatureBytes);
}
```

The **data** passed in is the canonical string from `sortedString()`. We sign it with our private key and send the Base64-encoded result in the request as `sign`.

**7. Third party (Telebirr): what they do with it**

We do not have Telebirr’s code, but their side follows the same contract:

1. They receive the JSON body including the `sign` and `sign_type` fields.
2. They build the **same** canonical string (same order, same exclusions) from the request.
3. They verify the Base64-decoded `sign` using **our public key** (RSA-SHA256). The public key is the one we registered with them when onboarding the merchant.
4. If verification succeeds, they process the request; otherwise they reject it (e.g. 4xx).

So: **this app** uses the **private key** (only we have) to produce `sign`; **Telebirr** uses the **public key** (they have) to verify that the request was not tampered with and came from us. Secrets (app secret, private key) stay in env and key files and are never committed to version control.

## 5.7 Key application endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/create-order` | Create payment order; returns redirect URL to Telebirr H5 page. |
| `POST /telebirr/notify` | Webhook for Telebirr payment result (must be public HTTPS). |
| `GET /payment/success` | Success page after customer returns from Telebirr. |

---

# Chapter 6: Deployment — Staging environment

## 6.1 Purpose of staging

Staging is a **clone of production**: same codebase and configuration pattern, but with a separate database (e.g. `fbb`), separate containers (`fbb_staging_*`), and staging URLs. It is used for integration testing (including Telebirr) and deployment practice.

## 6.2 Staging quick reference

| Item | Production | Staging |
|------|------------|---------|
| Compose file | `compose.yml` | `compose.staging.yml` |
| Project name | default | `fbb_staging` (`-p fbb_staging`) |
| Environment file | `.env` | `.env.staging` |
| HTTP port (host) | 10080 | 20080 |
| Database name | (e.g. ffd) | **fbb** |

## 6.3 One-time setup

### Step 1: Create `.env.staging`

Copy the production environment file and replace identifiers (e.g. `ffd` → `fbb`) and set staging URLs and hosts. Example pattern (adjust names to your setup):

```bash
cp .env.production .env.staging
# Edit .env.staging: replace ffd with fbb, set:
# APP_ENV=staging
# APP_URL=https://dev.fixedservices.ethiotelecom.et
# DB_HOST=fbb_staging_pgbouncer
# DB_DATABASE=fbb
# REDIS_HOST=fbb_staging_redis
# NOTIFY_URL=https://dev.fixedservices.ethiotelecom.et/telebirr/notify
# FRONTEND_URL, VITE_* URLs, SESSION_DOMAIN, etc.
```

### Step 2: Build and start the stack

```bash
docker compose -f compose.staging.yml -p fbb_staging build
docker compose -f compose.staging.yml -p fbb_staging up -d
```

### Step 3: Run migrations

```bash
docker compose -f compose.staging.yml -p fbb_staging exec app php artisan migrate --force
```

### Step 4: Build frontend assets (host sync)

If staging uses host-mounted code, build on the host with staging API URLs:

```bash
VITE_API_BASE_URL=https://dev.fixedservices.ethiotelecom.et/api/v1 \
VITE_API_PUBLIC_URL=https://dev.fixedservices.ethiotelecom.et/api/v1 \
pnpm run build
```

### Step 5: HTTPS and host Nginx

Telebirr callbacks require **HTTPS**. Configure host Nginx (see Chapter 6) to:

- Terminate SSL for the staging hostname (e.g. `dev.fixedservices.ethiotelecom.et`).
- Proxy to `http://127.0.0.1:20080`.

Until then, you can use `http://localhost:20080` for local testing without callbacks.

## 6.4 Common staging commands

| Action | Command |
|--------|---------|
| View logs | `docker compose -f compose.staging.yml -p fbb_staging logs -f app` |
| Shell in app | `docker compose -f compose.staging.yml -p fbb_staging exec app bash` |
| Artisan | `docker compose -f compose.staging.yml -p fbb_staging exec app php artisan <command>` |
| Stop stack | `docker compose -f compose.staging.yml -p fbb_staging down` |

## 6.5 Data isolation

Staging uses its own PostgreSQL (e.g. database `fbb`) and Redis. Do not point staging at production databases or Redis.

---

# Chapter 7: Deployment — Production and host Nginx (SSL)

## 7.1 Overview

Production traffic is served as follows:

1. Users and Telebirr hit the **host** on ports 80/443.
2. Host Nginx terminates SSL and proxies to the Docker Nginx (e.g. `127.0.0.1:10080` for production, `127.0.0.1:20080` for staging).
3. Docker Nginx serves the Laravel application over HTTP internally.

SSL certificates and port 80/443 binding are **only on the host**; containers use HTTP and need not be exposed to the internet.

## 7.2 Host Nginx configuration summary

| Server name (example) | SSL certificate | Proxy to |
|-----------------------|-----------------|----------|
| `fixedservices.ethiotelecom.et` | Production cert | `http://127.0.0.1:10080` |
| `dev.fixedservices.ethiotelecom.et` | Staging cert (e.g. Let's Encrypt) | `http://127.0.0.1:20080` |

- **Port 80:** Redirect to `https://<same host>` (301).
- **Port 443:** Use the appropriate certificate and `proxy_pass` to the backend port.

## 7.3 Step-by-step: Install and enable Nginx (host)

```bash
sudo apt update && sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 7.4 Step-by-step: Staging SSL with Let's Encrypt

For a staging hostname (e.g. `dev.fixedservices.ethiotelecom.et`) that is **in public DNS**:

1. **Option A — Webroot:** Use a config that serves the ACME challenge from a directory (e.g. `/var/www/letsencrypt`). Copy the project’s example host Nginx config for Let's Encrypt, then:

   ```bash
   sudo mkdir -p /var/www/letsencrypt
   # Copy and enable the Let's Encrypt Nginx config, then:
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot certonly --webroot -w /var/www/letsencrypt -d dev.fixedservices.ethiotelecom.et
   ```

2. **Option B — Nginx plugin:**  
   `sudo certbot certonly --nginx -d dev.fixedservices.ethiotelecom.et`

3. After obtaining the cert, switch Nginx to the **full SSL config** that proxies to `127.0.0.1:20080`, and disable the ACME-only config.

4. Reload Nginx:  
   `sudo nginx -t && sudo systemctl reload nginx`

**If the staging domain is not in public DNS** (e.g. only in `/etc/hosts`), use **DNS challenge** (manual or provider plugin) or a **self-signed certificate** for local/testing use. See the project’s host Nginx examples for self-signed instructions.

## 7.5 Certificate paths (Let's Encrypt)

- Certificate: `/etc/letsencrypt/live/<domain>/fullchain.pem`
- Private key: `/etc/letsencrypt/live/<domain>/privkey.pem`

Point the Nginx `ssl_certificate` and `ssl_certificate_key` directives to these paths.

## 7.6 Cert renewal

```bash
sudo certbot renew --quiet
sudo nginx -t && sudo systemctl reload nginx
```

Docker does not need a restart when renewing certs.

## 7.7 Ensure Docker is listening

- Production: `compose.yml` maps container port 80 to host **10080**.
- Staging: `compose.staging.yml` maps container port 80 to host **20080**.

Start the appropriate stack so host Nginx can reach `127.0.0.1:10080` or `127.0.0.1:20080`.

## 7.8 External communication

| Who | Connects to | Purpose |
|-----|-------------|---------|
| Users | `https://fixedservices.ethiotelecom.et` (or staging URL) | Web UI and API |
| Telebirr | `https://.../telebirr/notify` | Payment callbacks (HTTPS required) |

All of these hit the host on 80/443; host Nginx forwards to the correct Docker port. Do not expose 10080/20080 to the internet.

---

# Chapter 8: Database and operations basics

## 8.1 Database role

PostgreSQL is the primary data store. The application connects to it (often via PgBouncer) for all persistent data. Staging uses a separate database (e.g. `fbb`) from production.

## 8.2 Migrations

Always run migrations after deployment or pull:

```bash
# Production
docker compose exec app php artisan migrate --force

# Staging
docker compose -f compose.staging.yml -p fbb_staging exec app php artisan migrate --force
```

Use `--force` in non-interactive environments (e.g. CI, production).

## 8.3 Replication slots (awareness only)

PostgreSQL replication slots are used for logical replication or CDC. This application may not use them. Unused replication slots can cause WAL to accumulate. Maintenance (e.g. listing or dropping inactive slots) should be done only when you understand the impact; for training, it is enough to know that such maintenance exists and is documented in operational runbooks.

## 8.4 Health checks

- **Containers:** Use `docker compose ps` (or the staging equivalent) to see state and health.
- **Application:** Use Laravel’s health route or a simple HTTP check to the app URL.
- **Database:** Ensure the app can connect (e.g. run a simple Artisan command that uses the DB).

## 8.5 Logs

Application and payment logs are typically under the project’s `storage/logs` directory (or equivalent in the container). When using host-mounted volumes, logs are on the host for easier inspection.

---

# Chapter 9: Summary and quick reference

## 9.1 Architecture at a glance

- **Host:** Nginx on 80/443, SSL, reverse proxy to Docker.
- **Docker:** App, Nginx (HTTP), PostgreSQL, PgBouncer, Redis, scheduler, queue workers.
- **Production port:** 10080 (HTTP backend). **Staging port:** 20080.

## 9.2 Payment flow (Telebirr)

1. Customer clicks Pay → app gets token, creates order, returns redirect URL.
2. Customer pays on Telebirr H5 page.
3. Telebirr sends `POST /telebirr/notify` (webhook).
4. App confirms payment, updates order, activates service; handler is idempotent and returns 200.

Protection: lock, DB check, reconciliation, idempotent webhook.

## 9.3 Deployment checklist

**Staging**

- [ ] `.env.staging` created (ffd→fbb, staging URLs, DB_DATABASE=fbb).
- [ ] `docker compose -f compose.staging.yml -p fbb_staging up -d`.
- [ ] Migrations run.
- [ ] Frontend built with staging API URLs.
- [ ] Host Nginx: SSL for staging hostname, proxy to 127.0.0.1:20080.
- [ ] `NOTIFY_URL` is HTTPS and reachable by Telebirr.

**Production**

- [ ] `.env` (or production env file) configured; no staging URLs.
- [ ] `docker compose up -d` (or your production deploy process).
- [ ] Migrations run.
- [ ] Host Nginx: SSL for production hostname, proxy to 127.0.0.1:10080.
- [ ] Cert renewal (e.g. certbot) scheduled or documented.

## 9.4 Key files (reference)

| Area | Files / locations |
|------|-------------------|
| Compose | `compose.yml`, `compose.staging.yml` |
| Environment | `.env`, `.env.staging` |
| Host Nginx examples | `docker/nginx/host-proxy*.example`, `docker/nginx/host-letsencrypt*.example` |
| Payment | Controllers and services under `app/Http/Controllers`, `app/Services` (Telebirr, payment) |

## 9.5 Learning outcomes checklist

Before finishing the training, confirm you can:

- [ ] Explain how traffic flows from the internet to the Laravel app (host Nginx → Docker).
- [ ] Run the app locally or in staging with Docker Compose.
- [ ] Describe the create-order → redirect → webhook flow and why the webhook must be HTTPS and idempotent.
- [ ] Deploy staging (compose, env, migrations, frontend build, host Nginx + SSL).
- [ ] Run migrations and basic health checks.
- [ ] List the four protection layers against double payment.

---

# Chapter 10: Optimization at each stage

This chapter summarizes **optimizations applied at each stage** of the stack: host Nginx, Docker Nginx, PHP-FPM, PostgreSQL, PgBouncer, Redis, application (Laravel), and Compose. Understanding these helps you tune for load and avoid common bottlenecks.

## 10.1 Host Nginx (SSL and reverse proxy)

| Optimization | Purpose |
|--------------|---------|
| **SSL termination on host** | One place for certificates and renewal (e.g. certbot); containers only see HTTP. |
| **Large client header buffers** | `large_client_header_buffers 4 64k` — avoids 414/400 when clients send large cookies or OAuth tokens. |
| **Proxy buffers** | `proxy_buffer_size 128k`, `proxy_buffers 4 256k`, `proxy_busy_buffers_size 256k` — avoids "upstream sent too big header" when the app (e.g. Laravel/Filament) returns large responses. |
| **No Nginx rate limiting** | Many users share public IPs (NAT, mobile); per-IP limits would block whole networks. Laravel throttles per route/user instead. |

Reference: `docker/nginx/host-proxy.conf.example`, `host-proxy-dev.fixedservices.conf.example`.

## 10.2 Docker Nginx (HTTP backend)

| Optimization | Purpose |
|--------------|---------|
| **client_max_body_size 100M** | Allows large uploads (e.g. documents) without 413. |
| **large_client_header_buffers 4 64k** | Same as host: large request headers accepted. |
| **fastcgi_buffers 16 16k** | 16 × 16 KB buffers for PHP-FPM response body; prevents "upstream sent too big header" from Laravel/Filament/Livewire. |
| **fastcgi_buffer_size 32k** | First part of response (headers) up to 32 KB. |
| **Access/logging** | Can be reduced or off for static assets to cut I/O; application logs remain in Laravel. |

Reference: `docker/nginx/default.conf`.

## 10.3 PHP-FPM (application workers)

| Optimization | Purpose |
|--------------|---------|
| **pm = dynamic** | Scales child processes between min and max based on load. |
| **pm.max_children = 250** | Up to 250 concurrent PHP requests; sized with container memory (e.g. 20g limit). |
| **pm.start_servers, pm.min_spare_servers, pm.max_spare_servers** | Tuned so enough workers are ready without over-allocating (e.g. start 62, spare 38–112). |
| **pm.max_requests = 500** | Recycle workers after 500 requests to avoid memory leaks. |
| **request_terminate_timeout = 300** | Long-running requests (e.g. exports) can complete; prevents stuck workers indefinitely. |
| **slowlog + request_slowlog_timeout = 5s** | Logs requests slower than 5s to `storage/logs/php-fpm-slow.log` for debugging. |
| **pm.status_path / pm.ping** | Enables FPM status/ping for monitoring. |

Reference: `docker/php/www.conf`. Container resource limits in `compose.yml` (e.g. memory 20g, cpus 6) cap total PHP workers.

## 10.4 PostgreSQL

| Optimization | Purpose |
|--------------|---------|
| **max_connections** | Set to match PgBouncer’s pool (e.g. 300 in compose; app connects to PgBouncer, not directly). |
| **shared_buffers, effective_cache_size** | Tuned for available RAM (e.g. 12GB / 32GB) to cache data and reduce disk I/O. |
| **work_mem** | Per-operation memory (e.g. 32MB) for sorts and joins; avoids disk spills. |
| **maintenance_work_mem** | For VACUUM, CREATE INDEX, etc. |
| **wal_buffers, min_wal_size, max_wal_size** | WAL tuning for throughput and recovery. |
| **random_page_cost, effective_io_concurrency** | Tuned for SSD if applicable. |
| **max_parallel_workers_per_gather, max_parallel_workers** | Parallel query execution for CPU-bound workloads. |
| **autovacuum_*_scale_factor** | More frequent autovacuum/analyze to keep plans and bloat under control. |
| **shared_preload_libraries = pg_stat_statements** | (In reference config) Enables query statistics for identifying slow queries. |

Reference: `fixed-services-config/postgresql.conf`; production overrides in `compose.yml` (`command: postgres -c ...`).

## 10.5 PgBouncer (connection pooling)

| Optimization | Purpose |
|--------------|---------|
| **pool_mode = transaction** | Connection returned to pool after each transaction; high multiplexing. |
| **max_client_conn** | Max client connections (e.g. 1000 production, 500 staging). |
| **default_pool_size** | Max server connections per user/database (e.g. 265); must be ≤ PostgreSQL `max_connections`. |

Application connects to PgBouncer (port 6432), not directly to PostgreSQL. This keeps real DB connections bounded and avoids "too many connections" under load.

Reference: `pgbouncer.ini`, `pgbouncer.staging.ini`.

## 10.6 Redis

| Optimization | Purpose |
|--------------|---------|
| **maxmemory 6gb** | Prevents unbounded growth. |
| **maxmemory-policy allkeys-lru** | Evicts least-recently-used keys when full (sessions, cache, locks). |
| **appendonly yes, appendfsync everysec** | Durability with acceptable write cost. |

Reference: `compose.yml` Redis `command`.

## 10.7 Application (Laravel)

| Optimization | Purpose |
|--------------|---------|
| **Token caching (Telebirr)** | Reuse API token until expiry instead of requesting on every payment. |
| **Distributed lock (Redis)** | Prevents duplicate or concurrent create-order flows per order. |
| **Idempotent webhook** | One application of payment result; avoids double activation. |
| **QueryLogger** | Optional slow-query and N+1 detection (config: `logging.query_slow_threshold`, `logging.query_detect_n1`). |
| **Queue workers** | Heavy work (SMS, notifications) offloaded to queues so web requests stay fast. |
| **Cursor-based scheduled batching** | Avoid `OFFSET`/full scans when processing growing tables: keep a cursor (e.g. last processed `id`) in cache, fetch the next page with `WHERE id > lastId ORDER BY id LIMIT ...`, dispatch in chunks, then advance the cursor. |

### Cursor pagination example (copy/paste pattern)

#### Why this helps

Scheduled tasks often need to process "the next N rows" from a table that keeps growing. A cursor lets the database jump directly to the next range using an index-friendly condition like `id > lastId`, instead of relying on expensive `OFFSET`.

This pattern also keeps work bounded per scheduler run (via `$maxIdsPerRun`) and keeps job execution chunked (via `$chunkSize`).

#### Core rules/assumptions

Use one cursor per scheduled task (unique `cursorKey`), and paginate on a monotonic column (here: `survey_orders.id` which increases as new rows are inserted).

Operational note: the scheduler advances the cursor after dispatching jobs (not after job completion). That means you should rely on queue retries + job idempotency (or another reconciliation mechanism) so items are not permanently lost if a job fails.

#### Example from this codebase

```php
// From `bootstrap/app.php` (check-survey-order-status):
$chunkSize = 500;
$maxIdsPerRun = 10_000;

$cursorKey = 'schedule.check_survey_order_status.last_id';
$lastId = (int) Cache::get($cursorKey, 0);

$ids = DB::table('survey_orders')
    ->whereNull('deleted_at')
    ->where('status', FFDServiceProvisionStatus::Waiting->value)
    ->whereNull('customer_subscription_order_id')
    ->where('id', '>', $lastId)
    ->orderBy('id')
    ->limit($maxIdsPerRun)
    ->pluck('id')
    ->values()
    ->all();

if (empty($ids)) {
    Cache::put($cursorKey, 0);
    return;
}

foreach (array_chunk($ids, $chunkSize) as $chunk) {
    CheckSurveyOrderStatus::dispatch($chunk);
}

Cache::put($cursorKey, (int) max($ids));
```

```php
// From `bootstrap/app.php` (batch-refresh-survey-orders):
$chunkSize = 500;
$maxIdsPerRun = 10_000;

$cursorKey = 'schedule.batch_refresh_survey_orders.last_id';
$lastId = (int) Cache::get($cursorKey, 0);

$ids = DB::table('survey_orders')
    ->whereNull('deleted_at')
    ->where('status', FFDServiceProvisionStatus::Waiting->value)
    ->whereNotNull('customer_subscription_order_id')
    ->where('id', '>', $lastId)
    ->orderBy('id')
    ->limit($maxIdsPerRun)
    ->pluck('id')
    ->values()
    ->all();

if (empty($ids)) {
    Cache::put($cursorKey, 0);
    return;
}

foreach (array_chunk($ids, $chunkSize) as $chunk) {
    BatchRefreshSurveyOrdersJob::dispatch($chunk);
}

Cache::put($cursorKey, (int) max($ids));
```

See Chapter 1 (bottlenecks) and Chapter 5 (payment) for details.

## 10.8 Compose and containers

| Optimization | Purpose |
|--------------|---------|
| **Resource limits (app, postgres, nginx)** | Prevents one service from starving others on a shared host (e.g. app 20g/6 CPU, postgres 12g, nginx 256m). |
| **Log rotation** | `logging.options.max-size: 50m`, `max-file: 3` — avoids unbounded container log growth. |
| **Health checks** | Ensures dependencies (DB, Redis, PgBouncer) are ready before app starts; supports orchestration. |

Reference: `compose.yml` `deploy.resources` and `logging.options`.

---

# Chapter 11: Automated Python scripts for stress testing

This chapter describes **Python-based stress tests** you can run against the Fixed Service Request application (or any HTTP endpoint). The scripts live in the `scripts/stress` directory and use only the standard library plus `requests` so students can run them without heavy tooling.

## 11.1 Purpose of stress testing

- **Find limits:** How many concurrent requests can the app handle before latency spikes or errors?
- **Validate optimizations:** Compare behaviour before/after tuning (e.g. PgBouncer, PHP-FPM, Nginx buffers).
- **Practice:** Run load against staging (never production) and interpret results.

Always run stress tests against **staging or a dedicated test environment**, not production.

## 11.2 Prerequisites

- Python 3.8+
- Install dependencies: `pip install -r scripts/stress/requirements.txt` (or use a venv).

## 11.3 Scripts provided

| Script | Purpose |
|--------|---------|
| `scripts/stress/simple_load.py` | Sends many HTTP requests to a single URL (e.g. health or a public page) with configurable concurrency and total requests. Reports success count, errors, and latency percentiles. |
| `scripts/stress/steady_load.py` | Runs a steady load for a given duration (e.g. 60 seconds) at a target requests-per-second rate. Useful for sustained load and stability. |

## 11.4 Running the simple load script

**Syntax:**

```bash
cd /opt/fixed-service-request
pip install -r scripts/stress/requirements.txt
python scripts/stress/simple_load.py --url <BASE_URL> [options]
```

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `--url` | (required) | Base URL to hit (e.g. `https://dev.fixedservices.ethiotelecom.et/` or `http://localhost:20080/`). |
| `--path` | `/` | Path to request (appended to `--url`). |
| `--concurrency` | 10 | Number of concurrent threads. |
| `--total` | 100 | Total number of requests to send. |
| `--timeout` | 10 | Request timeout in seconds. |

**Example (staging, health-style endpoint):**

```bash
python scripts/stress/simple_load.py --url http://localhost:20080/ --path / --concurrency 20 --total 500
```

The script prints: total requests, success count, error count, and latency percentiles (e.g. p50, p95, p99).

## 11.5 Running the steady-load script

**Syntax:**

```bash
python scripts/stress/steady_load.py --url <BASE_URL> [options]
```

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `--url` | (required) | Base URL. |
| `--path` | `/` | Path to request. |
| `--rps` | 10 | Target requests per second. |
| `--duration` | 60 | Run duration in seconds. |
| `--timeout` | 10 | Request timeout in seconds. |

**Example:**

```bash
python scripts/stress/steady_load.py --url http://localhost:20080/ --path / --rps 20 --duration 120
```

Use this to keep a constant load and watch logs, DB, or PHP-FPM status over time.

## 11.6 Interpreting results

- **Success rate:** If many requests fail (4xx/5xx or timeouts), reduce concurrency or check app/DB/Redis.
- **Latency percentiles:** p95 and p99 much higher than p50 suggests tail latency (e.g. some requests blocking on DB or locks).
- **Correlation with Chapter 10:** After tuning (e.g. PgBouncer pool, PHP-FPM workers, Nginx buffers), re-run the same test and compare success rate and p95/p99.

## 11.7 Extending the scripts

- Add more paths (e.g. `/api/v1/...`) or headers (e.g. auth) by editing the script’s `request` logic.
- For API endpoints that change state (e.g. create order), use a **test** account and **staging** only; avoid hitting production or creating real orders at high volume.

---

*End of Student Training Manual.*
