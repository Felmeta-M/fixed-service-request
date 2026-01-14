#!/bin/bash

# -------------------------
# Configuration
# -------------------------
DB_NAME="ffd"
DB_USER="sa"
DB_PASSWORD=""        # optional if using .pgpass
BACKUP_DIR="/var/backups/pg"
REMOTE_USER="haimanot"
REMOTE_HOST="10.117.66.12"
REMOTE_DIR="/opt/backups/pg"
DATE=$(date +'%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$DATE.sql.gz"

# -------------------------
# Export PGPASSWORD for non-interactive backup
# -------------------------
export PGPASSWORD="$DB_PASSWORD"

# -------------------------
# Ensure backup directory exists
# -------------------------
mkdir -p "$BACKUP_DIR"

# -------------------------
# Dump and compress the database
# -------------------------
docker exec -it ffd_pgsql  /bin/bash pg_dump -U "$DB_USER" -h 127.0.0.1 -p 2345 -F c "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "$(date) - Database dump successful: $BACKUP_FILE"
else
    echo "$(date) - Database dump failed!"
    exit 1
fi

# -------------------------
# Copy to remote server
# -------------------------
scp "$BACKUP_FILE" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"

if [ $? -eq 0 ]; then
    echo "$(date) - Backup successfully copied to remote server."
else
    echo "$(date) - Failed to copy backup to remote server!"
    exit 1
fi

# -------------------------
# Remove local backups older than 7 days
# -------------------------
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;

echo "$(date) - Backup process completed."
