# Fixed Service Request

Laravel application for fixed service orders and Telebirr payment integration.

## Run Docker Compose from here

**Always run `docker compose` from this directory** (the repository root, where `compose.yml` and `compose.staging.yml` are). If you run it from a subdirectory (e.g. `fixed-services-config/`), Docker will report "compose file not found".

```bash
# From repository root:
docker compose up -d
# Staging:
docker compose -f compose.staging.yml -p fbb_staging up -d
```

## Config and docs

- **Actual config:** `fixed-services-config/` (Docker, Nginx, PHP, PostgreSQL reference).
- **Training and deployment:** `docs/STUDENT_TRAINING_MANUAL.md`.
