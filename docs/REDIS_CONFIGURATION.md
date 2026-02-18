# Redis Configuration Guide

## Overview

This application uses Redis for three purposes:
1. **Sessions** - User session storage
2. **Cache** - Application caching
3. **Queue** - Background job processing

## Current Configuration

### Redis Database Separation

To avoid conflicts and improve organization, each Redis use case uses a separate database:

- **Database 0**: Queue jobs (`default` connection)
- **Database 1**: Cache data (`cache` connection)
- **Database 2**: Session data (`session` connection)

### Configuration Files

#### `config/database.php`
Defines Redis connections:
- `default`: Database 0 (for queues)
- `cache`: Database 1 (for cache)
- `session`: Database 2 (for sessions)

#### `config/session.php`
- Driver: `redis`
- Connection: `session` (uses DB 2)

#### `config/cache.php`
- Default store: `redis`
- Connection: `cache` (uses DB 1)

#### `config/queue.php`
- Default connection: `redis`
- Connection: `default` (uses DB 0)

## Environment Variables

Ensure your `.env` / `.env.staging` has (staging uses `fbb_staging_redis`; production uses `ffd_redis`):

```env
# Redis Configuration (staging example)
REDIS_HOST=fbb_staging_redis
REDIS_PORT=6379
REDIS_PASSWORD=null
REDIS_DB=0                    # Queue (default connection)
REDIS_CACHE_DB=1              # Cache
REDIS_SESSION_DB=2             # Sessions

# Session
SESSION_DRIVER=redis
SESSION_CONNECTION=session

# Cache
CACHE_STORE=redis

# Queue
QUEUE_CONNECTION=redis
```

## Benefits of This Setup

1. **Separation of Concerns**: Each use case has its own database, preventing key collisions
2. **Easy Monitoring**: Can monitor each database independently
3. **Performance**: Can flush/clear one database without affecting others
4. **Debugging**: Easier to identify which system is using Redis

## Monitoring Redis

Use **staging** container `fbb_staging_redis`. For production use `ffd_redis`.

### Check Database Sizes
```bash
# Queue database (DB 0)
docker exec fbb_staging_redis redis-cli -n 0 DBSIZE

# Cache database (DB 1)
docker exec fbb_staging_redis redis-cli -n 1 DBSIZE

# Session database (DB 2)
docker exec fbb_staging_redis redis-cli -n 2 DBSIZE
```

### List Keys in Each Database
```bash
# Queue keys
docker exec fbb_staging_redis redis-cli -n 0 KEYS "*"

# Cache keys
docker exec fbb_staging_redis redis-cli -n 1 KEYS "*"

# Session keys
docker exec fbb_staging_redis redis-cli -n 2 KEYS "*"
```

### Clear Specific Database
```bash
# Clear cache only (DB 1)
docker exec fbb_staging_redis redis-cli -n 1 FLUSHDB

# Clear sessions only (DB 2)
docker exec fbb_staging_redis redis-cli -n 2 FLUSHDB

# Clear queue only (DB 0) - Use with caution!
docker exec fbb_staging_redis redis-cli -n 0 FLUSHDB
```

## Best Practices

1. **Never flush DB 0** during production (contains active queue jobs)
2. **Monitor memory usage** for each database separately
3. **Set appropriate TTLs** for cache and session data
4. **Use key prefixes** (already configured via `REDIS_PREFIX`)
5. **Regular cleanup** of expired sessions and cache

## Troubleshooting

### Issue: Sessions not persisting
- Check `SESSION_DRIVER=redis` in `.env`
- Verify `SESSION_CONNECTION=session` points to DB 2
- Check Redis connectivity: `docker exec fbb_staging_redis redis-cli ping` (staging; production: `ffd_redis`)

### Issue: Cache not working
- Check `CACHE_STORE=redis` in `.env`
- Verify cache connection uses DB 1
- Clear config cache: `php artisan config:clear`

### Issue: Queue jobs not processing
- Check `QUEUE_CONNECTION=redis` in `.env`
- Verify queue worker is running: `docker ps | grep queue`
- Check queue connection uses DB 0

## Performance Tuning

### Redis Memory Limits
Consider setting `maxmemory` and `maxmemory-policy` in Redis configuration:
- `maxmemory-policy allkeys-lru`: Evict least recently used keys when memory limit is reached

### Connection Pooling
The configuration uses persistent connections (`REDIS_PERSISTENT`) which is good for performance.

## Security

- Redis is only accessible within Docker network (`app_net`)
- No password required for internal communication
- If exposing Redis externally, add authentication
