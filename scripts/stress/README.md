# Stress test scripts

Python scripts for load testing the Fixed Service Request application. Use **staging or a test environment only**, not production.

## Setup

```bash
pip install -r scripts/stress/requirements.txt
```

## Scripts

- **simple_load.py** — Send a fixed number of requests with given concurrency; supports GET or POST with JSON body and headers. Reports success/errors and latency percentiles.
- **steady_load.py** — Run a steady load at a target RPS for a given duration; same options for path, method, JSON, and headers.

Full usage and interpretation are in the **Student Training Manual**, Chapter 11.

## Quick examples

**Home page (GET):**

```bash
python scripts/stress/simple_load.py --url http://localhost:30080/ --concurrency 20 --total 500
```

**Create-order API (POST + JSON + auth):**  
`POST /api/v1/create-order` expects JSON body `{"customerSurveyOrderId":"<id>"}` and `Authorization: Bearer <token>`. Use a valid survey order ID from your dev DB and a token from your auth flow.

```bash
python scripts/stress/simple_load.py --url http://localhost:30080 \
  --path /api/v1/create-order --method POST \
  --json '{"customerSurveyOrderId":"YOUR_SURVEY_ORDER_ID"}' \
  --header "Authorization: Bearer YOUR_BEARER_TOKEN" \
  --header "Accept: application/json" \
  --concurrency 5 --total 50
```

**Steady load:** `python scripts/stress/steady_load.py --url http://localhost:30080/ --rps 5 --duration 60`

For other APIs, change `--path`, `--method`, `--json`, and `--header` as needed. Use staging or local dev only.
