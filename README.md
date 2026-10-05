# 🚀 GrowthSync

<div align="center">

![GrowthSync Banner](https://img.shields.io/badge/GrowthSync-Personal%20Analytics%20Platform-4F46E5?style=for-the-badge&logo=fastapi&logoColor=white)

**An intelligent, full-stack personal analytics, decision-support, and digital-twin simulation platform unifying financial budgeting, deep-work study tracking, habit streaks, predictive forecasting, AI-driven recommendations, and interactive conversational assistance.**

*Developed by **Deep Bisen** for the **Infosys Springboard Internship**.*

---

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Caddy](https://img.shields.io/badge/Caddy-2.9-22B573?style=flat-square&logo=caddy&logoColor=white)](https://caddyserver.com/)
[![Tests](https://img.shields.io/badge/Pytest-142%20Passed-success?style=flat-square&logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Option A: Quick Local Development (Venv + Vite)](#option-a-quick-local-development)
  - [Option B: Containerized Deployment (Docker Compose + Caddy)](#option-b-containerized-deployment-docker-compose)
- [Environment Configuration](#-environment-configuration)
- [Verification & Quality Assurance](#-verification--quality-assurance)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Milestone Roadmap](#-milestone-roadmap)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🌟 Overview

**GrowthSync** bridges the gap between daily personal tracking and actionable predictive intelligence. Rather than isolating personal finances, daily habits, and study productivity into disconnected silos, GrowthSync synthesizes them into an integrated operational dashboard and decision-support engine.

By modeling user historical data through regression trend fitting, heuristic evaluation, and digital twin simulation algorithms, GrowthSync empowers users to:
1. **Unify Operational Visibility**: Track finances, expenses, study hours, and daily habits in one responsive interface.
2. **Forecast Future Trajectories**: Project savings curves, academic progress, and habit consistency using time-series regression.
3. **Simulate Scenarios with Digital Twins**:
   - **Financial Twin**: Simulate savings balances, discretionary spending cuts, and runway projections over 30, 60, and 90-day horizons.
   - **Routine Twin**: Evaluate trade-offs between daily study volume, sleep targets, and habit adherence scores.
4. **Actionable AI Recommendations**: Receive tailored, rule-based and LLM-synthesized advice to optimize productivity and spending.
5. **Context-Grounded Conversational Assistant**: Interact with an AI assistant that queries verified user history and scenario models with resilient offline heuristics and Google Gemini integration.

---

## 🎯 Key Features

### 📊 Unified Executive Dashboard
- **Real-Time KPI Cards**: High-level visibility into total monthly savings, active habit completion rates, average study hours, and composite productivity index.
- **Recent Activity Feed**: Real-time event logging capturing study sessions, financial transactions, and completed habits.
- **Dynamic Charting**: Interactive visualizations of weekly time distribution, expense breakdowns, and score trajectories.

### 💰 Financial & Expense Management
- **Budget & Cash Flow Tracking**: Log monthly income, recurring commitments, and dynamic expense categorizations (Housing, Food, Tech, Leisure, etc.).
- **Net Balance & Liquidity**: Automatic tracking of savings ratios, expense-to-income distribution, and liquidity trends.

### 📚 Study & Deep-Work Sessions
- **Subject-Specific Logging**: Track topic, duration, productivity rating, and notes.
- **Academic Pacing**: Aggregate total hours studied across subjects to ensure target goals are consistently met.

### ⚡ Habit Tracking & Streak Engine
- **Daily Adherence Tracking**: Track critical habits (fitness, reading, coding, meditation).
- **Streak Calculation**: Visual feedback on current and longest streaks to maintain daily discipline.

### 🔮 Predictive Analytics & Forecasting
- **Linear Trend Regression**: Statistical projection of personal finance savings curves and study-hour trends fitted strictly to verified personal historical logs.
- **Productivity & Risk Scoring**: Weighted heuristic scoring combining habit consistency, study volume, and financial discipline to compute a balanced Growth Index.

### 🧪 Dual Digital Twin Scenario Simulators
- **Financial Digital Twin (`/api/simulation/financial-twin`)**:
  - Run deterministic and stochastic what-if scenarios on monthly income, discretionary budget adjustments, and unexpected expenses.
  - Multi-month runway projections (30, 60, 90 days) with net savings delta calculations.
- **Routine Digital Twin (`/api/simulation/routine-twin`)**:
  - Simulate daily routines across study hours, sleep hours, and habit consistency.
  - Models projected burnout risk, academic pacing, and composite productivity balance before adopting schedule adjustments.

### 💡 AI Recommendations & Insights Engine (`/api/simulation/recommendations`)
- Automated detection of spending anomalies, study pacing deficits, and habit streak drop-offs.
- Multi-tier synthesis providing immediate actions, preventative cautions, and positive reinforcers.
- Built-in heuristic intelligence with optional Google Gemini LLM synthesis.

### 🤖 GrowthSync AI Assistant & Floating Chat (`/api/chat`)
- **Evidence-Grounded Assistant**: Queries verified user metrics, active habits, and recent study logs to answer user questions accurately without hallucinations.
- **Scenario Integration**: Automatically runs financial and routine simulations when asked what-if questions.
- **Resilient Fallback Architecture**: Seamlessly operates in offline heuristic mode when an external LLM API key is not supplied.
- **Modern UI Widget**: Available both as an embedded dashboard feature and as a floating expandable assistant.

### 🐳 Production-Ready Containerization
- **Multi-Service Docker Compose**: Orchestrates PostgreSQL 16 Alpine, FastAPI backend, and Caddy reverse proxy.
- **Automatic TLS & Same-Origin Proxy**: Caddy routes API requests and serves static assets under a unified origin.
- **Hardened Security**: Strict CORS checks, HTTP-only secure cookies, non-root user execution, and database connection timeouts.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Browser["User Browser / Client"]
        UI[React 19 + Vite Dashboard]
        Sim[Digital Twin Simulators]
        Chat[GrowthSync Chat Widget]
        Recom[AI Recommendations Card]
    end

    subgraph Gateway["Reverse Proxy & Web Server"]
        Caddy[Caddy 2.9 Web Proxy]
    end

    subgraph Backend["FastAPI Application Server"]
        Router[API Router & Auth Middleware]
        
        subgraph CoreServices["Domain Services"]
            AuthSvc[Auth & Profile Service]
            FinSvc[Financial & Expense Engine]
            HabitSvc[Habit & Streak Tracker]
            StudySvc[Study Analytics Engine]
            TwinSvc[Routine & Financial Twins]
            RecSvc[AI Recommendations Engine]
            ChatSvc[Context-Grounded Chat Service]
        end

        subgraph ML["Analytics & Intelligence"]
            LinReg[Scikit-Learn Trend Regression]
            Scoring[Productivity & Risk Heuristics]
            LLM[Gemini Provider + Heuristic Fallback]
        end
    end

    subgraph Persistence["Storage & External"]
        PG[(PostgreSQL 16 Database)]
        GeminiAPI[Google Gemini API]
    end

    UI -->|HTTP / SPA| Caddy
    Sim -->|HTTP / SPA| Caddy
    Chat -->|HTTP / SPA| Caddy
    Recom -->|HTTP / SPA| Caddy

    Caddy -->|/api/*| Router
    Caddy -->|Static Assets| UI

    Router --> CoreServices
    CoreServices --> ML
    CoreServices -->|SQLAlchemy ORM| PG
    LLM -.->|Optional API Call| GeminiAPI
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Lucide React, Axios, Modern Responsive Vanilla CSS Design System |
| **Backend Framework** | FastAPI, Uvicorn, Pydantic v2 (Settings & BaseModels), Python-Multipart, PyJWT, Passlib (Bcrypt) |
| **Database & ORM** | PostgreSQL 16, SQLAlchemy 2.0, Psycopg2 |
| **Analytics & ML** | NumPy, Pandas, Scikit-Learn (Linear Regression & Trend Modeling), Joblib |
| **AI & LLM Services** | Google Gemini API (`gemini-3.6-flash`), Deterministic Rule-Based Heuristic Fallback |
| **Container & Proxy** | Docker, Docker Compose, Caddy 2.9 (Reverse Proxy & Automatic HTTPS) |
| **Testing & Quality** | Pytest (142 automated tests), Unittest, Ruff (Python Linting), Oxlint (Frontend Linting) |

---

## 📁 Repository Structure

```text
GrowthSync/
├── backend/
│   ├── app/
│   │   ├── core/                    # Security utils, password hashing, JWT helpers
│   │   ├── models/                  # SQLAlchemy models (User, Expense, Habit, Study, etc.)
│   │   ├── schemas/                 # Pydantic schemas (auth, chat, simulation, routine twin)
│   │   ├── routes/                  # REST endpoints (auth, analytics, simulation, chat, etc.)
│   │   ├── services/                # Business logic (chat_service, routine_twin, ai_recommendations, llm_provider)
│   │   ├── ml/                      # Trend fitting, risk scoring, and student data preprocessing
│   │   ├── config.py                # Pydantic settings with production validation
│   │   ├── database.py              # PostgreSQL engine & session lifecycle
│   │   └── main.py                  # FastAPI application entrypoint & middleware setup
│   ├── tests/                       # 142 unit & integration test cases
│   ├── requirements.txt             # Core Python dependencies
│   └── requirements.lock.txt        # Pinned lockfile with validated versions
├── frontend/
│   ├── src/
│   │   ├── api/                     # Configured Axios client with base URLs
│   │   ├── components/              # Reusable UI components:
│   │   │   ├── FloatingChat.jsx     # Expandable floating assistant widget
│   │   │   ├── GrowthSyncChat.jsx   # Interactive chat interface & assumption fields
│   │   │   ├── RoutineSimulator.jsx # Routine digital twin sliders & controls
│   │   │   ├── SimulatorSummary.jsx # Scenario impact metrics & visual feedback
│   │   │   ├── AIRecommendations.jsx# Dynamic insight alerts & suggestions
│   │   │   └── DashboardData.jsx    # Metric cards & data visualizations
│   │   ├── hooks/                   # Custom React hooks (useAIProvider, etc.)
│   │   ├── pages/                   # Application views (Dashboard, Simulator, FinancialSimulator, etc.)
│   │   ├── App.jsx                  # Main router and navigation layout
│   │   └── index.css                # Polished design tokens, glassmorphism, responsive utilities
│   ├── package.json                 # Node dependencies & scripts
│   └── vite.config.js               # Vite build configuration
├── deploy/
│   ├── Dockerfile.backend           # Multi-stage lightweight Python backend image
│   ├── Dockerfile.web               # Multi-stage Vite build + Caddy web server
│   └── Caddyfile                    # Caddy reverse proxy & security headers configuration
├── compose.yaml                     # Production & local Docker Compose stack
├── datasets/                        # Example and sanitized benchmarking datasets
├── docs/
│   ├── MILESTONES.md                # Feature deliverables and roadmap tracking
│   ├── MILESTONE_4_CHANGES.md       # Implementation notes for Milestone 4
│   ├── MILESTONE_4_DEPLOYMENT.md    # Production deployment and backup guide
│   └── CLEANUP_REPORT.md            # Code quality and audit logs
├── .dockerignore                    # Build exclusion rules for Docker images
├── .env.example                     # Environment template for local Python development
├── .env.docker.example              # Environment template for Docker Compose
├── .gitignore                       # Multi-layer git ignore rules
└── README.md                        # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: Version 3.10+ (tested through 3.13)
- **Node.js**: Version 18.x or 20.x+
- **PostgreSQL**: Version 15+ (or Docker)
- **Docker & Docker Compose** *(optional, for containerized run)*

---

### Option A: Quick Local Development

#### 1. Backend Setup

1. **Create and activate a virtual environment**:
   ```powershell
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
   *For macOS/Linux:*
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables**:
   ```powershell
   Copy-Item .env.example .env
   ```
   Update `.env` with your PostgreSQL credentials, and generate a secure `SECRET_KEY`:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
   *(Optional)* Add `GEMINI_API_KEY` if you wish to enable live Gemini LLM responses. If omitted, the platform runs in intelligent offline heuristic mode.

4. **Initialize the Database**:
   ```bash
   python backend/verify_db_conn.py
   python backend/init_db.py
   ```

5. **Start the FastAPI Backend**:
   ```bash
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```
   - API Server: `http://localhost:8000`
   - Swagger Documentation: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

#### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   - Web Application: `http://localhost:5173`

---

### Option B: Containerized Deployment (Docker Compose)

Deploy the entire stack (PostgreSQL + FastAPI + Caddy Web Server) with a single command:

1. **Prepare the Docker environment file**:
   ```powershell
   Copy-Item .env.docker.example .env.docker
   ```

2. **Generate secure passwords and secrets**:
   ```powershell
   python -c "import secrets; print('POSTGRES_PASSWORD=' + secrets.token_hex(16)); print('SECRET_KEY=' + secrets.token_hex(32))"
   ```
   Paste the generated values into `.env.docker`.

3. **Build and launch the containers**:
   ```bash
   docker compose --env-file .env.docker up --build -d
   ```

4. **Access the application**:
   - Web App & API Gateway: `http://localhost:8080`
   - Health Check: `http://localhost:8080/health`
   - Container Status: `docker compose --env-file .env.docker ps`

5. **Stop containers**:
   ```bash
   docker compose --env-file .env.docker down
   ```

---

## ⚙️ Environment Configuration

### Local Development (`.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy PostgreSQL connection URI | `postgresql+psycopg2://postgres:password@localhost:5432/infosys_deep` |
| `SECRET_KEY` | Cryptographic secret for signing JWT tokens | *Generated 64-character hex string* |
| `ALGORITHM` | Cryptographic algorithm for JWT signatures | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Session token validity window | `1440` (24 Hours) |
| `ENVIRONMENT` | Runtime mode (`development` / `production`) | `development` |
| `ALLOWED_ORIGINS` | Comma-delimited CORS allowed origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `FRONTEND_URL` | Base URL of the client application | `http://localhost:5173` |
| `PORT` | Backend uvicorn server port | `8000` |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key for LLM chat | `""` (Empty defaults to offline heuristic fallback) |
| `GEMINI_MODEL` | Google Gemini model identifier | `gemini-3.6-flash` |

### Docker Compose (`.env.docker`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `POSTGRES_PASSWORD` | Password for PostgreSQL `growthsync` user | *Required strong secret* |
| `SECRET_KEY` | JWT signing key (min 32 characters) | *Required strong secret* |
| `ENVIRONMENT` | Deployment environment | `development` or `production` |
| `FRONTEND_URL` | Public frontend URL | `http://localhost:8080` |
| `SITE_ADDRESS` | Caddy listening address or domain name | `:80` (or `growthsync.example.com`) |
| `WEB_HTTP_PORT` | Host HTTP listening port | `8080` (or `80`) |
| `WEB_HTTPS_PORT` | Host HTTPS listening port | `8443` (or `443`) |
| `GEMINI_API_KEY` | *(Optional)* Gemini API Key | `""` |
| `GEMINI_MODEL` | Gemini model name | `gemini-3.6-flash` |

---

## 🧪 Verification & Quality Assurance

GrowthSync includes a comprehensive test suite covering authentication, data tracking, scenario simulation, chat grounding, and configuration constraints:

```bash
# 1. Run all 142 backend unit and integration tests
pytest backend/tests -v

# 2. Run specific service test suites
pytest backend/tests/test_chat.py -v
pytest backend/tests/test_routine_twin.py -v
pytest backend/tests/test_ai_recommendations.py -v
pytest backend/tests/test_deployment_config.py -v

# 3. Lint Python files with Ruff
ruff check backend

# 4. Lint Frontend codebase with Oxlint
npm --prefix frontend run lint

# 5. Verify Frontend Production Build
npm --prefix frontend run build
```

---

## 🔌 API Endpoints Overview

| Area | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **System** | `GET` | `/health` | Application & database connectivity health check |
| **Auth** | `POST` | `/api/auth/register` | Register a new user account |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue secure HTTP-only cookie |
| **Auth** | `POST` | `/api/auth/logout` | Invalidate active user session |
| **Auth** | `POST` | `/api/auth/forgot-password` | Request password reset token |
| **Auth** | `POST` | `/api/auth/reset-password` | Complete password reset with token |
| **User** | `GET` / `PUT`| `/api/users/me` | Fetch or update user profile information |
| **Finance** | `GET` / `POST`| `/api/financial/` | Retrieve and record monthly income & savings goals |
| **Expenses**| `GET` / `POST`| `/api/expenses/` | Fetch breakdown & record new categorized expenses |
| **Expenses**| `DELETE` | `/api/expenses/{id}` | Remove specific expense item |
| **Study** | `GET` / `POST`| `/api/study/` | Log study sessions and view subject allocations |
| **Habits** | `GET` / `POST`| `/api/habits/` | Track daily habits, completions, and streaks |
| **Analytics**| `GET` | `/api/analytics/dashboard` | Aggregated metrics, scores, and recent activity |
| **Analytics**| `GET` | `/api/analytics/forecast` | Personal time-series regression projections |
| **Simulation**| `POST`| `/api/simulation/what-if` | Scenario projection based on input parameters |
| **Simulation**| `POST`| `/api/simulation/financial-twin`| Multi-month digital twin financial runway projection |
| **Simulation**| `POST`| `/api/simulation/routine-twin` | Daily study/sleep/habit digital twin scenario model |
| **Simulation**| `GET` | `/api/simulation/recommendations` | AI-generated recommendations and risk insights |
| **Chat** | `POST` | `/api/chat/` | Context-aware AI chat assistant with scenario modeling |
| **Data** | `GET` | `/api/datasets/export/csv` | Export user activity records as downloadable CSV |

Interactive Swagger documentation is available at `http://localhost:8000/docs` (or via Caddy at `/docs` when deployed).

---

## 🗺️ Milestone Roadmap

- [x] **Milestone 1: Core Foundation & Data Collection**
  - Secure authentication flow (JWT, Bcrypt, HTTP-only cookies).
  - Profile management, password recovery, and session guard.
  - Multi-module tracking: Financials, Expenses, Study Sessions, and Daily Habits.
  - Audit timeline logging and CSV export utility.

- [x] **Milestone 2: Analytics, Forecasting & Simulation**
  - Statistical feature engineering and rolling metric aggregations.
  - Linear regression trend fitting on personal historical logs.
  - Growth & Productivity composite scoring index.
  - Interactive What-If Scenario Simulator for personal decision support.

- [x] **Milestone 3: Financial Digital Twin & Scenario Modeling**
  - Advanced Financial Digital Twin (`/api/simulation/financial-twin`) for multi-month runway forecasting.
  - Discretionary budget tuning and savings delta impact calculation.
  - Dataset preparation pipelines and academic benchmark evaluation.

- [x] **Milestone 4: Routine Twin, AI Recommendations, Assistant Chat & Deployment**
  - Routine Twin Simulator (`/api/simulation/routine-twin`) modeling study, sleep, and habit consistency trade-offs.
  - AI Recommendations Engine (`/api/simulation/recommendations`) providing personalized behavioral nudges.
  - Conversational AI Assistant (`/api/chat`) with ground-truth verification and heuristic/Gemini fallback.
  - Multi-container Docker Compose deployment with Caddy reverse proxy and automatic HTTPS.
  - Tested dependency lockfile (`backend/requirements.lock.txt`) and 142 automated tests passing.

---

## 📄 License & Acknowledgements

This project was engineered by **Deep Bisen** as part of the **Infosys Springboard Internship** program.

Distributed under the **MIT License**. See `LICENSE` for details.
