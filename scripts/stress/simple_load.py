#!/usr/bin/env python3
"""
Simple load test: send many HTTP requests to a URL with configurable concurrency.
Reports success count, errors, and latency percentiles (p50, p95, p99).

Usage:
  python scripts/stress/simple_load.py --url http://localhost:20080/ [--path /] [--concurrency 10] [--total 100]
"""

import argparse
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


def do_request(url: str, timeout: int) -> tuple[bool, float]:
    """Perform one GET request; return (success, latency_seconds)."""
    start = time.perf_counter()
    try:
        r = requests.get(url, timeout=timeout)
        ok = 200 <= r.status_code < 400
    except Exception:
        ok = False
    elapsed = time.perf_counter() - start
    return ok, elapsed


def worker(
    url: str,
    timeout: int,
    total: int,
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
        ok, elapsed = do_request(url, timeout)
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
    parser = argparse.ArgumentParser(description="Simple HTTP load test")
    parser.add_argument("--url", required=True, help="Base URL (e.g. http://localhost:20080/)")
    parser.add_argument("--path", default="/", help="Path to request (default: /)")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent threads (default: 10)")
    parser.add_argument("--total", type=int, default=100, help="Total requests (default: 100)")
    parser.add_argument("--timeout", type=int, default=10, help="Request timeout seconds (default: 10)")
    args = parser.parse_args()

    url = urljoin(args.url.rstrip("/") + "/", args.path.lstrip("/"))
    total = args.total
    concurrency = min(args.concurrency, total)
    timeout = args.timeout

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
            args=(url, timeout, total, latencies, latencies_lock, errors, errors_lock, counter, counter_lock),
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
