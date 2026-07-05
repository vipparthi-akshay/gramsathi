#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/services/migrations"

COMMAND="${1:-upgrade}"
REVISION="${2:-head}"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Error: Migrations directory not found at $MIGRATIONS_DIR"
    exit 1
fi

if ! command -v alembic &>/dev/null; then
    echo "Error: alembic not found. Install it: pip install alembic"
    exit 1
fi

cd "$MIGRATIONS_DIR"

case "$COMMAND" in
    upgrade)
        echo "Running migrations: upgrade $REVISION"
        alembic upgrade "$REVISION"
        echo "Migration upgrade completed successfully"
        ;;
    downgrade)
        echo "Running migrations: downgrade $REVISION"
        alembic downgrade "$REVISION"
        echo "Migration downgrade completed successfully"
        ;;
    current)
        echo "Current migration version:"
        alembic current
        ;;
    history)
        echo "Migration history:"
        alembic history
        ;;
    check)
        echo "Checking migration consistency..."
        alembic check
        echo "All migrations are consistent"
        ;;
    *)
        echo "Usage: $0 <upgrade|downgrade|current|history|check> [revision]"
        echo ""
        echo "Examples:"
        echo "  $0 upgrade head         # Migrate to latest"
        echo "  $0 upgrade +2           # Migrate up 2 revisions"
        echo "  $0 downgrade -1         # Rollback 1 revision"
        echo "  $0 downgrade abc123     # Downgrade to specific revision"
        echo "  $0 current              # Show current revision"
        echo "  $0 history              # Show all migrations"
        echo "  $0 check                # Check consistency"
        exit 1
        ;;
esac
