# Docker 500 / Server Error

## 1. See the actual error

**Enable debug (temporary):** In `.env` set:
```env
APP_DEBUG=true
```
Restart: `docker compose restart app`. Reload the page and you’ll see the exception instead of “500 Server Error”. Set `APP_DEBUG=false` again when done.

**Or read Laravel log inside the app container:**
```bash
docker compose exec app tail -100 /var/www/storage/logs/laravel.log
```

**PHP / FPM errors:**
```bash
docker compose exec app tail -50 /var/www/storage/logs/php-error.log
```

## 2. Clear caches (stale paths after switching to immutable)

The entrypoint already runs `config:clear` and `cache:clear`. To run manually:
```bash
docker compose exec app php /var/www/artisan config:clear
docker compose exec app php /var/www/artisan cache:clear
docker compose exec app php /var/www/artisan view:clear
docker compose restart app
```

## 3. Storage link (public/storage)

The app entrypoint removes and re-creates the storage link on every container start. To fix a broken or missing link **without restarting**, run:

**Production** (if using `compose.yml` with default project):
```bash
docker compose exec app sh -c 'rm -f /var/www/public/storage && php /var/www/artisan storage:link'
```

**Staging** (`compose.staging.yml`):
```bash
docker compose -f compose.staging.yml -p fbb_staging exec app sh -c 'rm -f /var/www/public/storage && php /var/www/artisan storage:link'
```

Or restart the app container so the entrypoint runs again: `docker compose restart app` (staging: `docker compose -f compose.staging.yml -p fbb_staging restart app`).

## 4. Check database and Redis

`.env` must use **Docker service names** when running in compose:
- `DB_HOST=pgbouncer` (or your pgbouncer service name)
- `REDIS_HOST=redis` (or your redis service name)

Test DB:
```bash
docker compose exec app php /var/www/artisan db:show
```

## 5. Permissions

If logs show “permission denied” on storage or bootstrap/cache:
```bash
docker compose exec app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
docker compose exec app chmod -R 775 /var/www/storage /var/www/bootstrap/cache
docker compose restart app
```

## 6. Public / nginx (immutable setup)

Nginx serves from the `fbb_public` volume. If the app container’s entrypoint ran, it copies `public/` into that volume once. If you still get 404 for assets or index:
- Ensure the app container started at least once (so the copy ran).
- Rebuild and recreate: `docker compose build app && docker compose up -d`.

## 7. Vite build assets 404 (`/build/assets/app-*.js` not found)

If the app loads but JS/CSS under `/build/assets/` return 404, see **[VITE_BUILD_ASSETS_404_FIX.md](VITE_BUILD_ASSETS_404_FIX.md)** for causes (nginx `alias` + `try_files`, host mount hiding image build) and fixes.

## 8. Staging (compose.staging.yml)

For **staging** use the staging compose file and project name:
- Replace `docker compose` with `docker compose -f compose.staging.yml -p fbb_staging`
- Example: `docker compose -f compose.staging.yml -p fbb_staging exec app php artisan db:show`
- Env file: `.env.staging` (see [STAGING.md](STAGING.md)).

---

## Related docs

- [STAGING.md](STAGING.md) — Staging setup, .env.staging, fbb naming
- [SCALING_AND_OPERATIONS.md](SCALING_AND_OPERATIONS.md) — PHP-FPM, queues, resources
- [VITE_BUILD_ASSETS_404_FIX.md](VITE_BUILD_ASSETS_404_FIX.md) — 404 for `/build/assets/*.js` after Docker build
