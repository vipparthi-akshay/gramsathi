# GramSathi AI

**AI-Powered Multilingual Government Assistant for Rural Citizens**

GramSathi AI is a comprehensive platform that helps rural citizens in India discover, apply for, and track government welfare schemes using AI-powered assistance in multiple Indian languages.

## Features

- **AI Chat Assistant** — Multilingual conversational AI that helps citizens find schemes, check eligibility, draft complaints, and get application help in Hindi, English, Tamil, Telugu, Marathi, and 18+ Indian languages
- **Scheme Discovery** — Personalized scheme recommendations based on citizen profile (age, income, location, caste, occupation, etc.)
- **Document OCR** — AI-powered document analysis for Aadhaar, PAN, income certificates, land records, bank passbooks, and more using Google Document AI + Gemini
- **Voice Interface** — Speech-to-text and text-to-speech support in 22 Indian languages with dialect awareness
- **Application Tracking** — Real-time status tracking for scheme applications
- **Multilingual Support** — Full UI and content in Hindi, English, Tamil, Telugu, Marathi, and more
- **Accessibility** — High contrast mode, font scaling, and voice navigation for visually impaired users
- **Grievance Redressal** — AI-assisted complaint drafting and filing for government services

## Architecture

```
gramsathi-ai/
├── apps/
│   ├── citizen-web/          # Next.js 14 — Citizen-facing web app
│   └── admin-web/            # Vite + React — Admin dashboard
├── services/
│   ├── ai-service/           # FastAPI — Gemini, Speech, Vision AI
│   ├── auth-service/         # Authentication & user management
│   ├── citizen-service/      # Citizen profile management
│   ├── scheme-service/       # Scheme catalog & eligibility engine
│   ├── document-service/     # Document upload & verification
│   ├── grievance-service/    # Complaint & grievance tracking
│   ├── notification-service/ # Push/SMS/email notifications
│   └── analytics-service/    # Usage analytics & reporting
├── infrastructure/
│   ├── terraform/            # GCP infrastructure as code
│   └── k8s/                  # Kubernetes manifests
├── ml/                       # ML models (dialect detection)
├── tests/                    # Unit, integration, e2e, and load tests
├── docs/                     # Architecture docs, runbooks, user guides
└── scripts/                  # Dev tooling & maintenance scripts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Citizen) | Next.js 14, MUI 5, Zustand, React Query, i18next, Framer Motion, Recharts |
| Frontend (Admin) | Vite, React 18, MUI 5, MUI X DataGrid, Zustand, React Query, Recharts |
| Backend Services | FastAPI, Python 3.11+ |
| AI/ML | Google Gemini, Google Speech-to-Text, Google Text-to-Speech, Google Document AI, Google Translate |
| Database | PostgreSQL (Cloud SQL) |
| Cache | Redis |
| Infrastructure | Google Cloud Platform, Terraform, Docker, Kubernetes |
| CI/CD | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Google Cloud Platform account (for AI services)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/vipparthi-akshay/gramsathi.git
cd gramsathi

# Install frontend dependencies
npm install

# Start backend services
docker-compose up -d

# Start citizen web app
npm run dev:citizen

# Start admin dashboard
npm run dev:admin
```

### Environment Setup

Copy the example environment files and configure:

```bash
cp .env.example .env.local
cp .env.production.example .env.production
```

## API Documentation

API documentation is available in:
- OpenAPI spec: `docs/api/openapi.yaml`
- Postman collection: `docs/api/postman_collection.json`

## Testing

```bash
# Run all tests
npm test

# Run service tests
npm run test:services

# Run frontend tests
npm run test:citizen
npm run test:admin

# Load tests
cd tests/load && k6 run auth_load.js
```

## Deployment

```bash
# Deploy infrastructure
cd infrastructure/terraform && terraform apply

# Deploy services
cd infrastructure/k8s && kubectl apply -k overlays/prod
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
