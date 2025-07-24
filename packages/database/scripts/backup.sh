#!/bin/bash

# Database backup script for AWCRM
# Usage: ./backup.sh [database_name] [backup_directory]

set -e

# Configuration
DB_NAME=${1:-"awcrm_dev"}
BACKUP_DIR=${2:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql"

# Database connection settings
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting backup of database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Create database backup
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file="$BACKUP_FILE"

# Compress the backup file
gzip "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo "Backup completed successfully: $COMPRESSED_FILE"

# Calculate file size
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo "Backup file size: $FILE_SIZE"

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -mtime +7 -delete

echo "Backup process completed!"