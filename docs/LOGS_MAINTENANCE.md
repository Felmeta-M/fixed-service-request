# Logs Maintenance Guide

This guide covers how to access and manage application logs in the immutable Docker setup.

## Log Locations

Logs are stored in the `fbb_logs` Docker volume, mounted at `/var/www/storage/logs` inside containers.

### Log Channels

| Channel | Path | Description |
|---------|------|-------------|
| Laravel | `laravel.log` | Main application log |
| API | `api/api-YYYY-MM-DD.log` | API request/response logs |
| Auth | `auth/auth-YYYY-MM-DD.log` | Authentication events |
| Business | `business/business-YYYY-MM-DD.log` | Business logic events |
| Payment | `payment/payment-YYYY-MM-DD.log` | Payment transactions |
| Security | `security/security-YYYY-MM-DD.log` | Security events |
| HTTP | `http/http-YYYY-MM-DD.log` | HTTP request logs |
| Jobs | `jobs/jobs-YYYY-MM-DD.log` | Queue job logs |
| Performance | `performance/performance-YYYY-MM-DD.log` | Performance metrics |
| Audit | `audit/audit-YYYY-MM-DD.log` | Audit trail |
| JSON | `json/json-YYYY-MM-DD.log` | Structured JSON logs |

---

## Viewing Logs

### Real-time Streaming

```bash
# Laravel main log
docker compose exec app tail -f /var/www/storage/logs/laravel.log

# Business logic log (today)
docker compose exec app tail -f /var/www/storage/logs/business/business-$(date +%F).log

# API log
docker compose exec app tail -f /var/www/storage/logs/api/api-$(date +%F).log

# Multiple logs at once
docker compose exec app tail -f /var/www/storage/logs/laravel.log /var/www/storage/logs/api/api-$(date +%F).log
```

### View Last N Lines

```bash
# Last 100 lines of Laravel log
docker compose exec app tail -100 /var/www/storage/logs/laravel.log

# Last 50 lines of business log
docker compose exec app tail -50 /var/www/storage/logs/business/business-$(date +%F).log
```

### Search Logs

```bash
# Search for errors in Laravel log
docker compose exec app grep -i "error" /var/www/storage/logs/laravel.log

# Search for specific survey order
docker compose exec app grep "survey_order_id.*12345" /var/www/storage/logs/business/business-$(date +%F).log

# Search across all business logs
docker compose exec app grep -r "RuntimeException" /var/www/storage/logs/business/

# Search with context (3 lines before/after)
docker compose exec app grep -B3 -A3 "error" /var/www/storage/logs/laravel.log
```

### List Log Files

```bash
# List all log directories
docker compose exec app ls -la /var/www/storage/logs/

# List files in a channel with sizes
docker compose exec app ls -lh /var/www/storage/logs/api/

# Find large log files (>100MB)
docker compose exec app find /var/www/storage/logs -type f -size +100M
```

---

## Exporting Logs

### Copy to Host

```bash
# Copy entire logs folder
docker cp ffd_app:/var/www/storage/logs ./logs-export-$(date +%F)

# Copy specific log file
docker cp ffd_app:/var/www/storage/logs/laravel.log ./laravel-$(date +%F).log

# Copy today's API log
docker cp ffd_app:/var/www/storage/logs/api/api-$(date +%F).log ./api-$(date +%F).log
```

### Create Compressed Archive

```bash
# Create tarball of all logs
docker compose exec app tar -czf /tmp/logs-backup.tar.gz -C /var/www/storage logs
docker cp ffd_app:/tmp/logs-backup.tar.gz ./logs-backup-$(date +%F).tar.gz
docker compose exec app rm /tmp/logs-backup.tar.gz

# Archive specific date range
docker compose exec app bash -c 'find /var/www/storage/logs -name "*2026-02*" | tar -czf /tmp/feb-logs.tar.gz -T -'
docker cp ffd_app:/tmp/feb-logs.tar.gz ./
```

---

## Log Rotation & Cleanup

### Manual Cleanup

```bash
# Remove logs older than 30 days
docker compose exec app find /var/www/storage/logs -type f -name "*.log" -mtime +30 -delete

# Remove logs older than 7 days (more aggressive)
docker compose exec app find /var/www/storage/logs -type f -name "*.log" -mtime +7 -delete

# Check disk usage before cleanup
docker compose exec app du -sh /var/www/storage/logs/*
```

### Clear Specific Channel

```bash
# Clear old API logs (keep last 7 days)
docker compose exec app find /var/www/storage/logs/api -type f -mtime +7 -delete

# Truncate (empty) current Laravel log without deleting
docker compose exec app truncate -s 0 /var/www/storage/logs/laravel.log
```

### Automated Rotation

Add to Laravel's `app/Console/Kernel.php` for automatic cleanup:

```php
// Clean logs older than 30 days (runs daily at 2am)
$schedule->exec('find /var/www/storage/logs -type f -name "*.log" -mtime +30 -delete')
    ->dailyAt('02:00')
    ->name('logs:cleanup')
    ->withoutOverlapping();
```

---

## Volume Management

### Check Volume Size

```bash
# Get volume info
docker volume inspect fixed-service-request_fbb_logs

# Check disk usage (from inside container)
docker compose exec app du -sh /var/www/storage/logs

# Detailed breakdown by channel
docker compose exec app du -sh /var/www/storage/logs/*
```

### Direct Host Access (requires root)

```bash
# Find volume path
VOLUME_PATH=$(docker volume inspect fixed-service-request_fbb_logs --format '{{ .Mountpoint }}')

# Access logs directly (requires sudo)
sudo ls -la $VOLUME_PATH
sudo tail -f $VOLUME_PATH/laravel.log
```

### Backup Volume

```bash
# Full volume backup
docker run --rm -v fixed-service-request_fbb_logs:/logs -v $(pwd):/backup alpine \
    tar -czf /backup/fbb_logs-backup-$(date +%F).tar.gz -C /logs .
```

### Restore Volume

```bash
# Restore from backup (WARNING: overwrites existing)
docker run --rm -v fixed-service-request_fbb_logs:/logs -v $(pwd):/backup alpine \
    sh -c "rm -rf /logs/* && tar -xzf /backup/fbb_logs-backup-2026-02-04.tar.gz -C /logs"
```

---

## Container Logs (stdout/stderr)

For PHP-FPM and application stdout logs:

```bash
# All containers
docker compose logs -f

# Specific service with timestamps
docker compose logs -f --timestamps app

# Last 200 lines from app
docker compose logs --tail=200 app

# Since specific time
docker compose logs --since="2026-02-04T10:00:00" app

# Save to file
docker compose logs app > container-logs-$(date +%F).txt
```

---

## Troubleshooting

### Logs Not Writing

```bash
# Check permissions
docker compose exec app ls -la /var/www/storage/logs/

# Fix permissions
docker compose exec app chown -R www-data:www-data /var/www/storage/logs
docker compose exec app chmod -R 775 /var/www/storage/logs
```

### Disk Full

```bash
# Check disk usage
docker compose exec app df -h /var/www/storage/logs

# Find largest files
docker compose exec app find /var/www/storage/logs -type f -exec ls -lh {} \; | sort -k5 -h | tail -20

# Emergency cleanup (remove all but today's logs)
docker compose exec app find /var/www/storage/logs -type f -name "*.log" ! -newermt "today" -delete
```

### Log File Locked

```bash
# Restart workers to release file handles
docker compose restart queue scheduler
```
