# GramSathi AI — Data Flow Architecture

## 1. Login & Authentication Flow

```
┌──────────┐         ┌────────────┐         ┌────────────┐         ┌──────────┐
│  Citizen  │         │  Auth      │         │   Redis    │         │PostgreSQL│
│  Mobile   │         │  Service   │         │            │         │          │
└─────┬─────┘         └─────┬──────┘         └──────┬─────┘         └────┬─────┘
      │                      │                       │                    │
      │  POST /auth/otp      │                       │                    │
      │  {phone: "98765..."} │                       │                    │
      │─────────────────────>│                       │                    │
      │                      │   Store OTP           │                    │
      │                      │──────────────────────>│                    │
      │                      │  (expires in 5 min)   │                    │
      │  200 OK              │                       │                    │
      │<─────────────────────│                       │                    │
      │                      │                       │                    │
      │  POST /auth/verify   │                       │                    │
      │  {phone, otp: 1234}  │                       │                    │
      │─────────────────────>│                       │                    │
      │                      │   Verify OTP          │                    │
      │                      │──────────────────────>│                    │
      │                      │   OTP Valid           │                    │
      │                      │<──────────────────────│                    │
      │                      │                       │                    │
      │                      │  Register/Login       │                    │
      │                      │──────────────────────────────────────────>│
      │                      │  User + Profile       │                    │
      │                      │<──────────────────────────────────────────│
      │                      │                       │                    │
      │  {access_token,      │                       │                    │
      │   refresh_token,     │                       │                    │
      │   profile}           │                       │                    │
      │<─────────────────────│                       │                    │
```

## 2. Scheme Matching & Eligibility Flow

```
┌──────────┐   ┌──────────────┐   ┌────────────┐   ┌──────────┐   ┌────────┐
│  Citizen  │   │  Scheme      │   │   Redis    │   │PostgreSQL│   │  AI    │
│  Mobile   │   │  Service     │   │            │   │          │   │Service │
└─────┬─────┘   └──────┬───────┘   └──────┬─────┘   └────┬─────┘   └───┬────┘
      │                 │                  │              │              │
      │ GET /schemes/   │                  │              │              │
      │ match?citizen=X │                  │              │              │
      │────────────────>│                  │              │              │
      │                 │ Check cache      │              │              │
      │                 │─────────────────>│              │              │
      │                 │ Cache miss       │              │              │
      │                 │<─────────────────│              │              │
      │                 │                  │              │              │
      │                 │ Get profile +    │              │              │
      │                 │ demographics     │              │              │
      │                 │────────────────────────────────>│              │
      │                 │ Profile data     │              │              │
      │                 │<────────────────────────────────│              │
      │                 │                  │              │              │
      │                 │ POST /ai/chat    │              │              │
      │                 │ "Which schemes  │              │              │
      │                 │  match this     │              │              │
      │                 │  profile?"      │              │              │
      │                 │──────────────────────────────────────────────>│
      │                 │  Matched schemes│              │              │
      │                 │<──────────────────────────────────────────────│
      │                 │                  │              │              │
      │                 │ Store in cache   │              │              │
      │                 │─────────────────>│              │              │
      │                 │                  │              │              │
      │ [matched        │                  │              │              │
      │  schemes]       │                  │              │              │
      │<────────────────│                  │              │              │
```

## 3. Document Upload & OCR Autofill Flow

