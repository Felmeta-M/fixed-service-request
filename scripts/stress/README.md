# Stress test scripts

Python scripts for load testing the Fixed Service Request application. Use **staging or a test environment only**, not production.

## Setup

```bash
pip install -r scripts/stress/requirements.txt
```

## Scripts

- **simple_load.py** — Send a fixed number of requests with given concurrency; reports success/errors and latency percentiles.
- **steady_load.py** — Run a steady load at a target RPS for a given duration.

Full usage and interpretation are in the **Student Training Manual**, Chapter 11.

## Quick examples

**Using the local dev stack (Mac):** Start the app with `fixed-services-config/compose.dev.yml` (see that directory’s README), then use port **30080**:

```bash
# Simple: 500 requests, 20 concurrent
python scripts/stress/simple_load.py --url http://localhost:30080/ --concurrency 20 --total 500

# Steady: 20 RPS for 2 minutes
python scripts/stress/steady_load.py --url http://localhost:30080/ --rps 20 --duration 120
```

**Against staging (if available):**

```bash
python scripts/stress/simple_load.py --url http://localhost:20080/ --concurrency 20 --total 500
```
