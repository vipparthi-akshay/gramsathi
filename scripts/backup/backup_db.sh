#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ENV="${1:-dev}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/gramsathi-backups"
BACKUP_FILE="gramsathi_${ENV}_${TIMESTAMP}.sql.gz"
MAX_BACKUPS="${MAX_BACKUPS:-30}"

case "$ENV" in
    dev)
        GCS_BUCKET="gramsathi-dev-backups"
        DB_HOST="${DB_HOST:-localhost}"
        DB_PORT="${DB_PORT:-5432}"
        DB_NAME="${DB_NAME:-gramsathi}"
        DB_USER="${DB_USER:-gramsathi}"
        DB_PASSWORD="${DB_PASSWORD:-gramsathi-dev}"
        ;;
    staging)
        GCS_BUCKET="gramsathi-staging-backups"
        DB_HOST="${DB_HOST:-staging-dbhost}"
        DB_PORT="${DB_PORT:-5432}"
        DB_NAME="${DB_NAME:-gramsathi}"
        DB_USER="${DB_USER:-gramsathi}"
        DB_PASSWORD="${DB_PASSWORD:-}"
        ;;
    prod)
        GCS_BUCKET="gramsathi-prod-backups"
        DB_HOST="${DB_HOST:-prod-dbhost}"
        DB_PORT="${DB_PORT:-5432}"
        DB_NAME="${DB_NAME:-gramsathi}"
        DB_USER="${DB_USER:-gramsathi}"
        DB_PASSWORD="${DB_PASSWORD:-}"
        ;;
    *)
        echo "Usage: $0 <dev|staging|prod>"
        exit 1
        ;;
esac

command -v pg_dump >/dev/null 2>&1 || { echo "Error: pg_dump not found"; exit 1; }
command -v gsutil >/dev/null 2>&1 || { echo "Error: gsutil not found. Install Google Cloud SDK."; exit 1; }

mkdir -p "$BACKUP_DIR"

echo "=== Database Backup: $ENV ==="
echo "Timestamp: $TIMESTAMP"
echo "Database: $DB_HOST:$DB_PORT/$DB_NAME"

export PGPASSWORD="$DB_PASSWORD"

echo "--- Creating dump ---"
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    --compress=9 \
    --verbose \
    --no-owner \
    --no-privileges \
    --file="$BACKUP_DIR/$BACKUP_FILE" \
    2>&1

BACKUP_SIZE=$(stat --format=%s "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || wc -c < "$BACKUP_DIR/$BACKUP_FILE")
echo "Backup size: $(numfmt --to=iec "$BACKUP_SIZE" 2>/dev/null || echo "$BACKUP_SIZE bytes")"

echo "--- Uploading to GCS ---"
gsutil cp "$BACKUP_DIR/$BACKUP_FILE" "gs://$GCS_BUCKET/$ENV/$BACKUP_FILE"
echo "Uploaded to gs://$GCS_BUCKET/$ENV/$BACKUP_FILE"

echo "--- Cleaning old backups ---"
gsutil ls "gs://$GCS_BUCKET/$ENV/"*.sql.gz 2>/dev/null | sort -r | while read -r OLD_FILE; do
    COUNT=$(gsutil ls "gs://$GCS_BUCKET/$ENV/"*.sql.gz 2>/dev/null | wc -l)
    if [ "$COUNT" -gt "$MAX_BACKUPS" ]; then
        OLDEST=$(gsutil ls "gs://$GCS_BUCKET/$ENV/"*.sql.gz 2>/dev/null | sort | head -1)
        echo "Removing old backup: $OLDEST"
        gsutil rm "$OLDEST"
    fi
done

echo "--- Local cleanup ---"
find "$BACKUP_DIR" -name "gramsathi_${ENV}_*.sql.gz" -mtime +7 -delete

echo "=== Backup completed successfully ==="
echo "Backup: gs://$GCS_BUCKET/$ENV/$BACKUP_FILE"
