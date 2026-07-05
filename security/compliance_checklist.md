# GramSathi AI — Compliance Checklist

## Information Technology Act, 2000 (India)

### Section 43 — Unauthorized Access & Data Protection
- [ ] Access control mechanisms implemented (RBAC + JWT)
- [ ] Audit trails for all data access
- [ ] Unauthorized access detection (failed login alerts)
- [ ] Data backup and recovery procedures documented
- [ ] Logs retained for minimum 90 days

### Section 66 — Computer Related Offenses
- [ ] System integrity monitoring via intrusion detection
- [ ] Tamper-proof audit logs (immutable logging)
- [ ] Digital signature verification for critical operations
- [ ] Code signing for deployed artifacts

### Section 67 — Obscene/Pornographic Content
- [ ] Content moderation on AI chat (Gemini safety filters)
- [ ] Image scanning on document upload
- [ ] Report/block mechanism for objectionable content
- [ ] Automated content filtering

### Section 72 — Privacy & Confidentiality
- [ ] PII data encrypted at rest and in transit
- [ ] Data access logged and auditable
- [ ] Employee confidentiality agreements
- [ ] Data sharing only with citizen consent

### Section 72A — Disclosure of Information
- [ ] Third-party data processing agreements
- [ ] Data minimization: only collecting necessary fields
- [ ] Consent mechanism for data sharing
- [ ] Data breach notification procedure

## MeitY Guidelines for Government Websites & Apps

### Accessibility (GIGW)
- [ ] Support for 12 Indian languages
- [ ] Voice-based interface for illiterate users
- [ ] Screen reader compatible
- [ ] Color contrast WCAG 2.1 AA
- [ ] Keyboard navigable
- [ ] Text size adjustment option
- [ ] Alt text for all images

### Security
- [ ] HTTPS enabled (TLS 1.3)
- [ ] Security headers implemented (HSTS, CSP, X-Frame-Options)
- [ ] Vulnerability assessment and penetration testing (quarterly)
- [ ] Web application firewall (Cloud Armor)

### Privacy
- [ ] Privacy policy published
- [ ] Cookie consent mechanism
- [ ] Data retention policy documented
- [ ] User data deletion mechanism

### Governance
- [ ] Content review process
- [ ] Designated content owner per section
- [ ] Regular content updates (minimum quarterly)
- [ ] Feedback mechanism for users

## Aadhaar Act / UIDAI Compliance

### Usage Restrictions
- [ ] Aadhaar used only for government scheme eligibility
- [ ] No storage of raw Aadhaar number (store only last 4 digits + hash)
- [ ] Aadhaar data not shared with third parties
- [ ] Aadhaar authentication via UIDAI API (not stored locally)
- [ ] Aadhaar masking in UI (show only last 4 digits)

### Security
- [ ] Aadhaar data in separate encrypted column
- [ ] Access to Aadhaar data logged and monitored
- [ ] Only authorized officers can view Aadhaar data
- [ ] Automatic logoff after 15 min inactivity

## IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021

### Due Diligence
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] Grievance officer appointed (name and contact published)
- [ ] Grievance redressal within 15 days
- [ ] Monthly compliance report published
- [ ] First originator information traceability for messaging

### Content Moderation
- [ ] AI content safety filters enabled
- [ ] Prohibited content detection
- [ ] User reporting mechanism
- [ ] Content takedown within 24 hours (if illegal)
- [ ] User notification on content restrictions

## Digital Personal Data Protection Act, 2023

### Data Principal Rights
- [ ] Right to access personal data
- [ ] Right to correction/updation
- [ ] Right to data portability
- [ ] Right to erasure (subject to legal retention)
- [ ] Consent management mechanism
- [ ] Notice at time of data collection

### Data Fiduciary Obligations
- [ ] Data Protection Officer appointed
- [ ] Data Protection Impact Assessment (DPIA) conducted
- [ ] Data audit every 12 months
- [ ] Purpose limitation: data used only for scheme delivery
- [ ] Storage limitation: data retained only as long as necessary
- [ ] Data breach notification (within 72 hours to DPB)

### Significant Data Fiduciary
- [ ] Register with Data Protection Board (if applicable)
- [ ] Independent data auditor appointed
- [ ] Algorithmic transparency for AI-based decisions
- [ ] Children's data processing safeguards

## SPDI Rules (Under Section 43A of IT Act)

### Sensitive Personal Data
- [ ] Aadhaar, financial info, biometrics classified as sensitive
- [ ] Explicit consent for collection and use
- [ ] Purpose specification at collection
- [ ] Reasonable security practices (ISO 27001 aligned)
- [ ] Data transfer restrictions (no cross-border without consent)

## ISO 27001:2022 Controls

### Annex A Controls
- [ ] A.5 — Information security policies documented
- [ ] A.6 — Organization of information security (roles, responsibilities)
- [ ] A.7 — Human resource security (background checks, training)
- [ ] A.8 — Asset management (inventory, classification)
- [ ] A.9 — Access control (RBAC, JIT access)
- [ ] A.10 — Cryptography (encryption standards)
- [ ] A.11 — Physical security (for on-prem infra)
- [ ] A.12 — Operations security (change management, capacity planning)
- [ ] A.13 — Communications security (TLS, network segmentation)
- [ ] A.14 — System acquisition, development, security testing (SAST/DAST)
- [ ] A.15 — Supplier relationships (third-party security assessment)
- [ ] A.16 — Incident management (IR plan, drills)
- [ ] A.17 — Business continuity (BCP/DR plan)
- [ ] A.18 — Compliance (legal, regulatory, contractual)

## Audit Schedule

| Audit | Frequency | Responsible |
|-------|-----------|-------------|
| Internal security audit | Quarterly | Security team |
| External penetration test | Bi-annual | Third-party vendor |
| Compliance review | Bi-annual | Legal + Compliance |
| ISO 27001 surveillance | Annual | External auditor |
| GIGW compliance check | Annual | Quality team |
| UIDAI compliance review | Annual | Security team |
