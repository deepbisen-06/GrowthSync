# 🚀 GrowthSync

<div align="center">

![GrowthSync Banner](https://img.shields.io/badge/GrowthSync-Personal%20Analytics%20Platform-4F46E5?style=for-the-badge&logo=fastapi&logoColor=white)

**An intelligent, full-stack personal analytics, decision-support, and digital-twin simulation platform unifying financial budgeting, deep-work tracking, habit streaks, predictive forecasting, AI-driven recommendations, and conversational assistance.**

*Developed by **Deep Bisen** for the **Infosys Springboard Internship**.*

---

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Caddy](https://img.shields.io/badge/Caddy-2.9-22B573?style=flat-square&logo=caddy&logoColor=white)](https://caddyserver.com/)
[![Tests](https://img.shields.io/badge/Pytest-142%20Passed-success?style=flat-square&logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![Code Style](https://img.shields.io/badge/Code%20Style-Ruff-000000?style=flat-square&logo=ruff&logoColor=white)](https://github.com/astral-sh/ruff)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Digital Twin & Analytics Methodology](#-digital-twin--analytics-methodology)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Option A: Quick Local Development (Venv + Vite)](#option-a-quick-local-development)
  - [Option B: Containerized Deployment (Docker Compose + Caddy)](#option-b-containerized-deployment-docker-compose)
- [Environment Configuration](#-environment-configuration)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Verification & Quality Assurance](#-verification--quality-assurance)
- [Milestone Roadmap](#-milestone-roadmap)
- [Contributing](#-contributing)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🌟 Overview

**GrowthSync** addresses a pervasive issue in personal productivity: data fragmentation. While individuals frequently track their personal budgets, academic study sessions, and daily wellness habits across multiple disjointed applications, these tools operate in isolation without offering cohesive decision intelligence.

GrowthSync unifies these critical life verticals into an integrated operational dashboard and decision-support engine. By combining verified personal logs with statistical regression, rule-based heuristics, digital twin scenario simulations, and grounded AI models, GrowthSync provides actionable intelligence rather than static record-keeping.

### Core Value Propositions
1. **Unified Visibility**: Centralizes personal finances, categorized expenses, deep-work study hours, and daily wellness habits into a single executive dashboard.
2. **Interactive Visual Analytics**: Delivers responsive SVG trend charts across financial savings, study intensity, and habit adherence with focused inspection tooltips.
3. **Dual Digital Twin Simulators**:
   - **Financial Twin**: Models multi-month liquidity, discretionary spending adjustments, and cash runway projections across 30, 60, and 90-day horizons.
   - **Routine Twin**: Simulates daily schedule variations (study volume, sleep duration, habit targets) to predict academic pacing and burnout risk before committing to lifestyle changes.
4. **Actionable AI Recommendations**: Automatically surfaces anomalies, discipline lapses, and positive momentum indicators through a tiered nudge framework.
5. **Context-Grounded Conversational AI**: Offers a floating and dashboard-embedded AI assistant that queries verified database metrics to prevent hallucinations, backed by Google Gemini and an offline deterministic heuristic fallback.

---

## 🎯 Key Features

### 📊 Executive Analytics & Interactive Growth Visualizer
- **High-Impact KPI Cards**: Real-time summary of net monthly savings, active habit adherence rates, weekly study volume, and composite Growth Index.
- **Interactive SVG Growth Graphs**: Dedicated trendlines and bar graphs for savings, study sessions, and wellness metrics (sleep, screen time, exercise) with keyboard and mouse inspection.
- **Activity Stream**: Chronological event audit log tracking financial transactions, study milestones, and habit check-ins.

### 💰 Financial & Expense Intelligence
- **Cash Flow & Budget Tracking**: Capture monthly gross income, baseline commitments, and dynamic expense categories (Housing, Utilities, Food, Tech, Leisure, etc.).
- **Net Balance & Liquidity Curves**: Automatic calculation of savings ratios, discretionary burn rates, and rolling runway indicators.

### 📚 Deep-Work & Study Pacing
- **Subject-Specific Session Logging**: Record subject modules, duration, subjective productivity ratings (1–5 scale), and session reflection notes.
- **Academic Pacing Analysis**: Monitor cumulative study volume against target benchmarks to maintain consistent exam readiness.

### ⚡ Habit Tracking & Streak Engine
- **Daily Discipline Logging**: Daily tracking of key personal habits (Coding, Reading, Exercise, Meditation, Sleep, Screen Time).
- **Streak Calculation**: Continuous computation of active streaks, historical peak streaks, and completion percentages.

### 🔮 Statistical Forecasting & Growth Index
- **Linear Trend Regression**: Statistical projection of personal finance trajectory and study volume curves using Scikit-Learn ordinary least squares (OLS) regression fitted to historical logs.
- **Growth & Risk Scoring**: Composite index synthesizing habit consistency (40%), study volume (35%), and financial discipline (25%) into an actionable 0–100 score.

### 🧪 Dual Digital Twin Scenario Simulators
- **Financial Digital Twin (`/api/simulation/financial-twin`)**:
  - Simulates the downstream impact of income shocks, discretionary budget cuts, and unanticipated capital outlays.
  - Generates 30, 60, and 90-day cash balance projections and net savings deltas.
- **Routine Digital Twin (`/api/simulation/routine-twin`)**:
  - Evaluates trade-offs between planned daily study hours, sleep targets, and habit consistency.
  - Computes predictive burnout risk scores, academic completion pacing, and balanced routine stability.

### 💡 AI Recommendations & Insights Engine (`/api/simulation/recommendations`)
- Automated detection of spending spikes, habit streak decay, and study pacing deficits.
- Multi-tier insight categorization: **Immediate Actions**, **Preventative Cautions**, and **Positive Reinforcements**.
- Deterministic heuristic logic with optional Google Gemini LLM synthesis.

### 🤖 Grounded AI Chat Assistant (`/api/chat`)
- **Zero-Hallucination Architecture**: Grounded in the user's verified database state and simulated digital twin projections.
- **Dual Form Factor**: Available both as an embedded dashboard interface and as an expandable floating widget (`FloatingChat.jsx`).
- **Resilient Fallback Mode**: Gracefully transitions to rule-based heuristic generation when an external LLM key is omitted or unreachable.

### 🐳 Production-Hardened Deployment Stack
- **Multi-Container Docker Architecture**: Configured via `compose.yaml` with PostgreSQL 16 Alpine, FastAPI ASGI server, and Caddy 2.9 reverse proxy.
- **Automated TLS & Reverse Proxying**: Caddy serves static frontend production bundles and proxies `/api/*` requests under a single origin.
- **Security Hardening**: HttpOnly session cookies, non-root container users, parameterized SQL queries, Bcrypt password hashing, and CORS filtering.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client["Client Tier (User Browser)"]
        UI[React 19 + Vite Dashboard]
        Graphs[Interactive SVG Trend Visualizer]
        Twins[Digital Twin Simulators]
        ChatWidget[Floating & Embedded Chat]
        Insights[AI Recommendations Card]
    end

    subgraph Gateway["Gateway & Reverse Proxy Tier"]
        Caddy[Caddy 2.9 Web Server / Reverse Proxy]
    end

    subgraph Backend["Application Server Tier (FastAPI)"]
        Router[API Gateway & Router]
        AuthGuard[JWT Auth Guard & Security Middleware]
        
        subgraph DomainServices["Domain Service Layer"]
            AuthSvc[Auth & Profile Service]
            FinSvc[Finance & Expense Engine]
            HabitSvc[Habit & Streak Tracker]
            StudySvc[Study Analytics Engine]
            TwinSvc[Digital Twin Simulation Engine]
            RecSvc[AI Recommendations Engine]
            ChatSvc[Context-Grounded Chat Service]
        end

        subgraph ML["Analytics & Intelligence Engines"]
            RegModel[Scikit-Learn OLS Regression]
            RiskEngine[Burnout & Growth Scoring Heuristics]
            LLMProvider[Gemini 3.6 Flash / Heuristic Fallback]
        end
    end

    subgraph Storage["Persistence & External Services"]
        PG[(PostgreSQL 16 Database)]
        Gemini[Google Gemini API]
    end

    UI -->|HTTPS / REST| Caddy
    Graphs -->|Data Bindings| UI
    Twins -->|HTTP / REST| Caddy
    ChatWidget -->|HTTP / REST| Caddy
    Insights -->|HTTP / REST| Caddy

    Caddy -->|/api/*| Router
    Caddy -->|Static Assets / SPA| UI

    Router --> AuthGuard
    AuthGuard --> DomainServices
    DomainServices --> ML
    DomainServices -->|SQLAlchemy 2.0 ORM| PG
    LLMProvider -.->|Optional External API Call| Gemini
```

---

## 🔬 Digital Twin & Analytics Methodology

### 1. Trend Regression Modeling
GrowthSync fits verified historical entries to linear trend models using Scikit-Learn:
$$\hat{y}(t) = \beta_0 + \beta_1 t$$
Where $t$ represents elapsed days from baseline. The model projects 30-day future financial balance trajectories and study completion pace. If fewer than 2 distinct observations exist, conservative historical mean interpolation is used.

### 2. Composite Growth Index
Personal growth is quantified through a weighted, bounded composite index:
$$\text{Growth Index} = w_{\text{habit}} \cdot S_{\text{habit}} + w_{\text{study}} \cdot S_{\text{study}} + w_{\text{finance}} \cdot S_{\text{finance}}$$
- **Habit Adherence ($w_{\text{habit}} = 0.40$)**: Rolling 30-day habit completion percentage.
- **Study Pacing ($w_{\text{study}} = 0.35$)**: Normalized study volume relative to academic targets.
- **Financial Discipline ($w_{\text{finance}} = 0.25$)**: Savings ratio relative to net income.

### 3. Digital Twin Burnout Risk Formulation
The Routine Twin computes burnout risk based on excessive cognitive load and sleep deficits:
$$\text{Burnout Risk} = \max\left(0, \min\left(100, \, \Delta_{\text{sleep}} \cdot 18 + \Delta_{\text{study}} \cdot 12 - \text{Adherence} \cdot 10\right)\right)$$
Where $\Delta_{\text{sleep}} = \max(0, 7.5 - \text{Sleep Hours})$ and $\Delta_{\text{study}} = \max(0, \text{Study Hours} - 6.0)$.

---

## 💻 Technology Stack

| Layer | Technologies & Libraries | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite 8, Lucide React, Axios | Reactive component hierarchy and state management |
| **Styling & Design** | Pure Modern CSS, Design Tokens, Glassmorphism | Custom design system with zero external UI framework dependencies |
| **Backend Framework** | FastAPI 0.115+, Uvicorn 0.34+, Pydantic v2 | High-throughput asynchronous REST API and schema validation |
| **Authentication** | PyJWT, Passlib (Bcrypt), HttpOnly Cookies | Stateless cryptographic token auth with secure cookie lifecycle |
| **Database & ORM** | PostgreSQL 16 Alpine, SQLAlchemy 2.0, Psycopg2 | Relational schema persistence and query abstraction |
| **Data Science & ML** | NumPy, Pandas, Scikit-Learn, Joblib | Time-series regression, statistical feature extraction, model inference |
| **AI Integration** | Google Gemini API (`gemini-3.6-flash`), Heuristic Fallback | Grounded natural language conversational synthesis and advice generation |
| **Reverse Proxy & TLS** | Caddy 2.9 | Automated TLS certificates, security headers, and API proxy routing |
| **Containerization** | Docker, Docker Compose | Multi-container reproducible production deployment |
| **Code Quality & Testing** | Pytest (142 tests), Ruff, Oxlint | End-to-end automated testing, verification, and code linting |

---

## 📁 Repository Structure

```text
GrowthSync/
├── backend/
│   ├── app/
│   │   ├── core/                    # Security utilities, JWT token encoding/decoding, password hashing
│   │   ├── models/                  # SQLAlchemy ORM database models (User, Expense, Habit, Study, etc.)
│   │   ├── schemas/                 # Pydantic schemas (auth, chat, simulation, routine twin, validation)
│   │   ├── routes/                  # REST API endpoints (auth, analytics, simulation, chat, datasets)
│   │   ├── services/                # Business logic (chat_service, routine_twin, ai_recommendations, llm_provider)
│   │   ├── ml/                      # Trend fitting, risk scoring, student dataset preprocessing
│   │   ├── config.py                # Pydantic Settings with strict validation
│   │   ├── database.py              # PostgreSQL engine and session factory
│   │   └── main.py                  # FastAPI application entrypoint & middleware configuration
│   ├── tests/                       # 142 automated unit and integration tests
│   ├── requirements.txt             # Core Python runtime dependencies
│   └── requirements.lock.txt        # Pinned lockfile with fully tested versions
├── frontend/
│   ├── src/
│   │   ├── api/                     # Configured Axios client with baseURL and error interceptors
│   │   ├── components/              # Modular UI components:
│   │   │   ├── DashboardGraphs.jsx  # Interactive SVG trend visualizer (Finance, Study, Habits)
│   │   │   ├── DashboardGraphs.css  # Chart styling, responsive grids, and focus states
│   │   │   ├── FloatingChat.jsx     # Expandable floating assistant widget
│   │   │   ├── GrowthSyncChat.jsx   # Embedded chat interface with scenario injection
│   │   │   ├── RoutineSimulator.jsx # Routine digital twin sliders and controls
│   │   │   ├── SimulatorSummary.jsx # Scenario impact metrics and visual feedback
│   │   │   ├── AIRecommendations.jsx# Dynamic insight alerts and behavioral suggestions
│   │   │   └── DashboardData.jsx    # Metric cards, transactions, and data tables
│   │   ├── hooks/                   # Custom React hooks (useAIProvider, etc.)
│   │   ├── pages/                   # Application views (Dashboard, Simulator, FinancialSimulator, etc.)
│   │   ├── App.jsx                  # Main router, navigation header, and shell layout
│   │   └── index.css                # Global design system, glassmorphism tokens, and responsive utilities
│   ├── package.json                 # Frontend dependencies and build scripts
│   └── vite.config.js               # Vite bundler configuration
├── deploy/
│   ├── Dockerfile.backend           # Multi-stage lightweight Python backend image
│   ├── Dockerfile.web               # Multi-stage Vite build + Caddy web server
│   └── Caddyfile                    # Caddy reverse proxy, TLS, and security headers configuration
├── compose.yaml                     # Unified Docker Compose configuration
├── datasets/                        # Sanitized training datasets and benchmark references
├── docs/
│   ├── MILESTONES.md                # Feature deliverables and roadmap tracking
│   ├── MILESTONE_4_CHANGES.md       # Implementation notes for Milestone 4
│   ├── MILESTONE_4_DEPLOYMENT.md    # Production deployment and operational guide
│   └── CLEANUP_REPORT.md            # Code quality and audit logs
├── .dockerignore                    # Build exclusion rules for Docker
├── .env.example                     # Environment template for local Python development
├── .env.docker.example              # Environment template for Docker Compose deployment
├── .gitignore                       # Multi-layer git ignore rules
├── package.json                     # Root package configuration for convenience scripts
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
   *For macOS / Linux:*
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables**:
   ```powershell
   Copy-Item .env.example .env
   ```
   Generate a cryptographic secret key:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
   Update `.env` with your PostgreSQL database credentials and generated secret key.

4. **Verify Connectivity & Initialize Database**:
   ```bash
   python backend/verify_db_conn.py
   python backend/init_db.py
   ```

5. **Start the FastAPI Backend Server**:
   ```bash
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```
   - API Server: `http://localhost:8000`
   - Interactive Swagger Docs: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

#### 2. Frontend Setup

1. **Navigate to the frontend directory and install dependencies**:
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

Deploy the full stack (PostgreSQL + FastAPI + Caddy Reverse Proxy) with a single command:

1. **Prepare the Docker environment file**:
   ```powershell
   Copy-Item .env.docker.example .env.docker
   ```

2. **Generate secure passwords and secrets**:
   ```powershell
   python -c "import secrets; print('POSTGRES_PASSWORD=' + secrets.token_hex(16)); print('SECRET_KEY=' + secrets.token_hex(32))"
   ```
   Paste the generated values into `.env.docker`.

3. **Build and launch the stack**:
   ```bash
   docker compose --env-file .env.docker up --build -d
   ```

4. **Verify container status and access application**:
   - Web App & API Gateway: `http://localhost:8080`
   - Health Check: `http://localhost:8080/health`
   - Check status: `docker compose --env-file .env.docker ps`

5. **Tear down containers**:
   ```bash
   docker compose --env-file .env.docker down
   ```

---

## ⚙️ Environment Configuration

### Local Development (`.env`)

| Variable | Type | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | String | SQLAlchemy PostgreSQL connection URI | `postgresql+psycopg2://postgres:password@localhost:5432/infosys_deep` |
| `SECRET_KEY` | String | 64-character cryptographic key for JWT signing | *Required strong secret* |
| `ALGORITHM` | String | Cryptographic algorithm for JWT signatures | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Integer | Session token validity duration in minutes | `1440` (24 Hours) |
| `ENVIRONMENT` | String | Runtime environment (`development` / `production`) | `development` |
| `ALLOWED_ORIGINS` | String | Comma-delimited list of allowed CORS origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `FRONTEND_URL` | String | Base URL of client application | `http://localhost:5173` |
| `PORT` | Integer | Backend server port | `8000` |
| `GEMINI_API_KEY` | String | Google Gemini API key for live AI generation | `""` (Empty enables offline heuristic mode) |
| `GEMINI_MODEL` | String | Target Google Gemini model identifier | `gemini-3.6-flash` |

### Docker Compose (`.env.docker`)

| Variable | Type | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `POSTGRES_PASSWORD` | String | Password for internal PostgreSQL user | *Required strong secret* |
| `SECRET_KEY` | String | JWT signing secret key (minimum 32 characters) | *Required strong secret* |
| `ENVIRONMENT` | String | Deployment mode (`development` / `production`) | `production` |
| `FRONTEND_URL` | String | Public origin URL | `http://localhost:8080` |
| `SITE_ADDRESS` | String | Caddy bind address or domain name | `:80` |
| `WEB_HTTP_PORT` | Integer | Host HTTP port exposed by Caddy | `8080` (or `80`) |
| `WEB_HTTPS_PORT` | Integer | Host HTTPS port exposed by Caddy | `8443` (or `443`) |
| `GEMINI_API_KEY` | String | *(Optional)* Google Gemini API key | `""` |
| `GEMINI_MODEL` | String | Gemini model identifier | `gemini-3.6-flash` |

---

## 🔌 API Endpoints Overview

| Category | Method | Endpoint | Description | Auth Required |
| :--- | :---: | :--- | :--- | :---: |
| **System** | `GET` | `/health` | Application & database connectivity health check | No |
| **Auth** | `POST` | `/api/auth/register` | Register new user account | No |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue HttpOnly JWT cookie | No |
| **Auth** | `POST` | `/api/auth/logout` | Invalidate active user session | Yes |
| **Auth** | `POST` | `/api/auth/forgot-password`| Request password reset token | No |
| **Auth** | `POST` | `/api/auth/reset-password` | Complete password reset using token | No |
| **User** | `GET` / `PUT`| `/api/users/me` | Fetch or update user profile details | Yes |
| **Finance** | `GET` / `POST`| `/api/financial/` | Fetch or record monthly income and savings | Yes |
| **Expenses**| `GET` / `POST`| `/api/expenses/` | Fetch expense breakdown or log new expense | Yes |
| **Expenses**| `DELETE` | `/api/expenses/{id}` | Delete specific expense entry | Yes |
| **Study** | `GET` / `POST`| `/api/study/` | Log study sessions and view subject allocations | Yes |
| **Habits** | `GET` / `POST`| `/api/habits/` | Track daily habits, completions, and streaks | Yes |
| **Analytics**| `GET` | `/api/analytics/dashboard` | Aggregated metrics, composite scores, and activity | Yes |
| **Analytics**| `GET` | `/api/analytics/forecast` | Personal time-series regression projections | Yes |
| **Simulation**| `POST`| `/api/simulation/what-if` | Deterministic scenario projection | Yes |
| **Simulation**| `POST`| `/api/simulation/financial-twin`| Multi-month digital twin financial runway model | Yes |
| **Simulation**| `POST`| `/api/simulation/routine-twin` | Daily study/sleep/habit digital twin scenario model | Yes |
| **Simulation**| `GET` | `/api/simulation/recommendations` | AI-generated recommendations and risk insights | Yes |
| **Chat** | `POST` | `/api/chat/` | Context-grounded AI conversational assistant | Yes |
| **Datasets**| `GET` | `/api/datasets/export/csv` | Export verified user records as downloadable CSV | Yes |

*Full OpenAPI/Swagger specification is accessible at `http://localhost:8000/docs`.*

---

## 🧪 Verification & Quality Assurance

GrowthSync maintains high engineering standards with 142 automated tests covering authentication security, regression forecasting, scenario simulations, database transactions, and deployment configurations:

```bash
# 1. Run full backend test suite (142 tests)
pytest backend/tests -v

# 2. Run domain-specific test suites
pytest backend/tests/test_chat.py -v
pytest backend/tests/test_financial_twin.py -v
pytest backend/tests/test_routine_twin.py -v
pytest backend/tests/test_ai_recommendations.py -v
pytest backend/tests/test_deployment_config.py -v

# 3. Python code quality inspection with Ruff
ruff check backend

# 4. Frontend lint check with Oxlint
npm --prefix frontend run lint

# 5. Production frontend bundle build verification
npm --prefix frontend run build
```

---

## 🗺️ Milestone Roadmap

- [x] **Milestone 1: Core Foundation & Data Tracking**
  - Robust authentication lifecycle (Bcrypt, JWT, secure HttpOnly cookie management).
  - Profile administration, session guard middleware, password reset workflow.
  - Tracking modules for Financials, Categorized Expenses, Study Sessions, and Daily Habits.
  - Audit timeline logging and sanitized CSV export engine.

- [x] **Milestone 2: Analytics, Trend Modeling & Scenario Simulation**
  - Statistical feature engineering and rolling temporal aggregations.
  - Linear regression trend fitting on personal historical logs.
  - Composite Growth & Risk Scoring Index.
  - Interactive What-If Scenario Simulator for personal decision support.

- [x] **Milestone 3: Financial Digital Twin & Scenario Modeling**
  - Advanced Financial Digital Twin (`/api/simulation/financial-twin`) for multi-month runway forecasting.
  - Discretionary budget tuning, shock simulation, and savings delta calculation.
  - Benchmark evaluation and dataset ingestion pipelines.

- [x] **Milestone 4: Routine Twin, AI Recommendations, Assistant Chat & Deployment**
  - Routine Twin Simulator (`/api/simulation/routine-twin`) modeling study, sleep, and habit consistency trade-offs.
  - AI Recommendations Engine (`/api/simulation/recommendations`) providing personalized behavioral nudges.
  - Context-Grounded Conversational AI Assistant (`/api/chat`) with zero-hallucination verification.
  - Floating chat assistant widget (`FloatingChat.jsx`) and SVG growth trendline visualizer (`DashboardGraphs.jsx`).
  - Production containerization via Docker Compose, Caddy reverse proxy, and automated HTTPS.
  - Verified lockfile (`backend/requirements.lock.txt`) and 142/142 passing tests.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Commit Your Changes** following Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`):
   ```bash
   git commit -m "feat: add your descriptive feature commit message"
   ```
4. **Run Verification**: Ensure all tests pass (`pytest backend/tests`) and code lints cleanly (`ruff check backend`, `npm --prefix frontend run lint`).
5. **Push to Your Branch**:
   ```bash
   git push origin feat/your-feature-name
   ```
6. **Open a Pull Request** describing your changes and verification steps.

---

## 📄 License & Acknowledgements

Developed with passion by **Deep Bisen** as part of the **Infosys Springboard Internship** program.

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete terms.
