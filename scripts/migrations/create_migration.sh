#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/services/migrations"

DESCRIPTION="${1:-}"

if [ -z "$DESCRIPTION" ]; then
    echo "Usage: $0 \"<migration_description>\""
    echo ""
    echo "Examples:"
    echo "  $0 \"add_citizen_preferences_table\""
    echo "  $0 \"add_index_on_applications_status\""
    exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Error: Migrations directory not found at $MIGRATIONS_DIR"
    exit 1
fi

if ! command -v alembic &>/dev/null; then
    echo "Error: alembic not found. Install it: pip install alembic"
    exit 1
fi

cd "$MIGRATIONS_DIR"

echo "Creating new migration: $DESCRIPTION"
REVISION=$(alembic revision --autogenerate -m "$DESCRIPTION" 2>&1)
echo "$REVISION"

# Extract the generated filename
FILENAME=$(echo "$REVISION" | grep -oP 'Generating\s+\S+/(\S+)' | head -1 || echo "")
if [ -n "$FILENAME" ]; then
    echo ""
    echo "Migration created: services/migrations/versions/$FILENAME"
    echo "Please review and edit the generated migration before running."
else
    echo "Migration created. Check the versions directory for the new file."
fi
