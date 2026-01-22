#!/bin/bash
#
# Database Maintenance Script
# Handles PostgreSQL replication slot management and health checks
#
# Usage:
#   ./scripts/db-maintenance.sh list-slots
#   ./scripts/db-maintenance.sh drop-slot <slot_name>
#   ./scripts/db-maintenance.sh health-check
#

set -euo pipefail

CONTAINER_NAME="ffd_pgsql"
DB_NAME="ffd"
DB_USER="sa"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

list_replication_slots() {
    log_info "Listing all replication slots..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            slot_name,
            slot_type,
            active,
            restart_lsn,
            confirmed_flush_lsn,
            pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as lag_size
        FROM pg_replication_slots
        ORDER BY slot_name;
    "
}

drop_replication_slot() {
    local slot_name="$1"
    
    if [ -z "$slot_name" ]; then
        log_error "Slot name is required"
        exit 1
    fi
    
    log_warn "Dropping replication slot: $slot_name"
    
    # Check if slot exists
    local exists=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM pg_replication_slots WHERE slot_name = '$slot_name';
    " | tr -d ' ')
    
    if [ "$exists" = "0" ]; then
        log_error "Replication slot '$slot_name' does not exist"
        exit 1
    fi
    
    # Check if slot is active
    local active=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT active FROM pg_replication_slots WHERE slot_name = '$slot_name';
    " | tr -d ' ')
    
    if [ "$active" = "t" ]; then
        log_error "Cannot drop active replication slot '$slot_name'. Stop the replication consumer first."
        exit 1
    fi
    
    # Drop the slot
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT pg_drop_replication_slot('$slot_name');"
    
    log_info "Successfully dropped replication slot: $slot_name"
}

health_check() {
    log_info "Running database health check..."
    
    echo ""
    echo "=== Replication Slots ==="
    list_replication_slots
    
    echo ""
    echo "=== Active Replication Connections ==="
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            pid,
            usename,
            application_name,
            client_addr,
            state,
            sync_state
        FROM pg_stat_replication;
    "
    
    echo ""
    echo "=== Database Size ==="
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            pg_database.datname,
            pg_size_pretty(pg_database_size(pg_database.datname)) AS size
        FROM pg_database
        WHERE datname = '$DB_NAME';
    "
    
    echo ""
    echo "=== WAL Status ==="
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            pg_current_wal_lsn() as current_lsn,
            pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') as total_wal_bytes,
            pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) as total_wal_size;
    "
}

show_usage() {
    cat << EOF
Database Maintenance Script

Usage: $0 <command> [arguments]

Commands:
    list-slots              List all replication slots
    drop-slot <name>        Drop a replication slot (only if inactive)
    health-check            Run comprehensive health check

Examples:
    $0 list-slots
    $0 drop-slot ffd
    $0 health-check

EOF
}

# Main script logic
case "${1:-}" in
    list-slots)
        list_replication_slots
        ;;
    drop-slot)
        drop_replication_slot "${2:-}"
        ;;
    health-check)
        health_check
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
