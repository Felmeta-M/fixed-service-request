# Vite Build Assets 404 (e.g. app-*.js not found)

## Symptom

After `docker compose build` and `docker compose up`, the app loads but frontend assets return 404:

- `GET https://fixedservices.ethiotelecom.et/build/assets/app-i54IzoRh.js` → **404 (Not Found)**
- Browser console: `net::ERR_ABORTED 404 (Not Found)` for `/build/assets/*.js` and `/build/assets/*.css`

## Root causes

### 1. Nginx: `try_files` + `alias` path doubling

In the `/build/` location we had:

```nginx
location /build/ {
    alias /var/www/public/build/;
    try_files $uri $uri/ =404;
    ...
}
```

Nginx has a long-standing behavior/bug: with `alias`, using `try_files $uri` makes it resolve the path incorrectly and **double** the location prefix. So a request for `/build/assets/app-xxx.js` was looked up as `/var/www/public/build/build/assets/app-xxx.js` and returned 404.

**Fix:** Remove `try_files` from the `/build/` block. The `alias` alone correctly maps `/build/assets/foo.js` → `/var/www/public/build/assets/foo.js`. If the file does not exist, nginx returns 404 anyway.

### 2. Host mount hides image build (host-sync mode)

Compose uses a bind mount: `.:/var/www`. So at runtime the container’s `/var/www` is the **host** directory, not the image contents.

- During **build**, the Dockerfile runs `pnpm run build` and writes to `public/build/` **inside the image**.
- At **runtime**, the volume mount replaces `/var/www` with the host. The image’s `public/build/` is never seen.
- On a fresh clone or deploy, `public/build/` is usually missing (it’s in `.gitignore`), so the file requested by the page does not exist on the mounted filesystem → 404.

**Fix:** In the app entrypoint, when **not** using the immutable `public_volume` (i.e. host-sync mode), if `public/build/assets` is missing or has no `.js` files, run `pnpm install --frozen-lockfile` and `pnpm run build`. That creates `public/build/` on the mounted host so nginx can serve it.

### 3. Vite env at runtime (for entrypoint build)

When the entrypoint runs `pnpm run build`, Vite needs `VITE_*` env vars (e.g. `VITE_APP_NAME`, `VITE_API_BASE_URL`). They were only passed as Docker **build args**, so they were not available at **runtime**.

**Fix:** In the Dockerfile, set `ENV` from the same build args so the container has `VITE_*` at runtime. The entrypoint’s `pnpm run build` then sees them (or they can be overridden via `.env`).

## Summary of code changes

| File | Change |
|------|--------|
| `docker/nginx/default.conf` | Removed `try_files $uri $uri/ =404` from `location /build/` so only `alias` is used. |
| `docker/php/entrypoint.sh` | When `public_volume` is not used and `public/build/assets` is missing or empty, run `pnpm install` and `pnpm run build`. |
| `docker/php/Dockerfile` | Set `ENV VITE_APP_NAME=...` (and other `VITE_*`) from build args so they are available at container runtime. |

## If 404s persist

1. **Rebuild and restart**  
   `docker compose build app && docker compose up -d`

2. **First start**  
   With host-sync, the first start may run the frontend build in the entrypoint; wait for “Frontend build complete” in app logs.

3. **Build on host instead**  
   Ensure `public/build/` exists before starting containers:
   ```bash
   pnpm install && pnpm run build
   docker compose up -d
   ```

4. **Immutable (production) mode**  
   Use the commented “immutable” volume layout in `compose.yml`: no `.:/var/www` mount, use `fbb_public` and let the entrypoint sync the image’s `public/` (including `public/build/`) into that volume so nginx serves the image-built assets.