```
┌────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐
│Citizen  │  │ Document   │  │   GCS    │  │  AI       │  │ Application│  │PostgreSQL│
│Mobile   │  │ Service    │  │          │  │  Service  │  │ Service    │  │          │
└───┬─────┘  └─────┬──────┘  └────┬─────┘  └─────┬─────┘  └─────┬──────┘  └────┬─────┘
    │               │               │              │              │              │
    │ POST /docs/   │               │              │              │              │
    │ upload        │               │              │              │              │
    │ (file+type)   │               │              │              │              │
    │──────────────>│               │              │              │              │
    │               │ Upload to GCS │              │              │              │
    │               │──────────────>│              │              │              │
    │               │  Signed URL   │              │              │              │
    │               │<──────────────│              │              │              │
    │               │               │              │              │              │
    │               │ POST /ai/ocr  │              │              │              │
    │               │ /process      │              │              │              │
    │               │ (image_url)   │              │              │              │
    │               │─────────────────────────────────────────────>│              │
    │               │               │              │ Process OCR  │              │
    │               │               │              │──────────────│              │
    │               │               │              │  Extracted   │              │
    │               │               │              │  fields      │              │
    │               │<─────────────────────────────────────────────│              │
    │               │               │              │              │              │
    │               │ Save metadata │              │              │              │
    │               │ + OCR result  │              │              │              │
    │               │────────────────────────────────────────────────────────────>│
    │               │               │              │              │              │
    │ {document_id, │               │              │              │              │
    │  extracted}   │               │              │              │              │
    │<──────────────│               │              │              │              │
```

## 4. Application Submission & Approval Flow

```
┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐
│  Citizen  │  │  Application │  │  Grievance │  │  Notification│  │PostgreSQL│  │ Pub/Sub│
│          │  │  Service     │  │  Service   │  │  Service     │  │          │  │        │
└─────┬─────┘  └──────┬───────┘  └──────┬─────┘  └──────┬───────┘  └────┬─────┘  └───┬────┘
      │                │                 │                │              │            │
      │ POST /apps     │                 │                │              │            │
      │ (form data)    │                 │                │              │            │
      │───────────────>│                 │                │              │            │
      │                │ Save draft      │                │              │            │
      │                │───────────────────────────────────────────────>│            │
      │                │                 │                │              │            │
      │ POST /apps/    │                 │                │              │            │
      │ X/submit       │                 │                │              │            │
      │───────────────>│                 │                │              │            │
      │                │ Status →        │                │              │            │
      │                │ submitted       │                │              │            │
      │                │───────────────────────────────────────────────>│            │
      │                │                 │                │              │            │
      │  (Officer)     │                 │                │              │            │
      │ POST /apps/    │                 │                │              │            │
      │ X/approve      │                 │                │              │            │
      │───────────────>│                 │                │              │            │
      │                │ Status →        │                │              │            │
      │                │ approved        │                │              │            │
      │                │───────────────────────────────────────────────>│            │
      │                │                 │                │              │            │
      │                │ Publish event   │                │              │            │
      │                │ application.    │                │              │            │
      │                │ approved        │                │              │            │
      │                │────────────────────────────────────────────────────────────────>│
      │                │                 │                │              │            │
      │                │                 │                │ Consume event│            │
      │                │                 │                │<──────────────────────────────│
      │                │                 │                │              │            │
      │                │                 │                │ Send WhatsApp│            │
      │                │                 │                │ + Push       │            │
      │                │                 │                │─────────────>│ (logged)   │
      │   WhatsApp     │                 │                │              │            │
      │   "Approved!"  │                 │                │              │            │
      │<───────────────│─────────────────│────────────────│              │            │
```

## 5. AI Chat & Voice IVR Flow

```
┌──────────┐    ┌────────────┐    ┌──────────┐    ┌────────────┐    ┌────────┐
│  Citizen  │    │  AI        │    │  Redis   │    │   Gemini   │    │PostgreSQL
│  Mobile   │    │  Service   │    │          │    │   API      │    │        │
└─────┬─────┘    └─────┬──────┘    └────┬─────┘    └──────┬─────┘    └────┬───┘
      │                 │                │                 │              │
      │ Voice Call      │                │                 │              │
      │──────────────>  │                │                 │              │
      │                 │ STT (Google    │                 │              │
      │                 │ Speech-to-Text)│                 │              │
      │                 │ hi → text      │                 │              │
      │                 │───────────────>│     (Hindi)     │              │
      │                 │                │                 │              │
      │                 │ Get context    │                 │              │
      │                 │───────────────>│                 │              │
      │                 │ Chat history   │                 │              │
      │                 │<───────────────│                 │              │
      │                 │                │                 │              │
      │                 │ POST prompt +  │                 │              │
      │                 │   history      │                 │              │
      │                 │─────────────────────────────────>│              │
      │                 │                │                 │              │
      │                 │ Gemini         │                 │              │
      │                 │ response       │                 │              │
      │                 │<─────────────────────────────────│              │
      │                 │                │                 │              │
      │                 │ TTS (Google    │                 │              │
      │                 │ Text-to-Speech)│                 │              │
      │                 │ text → hi audio│                 │              │
      │                 │───────────────>│                 │              │
      │                 │                │                 │              │
      │ Audio Response  │                │                 │              │
      │<────────────────│                │                 │              │
      │                 │                │                 │              │
      │                 │ Save           │                 │              │
      │                 │ conversation   │                 │              │
      │                 │────────────────────────────────────────────────>│
```

