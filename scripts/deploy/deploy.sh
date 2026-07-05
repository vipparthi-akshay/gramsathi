#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

GAR_LOCATION="${GAR_LOCATION:-us-central1}"
GAR_REPOSITORY="${GAR_REPOSITORY:-gramsathi}"
GCP_PROJECT_ID="${GCP_PROJECT_ID:-gramsathi-prod}"
GKE_CLUSTER="${GKE_CLUSTER:-gramsathi-cluster}"
GKE_ZONE="${GKE_ZONE:-us-central1-a}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"

ENV="${1:-}"
if [ -z "$ENV" ]; then
    echo "Usage: $0 <dev|staging|prod>"
    exit 1
fi

case "$ENV" in
    dev)
        GCP_PROJECT_ID="gramsathi-dev"
        GKE_CLUSTER="gramsathi-dev-cluster"
        KUSTOMIZE_DIR="$PROJECT_ROOT/infrastructure/k8s/overlays/dev"
        TF_DIR="$PROJECT_ROOT/infrastructure/terraform/environments/dev"
        ;;
    staging)
        GCP_PROJECT_ID="gramsathi-staging"
        GKE_CLUSTER="gramsathi-staging-cluster"
        KUSTOMIZE_DIR="$PROJECT_ROOT/infrastructure/k8s/overlays/staging"
        TF_DIR="$PROJECT_ROOT/infrastructure/terraform/environments/staging"
        ;;
    prod)
        GCP_PROJECT_ID="gramsathi-prod"
        GKE_CLUSTER="gramsathi-prod-cluster"
        KUSTOMIZE_DIR="$PROJECT_ROOT/infrastructure/k8s/overlays/prod"
        TF_DIR="$PROJECT_ROOT/infrastructure/terraform/environments/prod"
        ;;
    *)
        echo "Error: Unknown environment '$ENV'. Use dev, staging, or prod."
        exit 1
        ;;
esac

echo "=== Deploying to $ENV ==="

echo "--- Checking prerequisites ---"
command -v gcloud >/dev/null 2>&1 || { echo "Error: gcloud not found"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "Error: kubectl not found"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Error: terraform not found"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: docker not found"; exit 1; }
command -v kustomize >/dev/null 2>&1 || { echo "Error: kustomize not found"; exit 1; }

gcloud auth configure-docker "$GAR_LOCATION-docker.pkg.dev" --quiet

echo "--- Applying Terraform ---"
cd "$TF_DIR"
terraform init -upgrade
terraform apply -auto-approve \
    -var="project_id=$GCP_PROJECT_ID" \
    -var="environment=$ENV"

echo "--- Getting GKE credentials ---"
gcloud container clusters get-credentials "$GKE_CLUSTER" --zone "$GKE_ZONE" --project "$GCP_PROJECT_ID"

echo "--- Building and pushing Docker images ---"
SERVICES=("auth-service" "citizen-service" "ai-service" "scheme-service" "document-service" "grievance-service" "notification-service" "analytics-service")
for SERVICE in "${SERVICES[@]}"; do
    IMAGE="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/$SERVICE"
    echo "Building $SERVICE..."
    docker build -t "$IMAGE:$IMAGE_TAG" -t "$IMAGE:latest" "$PROJECT_ROOT/services/$SERVICE"
    docker push "$IMAGE:$IMAGE_TAG"
    docker push "$IMAGE:latest"
done

APPS=("citizen-web" "admin-web")
for APP in "${APPS[@]}"; do
    IMAGE="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/$APP"
    echo "Building $APP..."
    docker build -t "$IMAGE:$IMAGE_TAG" -t "$IMAGE:latest" "$PROJECT_ROOT/apps/$APP"
    docker push "$IMAGE:$IMAGE_TAG"
    docker push "$IMAGE:latest"
done

echo "--- Deploying to GKE ---"
cd "$KUSTOMIZE_DIR"
kustomize edit set image \
    auth-service="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/auth-service:$IMAGE_TAG" \
    citizen-service="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/citizen-service:$IMAGE_TAG" \
    ai-service="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/ai-service:$IMAGE_TAG" \
    scheme-service="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/scheme-service:$IMAGE_TAG" \
    document-service="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/document-service:$IMAGE_TAG" \
    grievance-service="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/grievance-service:$IMAGE_TAG" \
    notification-service="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/notification-service:$IMAGE_TAG" \
    analytics-service="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/analytics-service:$IMAGE_TAG" \
    citizen-web="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/citizen-web:$IMAGE_TAG" \
    admin-web="$GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY/admin-web:$IMAGE_TAG"

kustomize build . | kubectl apply -f -

echo "--- Running database migrations ---"
cd "$PROJECT_ROOT/services/migrations"
alembic upgrade head

echo "--- Verifying deployment ---"
kubectl rollout status deployment -n gramsathi --all --timeout=10m

echo "-- Health checks ---"
for SERVICE in "${SERVICES[@]}"; do
    POD=$(kubectl get pod -n gramsathi -l app="$SERVICE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "$POD" ]; then
        STATUS=$(kubectl exec -n gramsathi "$POD" -- wget -qO- http://localhost:8000/health 2>/dev/null || echo "unhealthy")
        echo "$SERVICE: $STATUS"
    else
        echo "$SERVICE: no pod found"
    fi
done

echo "=== Deployment to $ENV completed successfully ==="
