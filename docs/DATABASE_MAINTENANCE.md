# Database Maintenance Guide

## Overview

This document describes database maintenance procedures for the Fixed Service Request application.

## Replication Slot Management

### What are Replication Slots?

PostgreSQL replication slots are used for logical replication and change data capture (CDC). They ensure that WAL (Write-Ahead Log) segments are retained until they have been consumed by all replication consumers.

### When to Use Replication Slots

Replication slots are needed when:
- Using logical replication to replicate data to another database
- Using CDC tools (e.g., Debezium, Kafka Connect)
- Streaming replication to standby servers

**Note:** This application does **not** currently use logical replication. Replication slots found in the database are typically leftovers from:
- Database restores from dumps that included replication configuration
- Previous setups that used replication
- External tools that connected temporarily

### Maintenance Script

A maintenance script is available at `scripts/db-maintenance.sh`:

```bash
# List all replication slots
./scripts/db-maintenance.sh list-slots

# Drop an inactive replication slot
./scripts/db-maintenance.sh drop-slot <slot_name>

# Run comprehensive health check
./scripts/db-maintenance.sh health-check
```

### Cleaning Up Unused Replication Slots

**Important:** Only drop replication slots that are:
1. **Inactive** (not currently being used)
2. **Confirmed unused** (no replication consumers connected)

#### Manual Cleanup

```bash
# 1. List all replication slots
docker exec ffd_pgsql psql -U sa -d ffd -c "
    SELECT slot_name, slot_type, active, restart_lsn 
    FROM pg_replication_slots;
"

# 2. Check for active replication connections
docker exec ffd_pgsql psql -U sa -d ffd -c "
    SELECT pid, usename, application_name, state 
    FROM pg_stat_replication;
"

# 3. Drop inactive slot (if confirmed unused)
docker exec ffd_pgsql psql -U sa -d ffd -c "
    SELECT pg_drop_replication_slot('slot_name');
"
```

#### Using the Maintenance Script

```bash
# Safe cleanup using the script
./scripts/db-maintenance.sh drop-slot <slot_name>
```

### Monitoring Replication Slots

Unused replication slots can cause:
- **WAL accumulation**: PostgreSQL retains WAL segments until consumed, which can fill up disk space
- **Performance impact**: Unnecessary WAL retention can affect database performance
- **Log noise**: Attempts to start replication on unused slots generate log messages

### Health Checks

Regular health checks help identify:
- Orphaned replication slots
- Active replication connections
- WAL size and growth
- Database size

Run health checks:
```bash
./scripts/db-maintenance.sh health-check
```

## Cleanup History

**2026-01-22**: Removed unused logical replication slot `ffd`
- Slot was inactive and not being used by any replication consumer
- No logical replication is configured in the application
- Cleanup prevents unnecessary WAL retention and log noise

## Best Practices

1. **Regular Monitoring**: Check for replication slots monthly
2. **Documentation**: Document any replication setup if implemented
3. **Cleanup**: Remove unused slots promptly to prevent WAL accumulation
4. **Verification**: Always verify slots are inactive before dropping
5. **Backup**: Consider backing up slot information before dropping (if needed for audit)

## Related Configuration

- PostgreSQL configuration: `compose.yml` (postgres service)
- Connection pooling: `pgbouncer.ini`
- Database credentials: `.env` file

## Troubleshooting

### Issue: Cannot drop replication slot

**Error**: `ERROR: replication slot "name" is active`

**Solution**: 
1. Identify what's using the slot: `SELECT * FROM pg_stat_replication;`
2. Stop the replication consumer
3. Verify slot is inactive: `SELECT active FROM pg_replication_slots WHERE slot_name = 'name';`
4. Then drop the slot

### Issue: WAL files accumulating

**Symptoms**: Disk space filling up, high WAL directory size

**Possible Causes**:
- Inactive replication slot preventing WAL cleanup
- High write activity
- Replication lag

**Solution**:
1. Check replication slots: `./scripts/db-maintenance.sh list-slots`
2. Check replication lag: `SELECT * FROM pg_replication_slots;`
3. Drop unused slots or fix replication consumers
4. Consider adjusting `max_wal_size` if needed
