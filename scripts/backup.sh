#!/bin/bash

# Morphorama Backup Script
# Backs up PostgreSQL database and uploaded files

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "🗄️  Morphorama Backup Script"
echo "==========================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL database
echo "📦 Backing up PostgreSQL database..."
docker-compose exec -T postgres pg_dump -U ${POSTGRES_USER:-morpho_user} ${POSTGRES_DB:-morphorama} > "$DB_BACKUP"
gzip "$DB_BACKUP"
echo "✅ Database backed up to: ${DB_BACKUP}.gz"
echo ""

# Backup uploaded files
echo "📂 Backing up uploaded files..."
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" backend/uploads/ 2>/dev/null || true
echo "✅ Uploads backed up to: $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
echo ""

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +7 -delete
echo "✅ Cleanup complete"
echo ""

echo "✅ Backup complete!"
echo "   Database: ${DB_BACKUP}.gz"
echo "   Uploads: $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