## 6. Analytics & Reporting Flow

```
┌────────────┐    ┌────────────────┐    ┌────────────┐    ┌──────────┐    ┌──────────────┐
│ Micro-     │    │  Pub/Sub       │    │  Analytics │    │ BigQuery │    │  Dashboard   │
│ services   │    │                │    │  Service   │    │          │    │  (Looker)    │
└─────┬──────┘    └───────┬────────┘    └─────┬──────┘    └────┬─────┘    └──────┬───────┘
      │                    │                    │               │               │
      │ (events emitted    │                    │               │               │
      │  by all services)  │                    │               │               │
      │───────────────────>│                    │               │               │
      │                    │  Stream events     │               │               │
      │                    │───────────────────────────────────>│               │
      │                    │                    │  Write raw    │               │
      │                    │                    │  events       │               │
      │                    │                    │──────────────>│               │
      │                    │                    │               │               │
      │                    │                    │  Scheduled    │               │
      │                    │                    │  aggregation  │               │
      │                    │                    │──────────────>│               │
      │                    │                    │  (hourly/     │               │
      │                    │                    │   daily)      │               │
      │                    │                    │               │               │
      │                    │                    │  GET /overview│               │
      │                    │                    │──────────────>│               │
      │                    │                    │  Aggregated   │               │
      │                    │                    │  KPIs         │               │
      │                    │                    │<──────────────│               │
      │                    │                    │               │               │
      │                    │                    │  GET /trends  │               │
      │                    │                    │──────────────>│               │
      │                    │                    │  Time-series  │               │
      │                    │                    │<──────────────│               │
      │                    │                    │               │               │
      │                    │                    │  Admin API    │               │
      │                    │                    │────────────────────────────────>│
      │                    │                    │  JSON KPIs    │               │
      │                    │                    │<────────────────────────────────│
```

## 7. Caching Strategy

| Cache | Type | TTL | Invalidation |
|-------|------|-----|--------------|
| OTP codes | Redis string | 5 min | Auto-expire |
| Scheme list | Redis hash | 1 hour | On scheme create/update |
| Scheme match results | Redis set | 30 min | On profile update |
| User sessions | Redis string | 24 hours | On logout |
| Eligibility rules | Redis hash | 1 day | On rule change |

## 8. Database Relationships

```
Citizen 1──M Application M──1 Scheme
  │                                    
  │                                   
  M──M Document (via citizen_id)       
  │                                   
  1──M Grievance                        
  │                                   
  1──M Notification
```

## 9. Error Handling & Retry Patterns

```
┌─────────────┐     Circuit Breaker     ┌─────────────┐
│  Service A  │ ──── 3 failures ──────> │  Service B  │
│             │                          │             │
│  Retry: 3x   │     with backoff:      │  Down       │
│  Exponential│     100ms, 500ms, 2s    │             │
└─────────────┘                          └─────────────┘
```

| Pattern | Implementation |
|---------|---------------|
| Retry with backoff | Tenacity (Python), 3 retries, exponential |
| Circuit breaker | PyBreaker, 5 failures → open 30s |
| Bulkhead | asyncio semaphores per service client |
| Timeout | 30s for regular, 120s for AI/OCR requests |
| Dead letter queue | Pub/Sub DLQ for failed events, reprocessed hourly |
