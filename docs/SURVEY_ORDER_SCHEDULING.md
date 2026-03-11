# Survey order scheduling (cursor-based)

This document describes the **scheduled tasks** that check and refresh survey order statuses, and how they scale as data grows.

## Overview

Two Laravel scheduled tasks run periodically to keep `survey_orders` in sync with external systems:

| Task | Schedule | Purpose |
|------|----------|---------|
| **check-survey-order-status** | Every 15 minutes | Poll survey order detail API for orders that have no subscription order yet (`customer_subscription_order_id` is null). Dispatches `CheckSurveyOrderStatus` jobs. |
| **batch-refresh-survey-orders** | Every 10 minutes | Refresh status for WAITING orders that already have a subscription order (`customer_subscription_order_id` not null). Dispatches `BatchRefreshSurveyOrdersJob` jobs. |

Both use **cursor-based pagination** and a **cap on work per run** so the scheduler stays fast and the queue is not flooded when there are many waiting orders.

## How it works

### Cursor-based pagination

- Each task stores a **cursor** (last processed `id`) in the Laravel cache.
- Every run queries only rows with `id > cursor`, ordered by `id`, with a **limit** (default 10,000 IDs).
- IDs are split into chunks (default 500) and one job is dispatched per chunk.
- After dispatching, the cursor is updated to the maximum `id` in the batch.
- When no rows are found (`id > cursor` returns empty), the cursor is **reset to 0** so the next run starts from the beginning and does not miss new or low-ID orders.

This avoids:

- **Full table scans** on every run (the scheduler only fetches a bounded slice).
- **Unbounded job dispatch** (at most `maxIdsPerRun / chunkSize` jobs per run per task).
- **Long-running cron** (one small query, then exit).

### Configuration

Defined in `bootstrap/app.php` inside `withSchedule()`:

| Variable | Default | Meaning |
|----------|---------|---------|
| `$chunkSize` | 500 | Number of survey order IDs per job. |
| `$maxIdsPerRun` | 10_000 | Maximum IDs processed per run per task → at most 20 jobs per run (10_000 / 500). |

Tuning:

- **Increase `$maxIdsPerRun`** to process more orders per run (more jobs per run).
- **Decrease it** to reduce queue load and keep each cron run lighter.
- **`$chunkSize`** should match what the jobs expect (500); change only if the jobs are updated for different batch sizes.

### Cache keys

| Task | Cache key |
|------|-----------|
| check-survey-order-status | `schedule.check_survey_order_status.last_id` |
| batch-refresh-survey-orders | `schedule.batch_refresh_survey_orders.last_id` |

Values are integers (last processed `survey_orders.id`). Uses the default Laravel cache driver (e.g. Redis or file).

To **force a full pass** from the beginning (e.g. after a long outage), clear the cursor:

```bash
php artisan tinker
>>> Cache::forget('schedule.check_survey_order_status.last_id');
>>> Cache::forget('schedule.batch_refresh_survey_orders.last_id');
```

## Jobs

| Job | Class | Role |
|-----|------|------|
| Check survey order status | `App\Jobs\CheckSurveyOrderStatus` | Accepts optional `$orderIds`; queries survey order detail API and batch-updates status. |
| Batch refresh survey orders | `App\Jobs\BatchRefreshSurveyOrdersJob` | Accepts `$orderIds`; queries subscription/survey APIs and updates status, survey result, timestamps, and may trigger notifications/ECAF. |

Both are queued; ensure queue workers are running (`php artisan queue:work` or the Docker `queue` service).

## Running and testing

- **Run the scheduler once** (executes all due tasks):

  ```bash
  php artisan schedule:run
  ```

- **List scheduled tasks**:

  ```bash
  php artisan schedule:list
  ```

- **Run in Docker** (e.g. staging):

  ```bash
  docker compose -f compose.staging.yml -p fbb_staging exec app php artisan schedule:run
  ```

The scheduler container typically runs `schedule:run` every minute via cron or a loop, so in production you only need to ensure the scheduler service is up; no extra steps for the cursor logic.

## Database indexes

For large `survey_orders` tables, the scheduler queries use:

- `deleted_at` (IS NULL)
- `status` (= Waiting)
- `customer_subscription_order_id` (IS NULL or IS NOT NULL, depending on task)
- `id` (> cursor, ORDER BY id, LIMIT n)

A composite index can reduce query time, for example:

- `(deleted_at, status, customer_subscription_order_id, id)` or
- At least `(status, id)` if the table is large.

Add via a migration if needed; check `EXPLAIN` on the scheduler query to confirm index usage.

## Related files

| File | Purpose |
|------|---------|
| `bootstrap/app.php` | Schedule definition and cursor logic. |
| `app/Jobs/CheckSurveyOrderStatus.php` | Job for survey-order-detail polling. |
| `app/Jobs/BatchRefreshSurveyOrdersJob.php` | Job for subscription/survey status refresh and side effects. |
