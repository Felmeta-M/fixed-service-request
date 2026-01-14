#!/bin/bash
set -euo pipefail

############################
# CONFIGURATION
############################

# Laravel app root
APP_DIR="/opt/fixed-service-request/storage"

# Borg repository (on backup server or local
BORG_REPO="haimanot@10.117.66.12:/fixedservices-backups/laravel"

# Temporary directory for DB dump
TMP_DIR="/tmp/laravel_backup"

# Database credentials
DB_TYPE="psql"            # mysql or postgres
DB_NAME="ffd"
DB_USER="sa"
DB_PASS="secret"
DB_HOST="127.0.0.1"

# Borg options
COMPRESSION="lz4"
ARCHIVE_NAME="laravel-$(date +%Y-%m-%d_%H-%M-%S)"

############################
# PREPARE
############################

mkdir -p "$TMP_DIR"

############################
# DATABASE DUMP
############################
docker exec ffd_pgsql \
  env PGPASSWORD="$DB_PASS" \
  pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" \
  > "$TMP_DIR/db.sql"
############################
# CREATE BACKUP
############################

borg create \
  --stats \
  --compression "$COMPRESSION" \
  --one-file-system \
  --exclude "$APP_DIR/var/log" \
  --exclude "$APP_DIR/storage/framework/cache" \
  --exclude "$APP_DIR/storage/framework/sessions" \
  --exclude "$APP_DIR/storage/framework/views" \
  "$BORG_REPO::app-$(date +%Y-%m-%d_%H-%M-%S)" \
  "$APP_DIR"  
borg create \
      --stats \
      --compression lz4 \
      "$BORG_REPO::db-$(date +%Y-%m-%d_%H-%M-%S)" \
       "$TMP_DIR/db.sql"     
############################
# CLEANUP
############################

rm -rf "$TMP_DIR"

############################
# OPTIONAL PRUNE POLICY
############################

borg prune \
  --list \
  --keep-daily=7 \
  --keep-weekly=4 \
  --keep-monthly=6 \
  "$BORG_REPO"
  
