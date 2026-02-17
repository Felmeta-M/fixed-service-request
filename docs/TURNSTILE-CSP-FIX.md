# Fix: "Refused to load the script ... turnstile/v0/api.js" (CSP)

## What’s wrong

The browser is blocking the Turnstile script because one of the **Content-Security-Policy** headers does **not** allow `https://challenges.cloudflare.com` in **script-src-elem**.

If the response has **two** CSP headers (e.g. from Laravel and nginx, or from two nginx layers), the browser applies **both**. So one “bad” CSP (without Turnstile) is enough to block the script.

## Who sends CSP?

- **Laravel** sends CSP only when `DISABLE_HTTP_SECURITY=false` in `.env`.  
  Your `.env` has `DISABLE_HTTP_SECURITY=true`, so Laravel does **not** send CSP.
- **Nginx** sends CSP:  
  - **Internal** (Docker): `docker/nginx/default.conf` — already includes Turnstile.  
  - **External** (host): `/etc/nginx/conf.d/fbb.conf` — this one must also allow Turnstile.

So the “bad” CSP is coming from **external nginx** (`fbb.conf`) on the server. That file must be updated.

## What to do (3 steps)

### 1. On the server, open the external nginx config

```bash
sudo nano /etc/nginx/conf.d/fbb.conf
```

### 2. Replace the CSP line

Find the line that starts with:

```nginx
add_header Content-Security-Policy "
```

Replace the **entire** `add_header Content-Security-Policy " ... ";` line with this **single** line (it must include `https://challenges.cloudflare.com` in **script-src-elem**):

```nginx
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.gstatic.com https://www.recaptcha.net https://maps.googleapis.com https://challenges.cloudflare.com; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://maps.googleapis.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://maps.gstatic.com https://maps.googleapis.com *.googleapis.com; connect-src 'self' https://maps.googleapis.com https://challenges.cloudflare.com; frame-src 'self' https://www.recaptcha.net https://www.google.com https://challenges.cloudflare.com;" always;
```

- There must be only **one** `add_header Content-Security-Policy` in that server block (delete or comment any second one).
- Check that **script-src-elem** ends with:  
  `... https://www.recaptcha.net https://challenges.cloudflare.com;`

### 3. Test and reload nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Then hard-refresh the complaint page (Ctrl+Shift+R) or try in an incognito window.

---

**Same line is in:** `nginx-fbb-csp-merged.conf` (project root) for copy-paste.
