#!/bin/bash
#
# Setup PostgreSQL Logical Replication
# Creates publication and replication slot for logical replication
#
# Usage:
#   ./scripts/setup-replication.sh [publication_name] [slot_name]
#
# Defaults:
#   publication_name: ffd
#   slot_name: ffd
#

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/compose.yml}"

postgres_exec() {
  docker compose -f "$COMPOSE_FILE" --project-directory "$REPO_ROOT" exec -T postgres "$@"
}

DB_NAME="ffd"
DB_USER="sa"
PUBLICATION_NAME="${1:-ffd}"
SLOT_NAME="${2:-ffd}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if publication exists
check_publication() {
    local count=$(postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM pg_publication WHERE pubname = '$PUBLICATION_NAME';
    " | tr -d ' ')
    
    if [ "$count" = "1" ]; then
        return 0
    else
        return 1
    fi
}

# Check if slot exists
check_slot() {
    local count=$(postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM pg_replication_slots WHERE slot_name = '$SLOT_NAME';
    " | tr -d ' ')
    
    if [ "$count" = "1" ]; then
        return 0
    else
        return 1
    fi
}

# Create publication
create_publication() {
    if check_publication; then
        log_warn "Publication '$PUBLICATION_NAME' already exists"
        read -p "Drop and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Dropping existing publication..."
            postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -c "DROP PUBLICATION $PUBLICATION_NAME;"
        else
            log_info "Keeping existing publication"
            return 0
        fi
    fi
    
    log_info "Creating publication '$PUBLICATION_NAME' for all tables..."
    postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE PUBLICATION $PUBLICATION_NAME FOR ALL TABLES;"
    log_info "Publication created successfully"
}

# Create replication slot
create_slot() {
    if check_slot; then
        log_warn "Replication slot '$SLOT_NAME' already exists"
        read -p "Drop and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Dropping existing slot..."
            postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT pg_drop_replication_slot('$SLOT_NAME');"
        else
            log_info "Keeping existing slot"
            return 0
        fi
    fi
    
    log_info "Creating logical replication slot '$SLOT_NAME' with pgoutput plugin..."
    postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT pg_create_logical_replication_slot('$SLOT_NAME', 'pgoutput');"
    log_info "Replication slot created successfully"
}

# Show status
show_status() {
    echo ""
    log_info "Replication Setup Status:"
    echo ""
    
    echo "=== Publication ==="
    postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            pubname,
            puballtables,
            pubinsert,
            pubupdate,
            pubdelete
        FROM pg_publication 
        WHERE pubname = '$PUBLICATION_NAME';
    "
    
    echo ""
    echo "=== Replication Slot ==="
    postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            slot_name,
            slot_type,
            active,
            restart_lsn,
            confirmed_flush_lsn
        FROM pg_replication_slots 
        WHERE slot_name = '$SLOT_NAME';
    "
    
    echo ""
    echo "=== Active Replication Connections ==="
    postgres_exec psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            pid,
            usename,
            application_name,
            client_addr,
            state,
            sync_state
        FROM pg_stat_replication;
    "
}

# Main execution
main() {
    log_info "Setting up PostgreSQL logical replication..."
    log_info "Publication: $PUBLICATION_NAME"
    log_info "Slot: $SLOT_NAME"
    echo ""
    
    create_publication
    echo ""
    create_slot
    echo ""
    show_status
    
    echo ""
    log_info "Replication setup complete!"
    log_info "External consumers can now connect using:"
    log_info "  - Publication: $PUBLICATION_NAME"
    log_info "  - Slot: $SLOT_NAME"
    log_info "  - Plugin: pgoutput"
}

main
