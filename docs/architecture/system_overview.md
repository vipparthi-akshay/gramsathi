# GramSathi AI — System Architecture Overview

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Clients                                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │ Citizen   │  │ Admin Web    │  | WhatsApp /   │                │
│  │ Mobile App│  │ Dashboard    │  │ Voice IVR    │                │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘                │
│       │               │                  │                        │
└───────┼───────────────┼──────────────────┼────────────────────────┘
        │               │                  │
        ▼               ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Cloud Armor / Load Balancer                     │
│           (DDoS protection, WAF rules, SSL termination)           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API Gateway (Kong / GCP API Gateway)          │
│         ┌──────────────────────────────────────────────────┐      │
│         │  Rate Limiting · Auth Validation · Routing       │      │
│         │  Request Transformation · Caching               │      │
│         └──────────────────────────────────────────────────┘      │
└──────┬────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Microservices Layer                            │
│                                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Auth       │  │ Citizen    │  │ Scheme     │  │ Application│  │
│  │ Service    │  │ Service    │  │ Service    │  │ Service    │  │
│  ├────────────┤  ├────────────┤  ├────────────┤  ├────────────┤  │
│  │ Port 8001  │  │ Port 8002  │  │ Port 8004  │  │ Port 8010  │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  │
│        │               │               │               │         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Document   │  │ Grievance  │  │ Notification│  │ Analytics  │  │
│  │ Service    │  │ Service    │  │ Service    │  │ Service    │  │
│  ├────────────┤  ├────────────┤  ├────────────┤  ├────────────┤  │
│  │ Port 8005  │  │ Port 8006  │  │ Port 8007  │  │ Port 8008  │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  │
│        │               │               │               │         │
│  ┌────────────┐                                                        │
│  │ AI Service │                                                        │
│  ├────────────┤                                                        │
│  │ Port 8003  │                                                        │
│  └─────┬──────┘                                                        │
└────────┼──────────┬──────────┬──────────┬──────────┬──────────┬───────┘
         │          │          │          │          │          │
         ▼          ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│PostgreSQL│ │  Redis   │ │   GCS    │ │BigQuery  │ │ Pub/Sub  │
│ (Primary)│ │ (Cache)  │ │(Docs)    │ │(Analytics)│ │(Events)  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

## 2. Service Descriptions

| Service | Responsibility | Tech Stack | Dependencies |
|---------|---------------|------------|--------------|
| **Auth Service** | OTP login, JWT tokens, role management, citizen registration | FastAPI, PostgreSQL, Redis | Postgres, Redis |
| **Citizen Service** | Profile management, family tree, document association | FastAPI, PostgreSQL | Auth Service |
| **Scheme Service** | Scheme catalog, matching engine, eligibility checks | FastAPI, PostgreSQL, Redis | Postgres, Redis |
| **Application Service** | Application lifecycle (draft → submit → review → approve/reject) | FastAPI, PostgreSQL | Auth, Scheme |
| **Document Service** | Upload, OCR processing, verification, auto-fill | FastAPI, PostgreSQL, GCS | Postgres, GCS, AI |
| **Grievance Service** | Grievance filing, tracking, escalation, resolution | FastAPI, PostgreSQL | Postgres |
| **Notification Service** | Push, SMS, WhatsApp, email notifications | FastAPI, PostgreSQL, Firebase, Twilio | Postgres |
| **Analytics Service** | Dashboards, KPIs, realtime metrics, data export | FastAPI, BigQuery | BigQuery |
| **AI Service** | Multilingual chat, voice IVR, translation, OCR | FastAPI, Gemini API, Google STT/TTS | Redis |

## 3. Data Flow Patterns

### 3.1 Request Flow
```
Client → LB → API Gateway → Auth Middleware → Service → Database
                                │
                          (JWT Validation)
                                │
                          (Rate Limiting)
```

### 3.2 Event-Driven Async Flows (Pub/Sub)
```
Application Approved → Pub/Sub → Notification Service → Citizen (WhatsApp)
                                → Analytics Service → BigQuery
```

### 3.3 AI Pipeline Flow
```
Voice Input → AI Service (STT) → Gemini → AI Service (TTS) → Voice Output
Document Upload → AI Service (OCR) → Structured Data → Application Auto-fill
```

## 4. Deployment Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                       │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Service    │  │  Service    │  │  Service    │           │
│  │  Mesh      │  │  Pods      │  │  Pods      │           │
│  │  (Istio)   │  │  (User)    │  │  (AI)      │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  HPA       │  │  PDB       │  │  VPA       │           │
│  │  (Auto-    │  │  (Pod      │  │  (Resource │           │
│  │  scaling)  │  │  Disruption│  │  Optimizer)│           │
│  └────────────┘  └────────────┘  └────────────┘           │
└────────────────────────────────────────────────────────────┘
```

## 5. Security Architecture

| Layer | Measure |
|-------|---------|
| Network | Cloud Armor WAF, VPC, private IPs, Cloud NAT |
| Transport | TLS 1.3, mTLS between services |
| Authentication | OTP-based (phone/email), JWT access+refresh tokens |
| Authorization | Role-based (citizen, officer, admin, super_admin) |
| Secrets | GCP Secret Manager, Vault for DB credentials |
| Data at rest | AES-256 encryption, Customer-managed keys (CMEK) |
| Data in transit | TLS, mTLS, encrypted connections to DB |
| Audit | Cloud Audit Logs, structured application logging |

## 6. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Async Python (FastAPI) | High concurrency for I/O-bound operations (OCR, AI) |
| PostgreSQL per service | Data isolation, independent scaling |
| Redis for caching Session + scheme match results | Sub-100ms response for eligibility checks |
| Gemini 1.5 Pro | Multilingual support (12 Indian languages), 1M token context for document analysis |
| Pub/Sub for async events | Decouple services, reliable delivery for notifications |
| BigQuery for analytics | Efficient aggregation over large citizen/scheme datasets |

## 7. CI/CD Pipeline

```
Git Push → Cloud Build → Unit Tests → Build Images → 
  → Artifact Registry → Deploy to Dev → E2E Tests →
    → Deploy to Staging → Smoke Tests →
      → Deploy to Prod (Canary) → Rollback on Failure
```
