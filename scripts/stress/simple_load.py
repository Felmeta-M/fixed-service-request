#!/usr/bin/env python3
"""
Simple load test: send many HTTP requests to a URL with configurable concurrency.
Supports GET (default) or POST with optional JSON body and headers (e.g. API auth).
Reports success count, errors, and latency percentiles (p50, p95, p99).

Usage:
  # Home page (GET)
  python scripts/stress/simple_load.py --url http://localhost:30080/ --total 100

  # Create-order API (POST + JSON + Bearer token)
  python scripts/stress/simple_load.py --url http://localhost:30080 --path /api/v1/create-order \\
    --method POST --json '{"customerSurveyOrderId":"YOUR_SURVEY_ORDER_ID"}' \\
    --header "Authorization: Bearer YOUR_TOKEN" --concurrency 5 --total 50
"""

import argparse
import json
import statistics
import sys
import threading
import time
from urllib.parse import urljoin

try:
    import requests
except ImportError:
    print("Install dependencies: pip install -r scripts/stress/requirements.txt", file=sys.stderr)
    sys.exit(1)


def parse_headers(header_args: list[str]) -> dict:
    """Parse repeated 'Key: Value' into a dict."""
    out = {}
    for s in header_args or []:
        if ":" in s:
            k, v = s.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def do_request(
    url: str,
    timeout: int,
    method: str = "GET",
    json_body: dict | None = None,
    raw_body: str | None = None,
    headers: dict | None = None,
) -> tuple[bool, float]:
    """Perform one HTTP request; return (success, latency_seconds)."""
    start = time.perf_counter()
    req_headers = dict(headers or {})
    if json_body is not None and "Content-Type" not in req_headers:
        req_headers["Content-Type"] = "application/json"
    if raw_body is not None and "Content-Type" not in req_headers:
        req_headers.setdefault("Content-Type", "application/json")
    try:
        if method.upper() == "GET":
            r = requests.get(url, timeout=timeout, headers=req_headers or None)
        elif method.upper() == "POST":
            if json_body is not None:
                r = requests.post(url, json=json_body, timeout=timeout, headers=req_headers)
            elif raw_body is not None:
                r = requests.post(url, data=raw_body, timeout=timeout, headers=req_headers)
            else:
                r = requests.post(url, timeout=timeout, headers=req_headers)
        else:
            kw = {"timeout": timeout, "headers": req_headers}
            if json_body is not None:
                kw["json"] = json_body
            elif raw_body is not None:
                kw["data"] = raw_body
            r = requests.request(method.upper(), url, **kw)
        ok = 200 <= r.status_code < 400
    except Exception:
        ok = False
    elapsed = time.perf_counter() - start
    return ok, elapsed


def worker(
    url: str,
    timeout: int,
    total: int,
    method: str,
    json_body: dict | None,
    raw_body: str | None,
    headers: dict | None,
    latencies: list,
    latencies_lock: threading.Lock,
    errors: list,
    errors_lock: threading.Lock,
    counter: list,
    counter_lock: threading.Lock,
) -> None:
    """Worker thread: perform requests until global total is reached."""
    while True:
        with counter_lock:
            if counter[0] >= total:
                break
            counter[0] += 1
        ok, elapsed = do_request(url, timeout, method=method, json_body=json_body, raw_body=raw_body, headers=headers)
        with latencies_lock:
            latencies.append(elapsed)
        if not ok:
            with errors_lock:
                errors.append(elapsed)


def percentile(sorted_data: list[float], p: float) -> float:
    """Return approximate p-th percentile (0-100)."""
    if not sorted_data:
        return 0.0
    k = (len(sorted_data) - 1) * (p / 100)
    f = int(k)
    c = f + 1 if f + 1 < len(sorted_data) else f
    return sorted_data[f] + (k - f) * (sorted_data[c] - sorted_data[f])


def main() -> None:
    parser = argparse.ArgumentParser(description="Simple HTTP load test (GET or POST with optional JSON/headers)")
    parser.add_argument("--url", required=True, help="Base URL (e.g. http://localhost:30080)")
    parser.add_argument("--path", default="/", help="Path (default: /). For API: /api/v1/create-order")
    parser.add_argument("--method", default="GET", choices=["GET", "POST"], help="HTTP method (default: GET)")
    parser.add_argument("--json", dest="json_body", metavar="JSON", help="JSON body for POST (e.g. '{\"customerSurveyOrderId\":\"id\"}')")
    parser.add_argument("--body", dest="raw_body", metavar="STR", help="Raw body for POST (alternative to --json)")
    parser.add_argument("--header", dest="headers", action="append", metavar="Key: Value", help="Add header (repeatable). e.g. --header \"Authorization: Bearer TOKEN\"")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent threads (default: 10)")
    parser.add_argument("--total", type=int, default=100, help="Total requests (default: 100)")
    parser.add_argument("--timeout", type=int, default=10, help="Request timeout seconds (default: 10)")
    args = parser.parse_args()

    url = urljoin(args.url.rstrip("/") + "/", args.path.lstrip("/"))
    total = args.total
    concurrency = min(args.concurrency, total)
    timeout = args.timeout
    method = args.method
    headers = parse_headers(args.headers) if args.headers else None
    json_body = None
    raw_body = args.raw_body
    if args.json_body:
        try:
            json_body = json.loads(args.json_body)
        except json.JSONDecodeError as e:
            print(f"Invalid --json: {e}", file=sys.stderr)
            sys.exit(1)

    latencies: list[float] = []
    latencies_lock = threading.Lock()
    errors: list[float] = []
    errors_lock = threading.Lock()
    counter = [0]
    counter_lock = threading.Lock()

    start_wall = time.perf_counter()
    threads = [
        threading.Thread(
            target=worker,
            args=(url, timeout, total, method, json_body, raw_body, headers, latencies, latencies_lock, errors, errors_lock, counter, counter_lock),
        )
        for _ in range(concurrency)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    wall = time.perf_counter() - start_wall

    success = len(latencies) - len(errors)
    print(f"Total requests: {total}")
    print(f"Success:       {success}")
    print(f"Errors:        {len(errors)}")
    print(f"Wall time:     {wall:.2f}s")
    if latencies:
        sorted_lat = sorted(latencies)
        print(f"Latency (s)    p50={percentile(sorted_lat, 50):.3f}  p95={percentile(sorted_lat, 95):.3f}  p99={percentile(sorted_lat, 99):.3f}")
        print(f"               min={min(latencies):.3f}  max={max(latencies):.3f}  mean={statistics.mean(latencies):.3f}")


if __name__ == "__main__":
    main()
