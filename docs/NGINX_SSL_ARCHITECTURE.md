# Nginx SSL and Ports (Overview)

SSL is **only on the host Nginx**. Docker Nginx serves HTTP only.

| Where   | Port | Purpose |
|--------|------|--------|
| Host   | 80   | HTTP → redirect to HTTPS |
| Host   | 443  | HTTPS (SSL) → proxy to backend |
| Docker | 9991 | HTTP (production backend) |
| Docker | 9993 | HTTP (staging backend) |

**Host server names**

- **Production:** `fixedservices.ethiotelecom.et` → proxy to `127.0.0.1:9991`
- **Staging:** `dev.fixedservices.ethiotelecom.et` → proxy to `127.0.0.1:9993`

**Full setup (host config, Let's Encrypt, external traffic):** see [HOST_NGINX_SETUP.md](HOST_NGINX_SETUP.md).
