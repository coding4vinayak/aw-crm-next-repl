#!/bin/bash

# Database restore script for AWCRM
# Usage: ./restore.sh [backup_file] [target_database]

set -e

# Configuration
BACKUP_FILE=${1}
TARGET_DB=${2:-"awcrm_dev"}

# Database connection settings
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}

# Validate input
if [ -z "$BACKUP_FILE" ]; then
    echo "Error: Backup file is required"
    echo "Usage: ./restore.sh [backup_file] [target_database]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file does not exist: $BACKUP_FILE"
    exit 1
fi

echo "Starting restore process..."
echo "Backup file: $BACKUP_FILE"
echo "Target database: $TARGET_DB"

# Check if backup file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    TEMP_FILE=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Drop existing database (with confirmation)
read -p "This will drop the existing database '$TARGET_DB'. Are you sure? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Dropping existing database..."
    dropdb --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" "$TARGET_DB" || true
    
    echo "Creating new database..."
    createdb --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" "$TARGET_DB"
    
    echo "Restoring database from backup..."
    psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$TARGET_DB" \
        --file="$RESTORE_FILE" \
        --verbose
    
    echo "Database restore completed successfully!"
else
    echo "Restore cancelled."
    exit 0
fi

# Clean up temporary file
if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm "$TEMP_FILE"
fi

echo "Restore process completed!"