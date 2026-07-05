#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

NAMESPACE="${NAMESPACE:-gramsathi}"
GAR_LOCATION="${GAR_LOCATION:-us-central1}"
GAR_REPOSITORY="${GAR_REPOSITORY:-gramsathi}"
GCP_PROJECT_ID="${GCP_PROJECT_ID:-gramsathi-prod}"
GKE_CLUSTER="${GKE_CLUSTER:-gramsathi-cluster}"
GKE_ZONE="${GKE_ZONE:-us-central1-a}"

SERVICE_NAME="${1:-}"

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: $0 <service_name>"
    echo ""
    echo "Available services:"
    kubectl get deployments -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null
    exit 1
fi

echo "=== Rolling back $SERVICE_NAME ==="

gcloud container clusters get-credentials "$GKE_CLUSTER" --zone "$GKE_ZONE" --project "$GCP_PROJECT_ID"

CURRENT_REVISION=$(kubectl rollout history deployment/"$SERVICE_NAME" -n "$NAMESPACE" | tail -2 | head -1 | awk '{print $1}' | tr -d '#')
echo "Current revision: $CURRENT_REVISION"

PREVIOUS_REVISION=$((CURRENT_REVISION - 1))
if [ "$PREVIOUS_REVISION" -lt 1 ]; then
    echo "Error: No previous revision available for $SERVICE_NAME"
    exit 1
fi

echo "Rolling back $SERVICE_NAME from revision $CURRENT_REVISION to $PREVIOUS_REVISION..."

kubectl rollout undo deployment/"$SERVICE_NAME" -n "$NAMESPACE" --to-revision="$PREVIOUS_REVISION"

echo "Waiting for rollback to complete..."
kubectl rollout status deployment/"$SERVICE_NAME" -n "$NAMESPACE" --timeout=5m

POD=$(kubectl get pod -n "$NAMESPACE" -l app="$SERVICE_NAME" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$POD" ]; then
    STATUS=$(kubectl exec -n "$NAMESPACE" "$POD" -- wget -qO- http://localhost:8000/health 2>/dev/null || echo "unhealthy")
    echo "Health check: $STATUS"
else
    echo "Warning: No pod found for $SERVICE_NAME"
fi

echo "=== Rollback completed ==="
echo "Deployment $SERVICE_NAME reverted to revision $PREVIOUS_REVISION"
