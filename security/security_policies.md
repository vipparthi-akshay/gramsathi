# GramSathi AI — Security Policies

## 1. Access Control

### 1.1 Role-Based Access Control (RBAC)

| Role | Scope | Permissions |
|------|-------|------------|
| `citizen` | Self | View profile, apply to schemes, view own applications, file grievances |
| `officer` | District | Process applications, resolve grievances, view citizen data in district |
| `admin` | State | Manage schemes, manage officers, view analytics, bulk operations |
| `super_admin` | System | User management, audit logs, system configuration, feature flags |

### 1.2 Authentication
- All API endpoints require JWT authentication (except OTP request and public scheme list)
- Access tokens expire in 15 min (prod) / 30 min (dev)
- Refresh tokens expire in 7 days
- OTP-based login with 5-min expiry
- 6-digit numeric OTP, rate-limited to 3 attempts per phone per minute
- Account lockout after 5 failed OTP attempts (30-min cooldown)

### 1.3 Multi-Factor Authentication
- Required for all officer/admin accounts
- Option: TOTP via authenticator app or hardware security key (WebAuthn)

## 2. Data Protection

### 2.1 Personally Identifiable Information (PII)
The following fields are classified as PII and require special handling:
- Full name, date of birth, gender
- Phone number, email address
- Aadhaar number, PAN number
- Address (street, city, district, state)
- Financial information (bank account details)
- Caste, religion, disability status

### 2.2 Data Classification

| Classification | Examples | Storage | Access |
|---------------|----------|---------|--------|
| Public | Scheme names, categories, ministry names | Unencrypted | No auth |
| Internal | Application status, grievance categories | Encrypted at rest | JWT + RBAC |
| Confidential | Citizen PII, document extracts | AES-256 + column-level encryption | JWT + RBAC + audit |
| Restricted | Aadhaar numbers, biometric data | Hardware encryption, access logging | Super admin only |

### 2.3 Encryption Standards
- **Data at rest**: AES-256 (Cloud SQL CMEK)
- **Data in transit**: TLS 1.3 for all external, mTLS for inter-service
- **Secrets**: GCP Secret Manager with automatic rotation
- **Database columns**: pgcrypto for Aadhaar and PAN numbers

## 3. API Security

### 3.1 Rate Limiting
| Endpoint | Limit | Burst |
|----------|-------|-------|
| `/auth/otp` | 3/min per phone | 5 |
| `/auth/verify` | 10/min per IP | 20 |
| `/ai/chat` | 30/min per user | 50 |
| General API | 120/min per user | 200 |

### 3.2 Input Validation
- All inputs validated using Pydantic models
- SQL injection prevented via ORM (SQLAlchemy async)
- XSS prevention via output encoding
- File uploads: size limit 10 MB, type whitelist (JPG, PNG, PDF)
- Request size limit: 5 MB per request

### 3.3 Headers
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=()

## 4. Network Security

### 4.1 Cloud Armor WAF Rules
SQL injection, XSS, LFI/RFI, RCE, scanner detection, geo-IP restriction (India only for citizen endpoints), rate limiting, bot detection

### 4.2 VPC Configuration
- All services in private VPC with no public IPs
- Cloud NAT for outbound traffic
- VPC Service Controls to prevent data exfiltration
- Private Google Access for GCS, BigQuery, etc.

### 4.3 Firewall Rules
| Direction | Source | Destination | Port | Purpose |
|-----------|--------|-------------|------|---------|
| Ingress | Cloud LB | GKE nodes | 8080 | HTTP traffic |
| Ingress | GKE nodes | Cloud SQL | 5432 | Database |
| Ingress | GKE nodes | Redis | 6379 | Cache |
| Egress | GKE nodes | Gemini API | 443 | AI |

## 5. Secrets Management

### 5.1 GCP Secret Manager
| Secret | Rotation | Accessors |
|--------|----------|-----------|
| JWT_SECRET_KEY | 90 days | Auth service SA |
| DB_PASSWORD | 90 days | All service SAs |
| GEMINI_API_KEY | On exposure | AI service SA |
| TWILIO_AUTH_TOKEN | On exposure | Notification SA |
| FIREBASE_PRIVATE_KEY | Annual | Notification SA |

### 5.2 Prohibited Practices
- ❌ Hardcoding secrets in code
- ❌ Storing secrets in environment variables in source code
- ❌ Logging secrets
- ❌ Committing .env files
- ❌ Sharing secrets via email/chat

## 6. Audit Logging

### 6.1 Logged Events
All RBAC actions, all PII access, login/logout (all roles), application status changes, grievance actions, document uploads/downloads, admin configuration changes, failed authentication attempts, API errors (4xx/5xx)

### 6.2 Log Retention
| Log Type | Retention | Storage |
|----------|-----------|---------|
| Application logs | 30 days | Cloud Logging |
| Audit logs | 1 year | Cloud Logging + BigQuery |
| Security alerts | 2 years | BigQuery |
| Access logs | 90 days | Cloud Logging |
| DB audit logs | 90 days | Cloud SQL audit |

### 6.3 Log Format (Structured)
```json
{
  "timestamp": "2026-07-04T10:30:00Z",
  "level": "INFO",
  "service": "auth-service",
  "trace_id": "abc123",
  "user_id": "user-uuid",
  "action": "LOGIN_SUCCESS",
  "resource": "/auth/verify",
  "status_code": 200,
  "latency_ms": 145,
  "ip_address": "203.0.113.1"
}
```

## 7. Vulnerability Management

### 7.1 Scanning Schedule
| Scan Type | Frequency | Tool |
|-----------|-----------|------|
| SAST | Every commit | SonarQube |
| Dependency scan | Every commit | Safety / Snyk |
| Container scan | Every build | GCP Container Analysis |
| DAST | Weekly | OWASP ZAP |
| Penetration test | Quarterly | External vendor |
| Bug bounty | Continuous | HackerOne |

### 7.2 Remediation SLAs
| Severity | Fix Time |
|----------|----------|
| Critical | < 24 hours |
| High | < 7 days |
| Medium | < 30 days |
| Low | < 90 days |

## 8. Incident Response

Refer to `docs/runbooks/incident_response.md` for full incident response procedures.

## 9. Compliance

Refer to `security/compliance_checklist.md` for IT Act, MeitY guidelines, and data protection compliance.

## 10. Policy Review

This policy is reviewed quarterly by the security team. Last review: July 2026.
