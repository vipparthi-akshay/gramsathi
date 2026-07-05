# GramSathi AI — Incident Response Runbook

## Incident Severity Levels

| Severity | Label | Response Time | Examples |
|----------|-------|---------------|----------|
| P0 | Critical | < 15 min | All services down, data loss, security breach |
| P1 | High | < 1 hour | One service unavailable, degraded performance |
| P2 | Medium | < 4 hours | Feature broken for subset of users |
| P3 | Low | < 24 hours | Cosmetic issue, non-critical bug |

## Communication Channels

| Channel | Purpose |
|---------|---------|
| #gramsathi-alerts (PagerDuty) | P0/P1 automated alerts |
| #gramsathi-incident | Incident coordination |
| #gramsathi-devs | Technical discussion |
| On-call phone | Direct escalation |
| Status page | External communication |

## Incident Response Steps

### 1. Detection & Triage

```
Alert triggers (PagerDuty, Cloud Monitoring, Sentry)
        │
        ▼
Acknowledge within 5 min (P0) / 15 min (P1)
        │
        ▼
Assess severity and impact:
- How many users affected?
- Which services impacted?
- Is data at risk?
        │
        ▼
Declare incident in #gramsathi-incident
- Create incident channel
- Assign incident commander
+ P0: Executive notification
```

### 2. Containment

```
For service degradation:
    → Increase pod count: kubectl scale deployment <svc> --replicas=5
    → Enable circuit breaker if downstream dependency failing
    → Route traffic to healthy instances

For security incident:
    → Isolate affected systems from network
    → Revoke compromised credentials
    → Enable WAF block rules
    → Take disk snapshots before remediation

For data loss/corruption:
    → Stop all write operations to affected DB
    → Failover to read replica if available
    → Restore from latest backup
```

### 3. Diagnosis

| Symptom | Possible Cause | Diagnostic Command |
|---------|---------------|-------------------|
| All 5xx errors | Downstream DB down | `kubectl get pods -n gramsathi` |
| High latency | Redis full, slow queries | `redis-cli info memory`, Cloud SQL slow query log |
| OOM kills | Memory leak | `kubectl top pods`, `kubectl logs <pod> --previous` |
| Auth failures | JWT secret rotated | Check Secret Manager version |
| OCR failures | GCS bucket permissions | `gsutil iam get gs://gramsathi-documents` |
| AI failures | Gemini API quota exceeded | Check Cloud Monitoring for `quota/exceeded` |

### 4. Resolution

**Rollback steps:**
```bash
# Deploy previous stable version
kubectl rollout undo deployment/<service-name>

# Verify rollback
kubectl rollout status deployment/<service-name>

# If Helm: 
helm rollback <release> <revision>
```

**Hotfix deployment:**
```bash
# Build and push hotfix
gcloud builds submit --config=cloudbuild.yaml --substitutions=_TAG=v1.2.3-hotfix

# Deploy
kubectl set image deployment/<service> <container>=gcr.io/...:<tag>
```

### 5. Post-Mortem

```
Root cause analysis within 48 hours
        │
        ▼
Document in docs/incidents/
- Timeline of events
- Root cause
- Impact assessment
- Action items (with owners and deadlines)
        │
        ▼
Incident review meeting
- Share learnings
- Assign corrective actions
- Update runbooks
```

## Common Runbooks

### P0: Database Unreachable

1. Check connectivity: `kubectl exec <pod> -- pg_isready -h postgres -U gramsathi`
2. Check pod status: `kubectl describe pod <postgres-pod>`
3. Check PVC: `kubectl get pvc`
4. If disk full: `kubectl exec <postgres-pod> -- df -h`
5. Restart: `kubectl delete pod <postgres-pod>` (StatefulSet auto-restarts)
6. Failover to replica if primary is down > 5 min

### P0: 100% Error Rate on API Gateway

1. Check Cloud Armor: Are WAF rules blocking legitimate traffic?
2. Check rate limiting: Are we under DDoS?
3. Check upstream: Is auth service healthy?
4. Quick mitigation: Temporarily disable rate limiting (if auth issue)
5. Restore from latest Cloud Armor policy backup

### P1: AI Service Degraded

1. Check Gemini API quota: `gcloud services quota list --service=generativelanguage.googleapis.com`
2. Check Gemini API key: `kubectl get secret gemini-api-key -o jsonpath='{.data.key}' | base64 -d`
3. Increase concurrency: Scale AI service pods to 5
4. If TTS/STT failing: Fail over to backup provider
5. Reduce context window in Gemini calls (from 1M to 128K tokens)

### P2: High Notification Delivery Latency

1. Check Pub/Sub backlog: `gcloud pubsub subscriptions list`
2. Check Firebase/Twilio credentials
3. Scale notification workers: `kubectl scale deployment notification-service --replicas=3`
4. Check rate limits on WhatsApp Business API

## Monitoring Dashboards

| Dashboard | URL | Metrics |
|-----------|-----|---------|
| Overview | `https://monitoring.gramsathi.ai/d/overview` | Request rate, error rate, latency p95 |
| Services | `https://monitoring.gramsathi.ai/d/services` | Per-service CPU, memory, request count |
| Database | `https://monitoring.gramsathi.ai/d/database` | Connections, query latency, disk usage |
| AI Metrics | `https://monitoring.gramsathi.ai/d/ai` | Gemini latency, token usage, OCR success rate |
| Business | `https://monitoring.gramsathi.ai/d/business` | Registrations, applications, approvals |

## Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| Error rate spike | > 5% errors over 5 min | P1 |
| Service down | No health check response > 1 min | P0 |
| High latency | p95 > 2s over 5 min | P1 |
| Disk space | < 10% free | P2 |
| Certificate expiry | < 30 days remaining | P2 |
| Gemini quota | > 80% consumed | P2 |
| Failed logins spike | > 100 failed login/min | P1 |

## SLA Targets

| Metric | Target |
|--------|--------|
| API availability | 99.9% |
| Response time (p95) | < 1s |
| Incident response (P0) | < 15 min |
| Incident resolution (P0) | < 2 hours |
| Backup RPO | 1 hour |
| Recovery time (RTO) | 4 hours |
