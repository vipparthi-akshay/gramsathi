# GramSathi AI — Deployment Checklist

## Pre-Deployment

### Code Review
- [ ] PR approved by at least 1 senior engineer
- [ ] All tests pass (unit + integration): `pytest services/`
- [ ] Lint passes: `ruff check services/`
- [ ] Type check passes: `mypy services/`
- [ ] No secrets committed in code
- [ ] Migration reviewed (if applicable)
- [ ] API spec updated in docs/api/

### Security
- [ ] Dependency scan clean: `safety check -r services/*/requirements.txt`
- [ ] No high/critical CVEs in container images
- [ ] SonarQube quality gate passed
- [ ] OWASP ZAP scan run on staging

### Build
- [ ] Docker image built and tagged
- [ ] Image pushed to Artifact Registry
- [ ] Image scanned by Container Analysis (no critical vulns)
- [ ] Helm chart updated with new image tag

## Deployment

### Staging Deployment
- [ ] Deploy to staging namespace
- [ ] Smoke tests pass: `pytest tests/smoke/`
- [ ] E2E tests pass: `pytest tests/e2e/`
- [ ] Performance test: `locust -f tests/load/locustfile.py`
- [ ] Canary tests pass (if applicable)

### Production Deployment
- [ ] Deploy to canary (10% traffic): `kubectl set image`
- [ ] Monitor error rate for 5 min (should be < 0.1%)
- [ ] Monitor latency p95 (should be < 1s)
- [ ] Roll out to 50% for 10 min
- [ ] Roll out to 100%

### Database Migrations
- [ ] Backup taken before migration
- [ ] Migration applied: `alembic upgrade head`
- [ ] Rollback script ready: `alembic downgrade -1`
- [ ] Migration run outside peak hours
- [ ] Zero-downtime migration (expand/contract pattern)

## Post-Deployment

### Verification
- [ ] Health check passes: `curl /health`
- [ ] Readiness check passes: `curl /ready`
- [ ] All service versions confirmed: `curl /version`
- [ ] Test user flow: login → browse → apply
- [ ] Check logs for errors: `kubectl logs -l app=<service> --tail=100`

### Monitoring
- [ ] Error rate baseline normal
- [ ] P95 latency within range
- [ ] No alerts triggered in first 15 min
- [ ] Dashboard metrics updating
- [ ] Logging pipeline active

### Rollback Plan
```bash
# Fast rollback (previous revision)
kubectl rollout undo deployment/<service>

# Specific revision
kubectl rollout undo deployment/<service> --to-revision=<N>

# Helm rollback
helm rollback <release> <revision>
```

## Service-Specific Checks

| Service | Pre-Deploy | Post-Deploy |
|---------|------------|-------------|
| Auth | OTP provider credentials valid | Test login via OTP |
| Citizen | Profile schema migration OK | Test profile create/update |
| Scheme | Scheme seed data loaded | Test scheme search/match |
| Application | No pending migrations | Test submit → approve flow |
| Document | GCS bucket accessible | Test upload → OCR flow |
| Grievance | Escalation matrix loaded | Test file → track → resolve |
| Notification | Firebase/Twilio creds valid | Test push/SMS delivery |
| Analytics | BigQuery dataset exists | Test overview KPIs |
| AI | Gemini API key valid | Test chat in Hindi |

## Environment-Specific Variables

| Variable | Dev | Staging | Prod |
|----------|-----|---------|------|
| DB instance | dev-db | staging-db | prod-db |
| Redis instance | dev-redis | staging-redis | prod-redis |
| DB size | 1 vCPU, 4GB | 2 vCPU, 8GB | 8 vCPU, 32GB |
| Pod replicas | 1 | 2 | 3-5 |
| HPA min/max | 1/2 | 2/4 | 3/10 |
| Log level | DEBUG | INFO | WARNING |
| Monitoring | basic | full | full + alerts |
