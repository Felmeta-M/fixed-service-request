#!/usr/bin/env python3
"""
Steady load test: maintain a target requests-per-second rate for a given duration.
Useful for sustained load and stability checks.

Usage:
  python scripts/stress/steady_load.py --url http://localhost:20080/ [--path /] [--rps 10] [--duration 60]
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
    stop: threading.Event,
    interval: float,
    latencies: list,
    latencies_lock: threading.Lock,
    errors: list,
    errors_lock: threading.Lock,
) -> None:
    """Worker: perform one request every interval seconds until stop is set."""
    while not stop.is_set():
        ok, elapsed = do_request(url, timeout)
        with latencies_lock:
            latencies.append(elapsed)
        if not ok:
            with errors_lock:
                errors.append(elapsed)
        # Throttle: sleep so we approximate 1 request per interval per worker
        until = time.perf_counter() + interval
        while not stop.is_set() and time.perf_counter() < until:
            time.sleep(min(0.05, max(0, until - time.perf_counter())))


def main() -> None:
    parser = argparse.ArgumentParser(description="Steady HTTP load test (constant RPS)")
    parser.add_argument("--url", required=True, help="Base URL (e.g. http://localhost:20080/)")
    parser.add_argument("--path", default="/", help="Path to request (default: /)")
    parser.add_argument("--rps", type=float, default=10.0, help="Target requests per second (default: 10)")
    parser.add_argument("--duration", type=int, default=60, help="Run duration in seconds (default: 60)")
    parser.add_argument("--timeout", type=int, default=10, help="Request timeout seconds (default: 10)")
    args = parser.parse_args()

    url = urljoin(args.url.rstrip("/") + "/", args.path.lstrip("/"))
    target_rps = args.rps
    duration = args.duration
    timeout = args.timeout

    # Number of workers; each worker aims for target_rps/workers per second
    concurrency = max(1, min(50, int(target_rps) or 1))
    interval = concurrency / target_rps if target_rps > 0 else 1.0

    latencies: list[float] = []
    latencies_lock = threading.Lock()
    errors: list[float] = []
    errors_lock = threading.Lock()
    stop = threading.Event()

    threads = [
        threading.Thread(
            target=worker,
            args=(url, timeout, stop, interval, latencies, latencies_lock, errors, errors_lock),
        )
        for _ in range(concurrency)
    ]
    start_wall = time.perf_counter()
    for t in threads:
        t.daemon = True
        t.start()

    time.sleep(duration)
    stop.set()
    for t in threads:
        t.join(timeout=timeout + 1)
    wall = time.perf_counter() - start_wall

    total = len(latencies)
    success = total - len(errors)
    actual_rps = total / wall if wall > 0 else 0
    print(f"Duration:      {wall:.2f}s")
    print(f"Total requests: {total}")
    print(f"Success:       {success}")
    print(f"Errors:        {len(errors)}")
    print(f"Actual RPS:    {actual_rps:.1f}")
    if latencies:
        sorted_lat = sorted(latencies)
        n = len(sorted_lat)
        p50 = sorted_lat[n // 2]
        p95 = sorted_lat[min(int(n * 0.95), n - 1)]
        p99 = sorted_lat[min(int(n * 0.99), n - 1)]
        print(f"Latency (s)    p50={p50:.3f}  p95={p95:.3f}  p99={p99:.3f}")
        print(f"               min={min(latencies):.3f}  max={max(latencies):.3f}  mean={statistics.mean(latencies):.3f}")


if __name__ == "__main__":
    main()
