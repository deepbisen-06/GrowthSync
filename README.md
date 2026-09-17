# 🚀 GrowthSync

<div align="center">

![GrowthSync Banner](https://img.shields.io/badge/GrowthSync-Personal%20Analytics%20Platform-4F46E5?style=for-the-badge&logo=fastapi&logoColor=white)

**An intelligent, full-stack personal analytics and decision-support platform unifying financial budgeting, deep-work study tracking, habit streaks, predictive forecasting, and what-if scenario simulations.**

*Developed by **Deep Bisen** for the **Infosys Springboard Internship**.*

---

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
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
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Environment Configuration](#-environment-configuration)
- [Verification & Quality Assurance](#-verification--quality-assurance)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Milestone Roadmap](#-milestone-roadmap)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🌟 Overview

**GrowthSync** bridges the gap between daily self-tracking and actionable predictive intelligence. Rather than isolating personal finances, daily habits, and study productivity into disconnected silos, GrowthSync synthesizes them into a unified operational dashboard.

By modeling user historical data through regression trend fitting and dynamic scoring algorithms, GrowthSync empowers users to:
1. Understand their personal productivity drivers and spending leaks.
2. Forecast future savings balances and study milestones.
3. Test hypotheses using an interactive **What-If Scenario Simulator** before making life or study schedule adjustments.

---

## 🎯 Key Features

### 📊 Unified Executive Dashboard
- **Real-Time KPI Cards**: High-level visibility into total monthly savings, active habit completion rates, average study hours, and composite productivity index.
- **Recent Activity Feed**: Real-time event logging capturing study sessions, financial transactions, and completed habits.

### 💰 Financial & Expense Management
- **Budget & Cash Flow Tracking**: Log monthly income, recurring commitments, and dynamic expense categorizations (Housing, Food, Tech, Leisure, etc.).
- **Net Balance Calculation**: Automatic tracking of savings ratios, expense-to-income distribution, and liquidity trends.

### 📚 Study & Deep-Work Sessions
- **Subject-Specific Logging**: Track topic, duration, productivity rating, and notes.
- **Academic Pacing**: Aggregate total hours studied across subjects to ensure target goals are consistently met.

### ⚡ Habit Tracking & Streak Engine
- **Daily Adherence Tracking**: Track critical habits (fitness, reading, coding, meditation).
- **Streak Calculation**: Visual feedback on current and longest streaks to maintain daily discipline.

### 🔮 Predictive Analytics & Forecasting
- **Linear Trend Regression**: Statistical projection of personal finance savings curves and study-hour trends fitted strictly to verified personal historical logs.
- **Productivity & Risk Scoring**: Weighted heuristic scoring combining habit consistency, study volume, and financial discipline to compute a balanced Growth Index.

### 🧪 What-If Scenario Simulator
- **Interactive Parameter Tuning**: Adjust hypothetical daily study hours, habit completion consistency, and discretionary budget cuts.
- **Projected Impact Modeling**: Instant recalculation showing how behavioral tweaks compound over 30, 60, and 90-day horizons.

### 🔒 Enterprise-Grade Security
- **Authentication**: JWT authentication with secure session handling and HTTP-only cookies.
- **Data Protection**: Password hashing via Bcrypt, strict Pydantic payload validation, and CORS domain isolation.
- **Self-Service Recovery**: Secure password reset tokens and profile edit capabilities.

### 📁 Data Portability & Research Pipeline
- **Activity & Metric CSV Export**: Full data portability for user backups or offline analysis.
- **External Dataset Ingestion**: Preconfigured scripts for cleaning and benchmarking external educational datasets (e.g., UCI Student Performance dataset).

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client["Frontend (React 19 + Vite)"]
        UI[Tailored UI & Pages]
        State[Auth & App Context]
        Axios[Axios API Client]
        UI --> State --> Axios
    end

    subgraph Server["Backend (FastAPI + Python 3.10+)"]
        API[FastAPI Router Engine]
        Middleware[Auth / CORS / Cookie Middleware]
        Services[Service & Business Logic]
        ML[Analytics, Scoring & Forecast Engine]
        ORM[SQLAlchemy ORM 2.0]
        
        Axios -->|REST / JSON| Middleware
        Middleware --> API
        API --> Services
        Services --> ML
        Services --> ORM
    end

    subgraph Data["Persistence Layer"]
        PG[(PostgreSQL Database)]
        CSV[Datasets / Export Engine]
        ORM -->|SQL Queries| PG
        Services -->|Export / Preprocessing| CSV
    end
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Lucide React, Axios, Modern Vanilla CSS Design System |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, Python-Multipart, PyJWT, Passlib (Bcrypt) |
| **Database & ORM** | PostgreSQL, SQLAlchemy 2.0, Psycopg2 |
| **Data & Analytics** | NumPy, Pandas, Scikit-Learn (Linear Regression & Trend Modeling) |
| **Tooling & QA** | Ruff (Python Linting & Formatting), Oxlint (JS/JSX Linting), Pytest, Unittest |

---

## 📁 Repository Structure

```text
GrowthSync/
├── backend/
│   ├── app/
│   │   ├── core/            # Configuration, database connection, security utils
│   │   ├── models/          # SQLAlchemy database models (User, Expense, Habit, Study, etc.)
│   │   ├── schemas/         # Pydantic validation models for request/response bodies
│   │   ├── routes/          # REST endpoints (auth, analytics, simulation, expenses, etc.)
│   │   ├── services/        # Business logic and domain orchestration
│   │   ├── ml/              # Preprocessing, feature engineering, forecasting & scoring
│   │   └── main.py          # FastAPI application entrypoint & middleware setup
│   ├── tests/               # API integration and data preparation test suites
│   ├── init_db.py           # Database table initialization script
│   ├── verify_db_conn.py    # Connectivity diagnostic script
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/             # Configured Axios instance and endpoint calls
│   │   ├── components/      # Reusable UI components (Headers, Sidebars, Modals, Cards)
│   │   ├── context/         # React Context for authentication and global states
│   │   ├── pages/           # Application views (Dashboard, Forecasting, Simulator, Habits, etc.)
│   │   ├── App.jsx          # Route definitions and view layout hierarchy
│   │   ├── main.jsx         # React application bootstrap
│   │   └── index.css        # Clean, modern design tokens, animations, and responsive utilities
│   ├── package.json         # Node.js dependencies and scripts
│   └── vite.config.js       # Vite configuration
├── datasets/
│   ├── examples/            # Synthetic reference CSV files
│   ├── raw/                 # Untracked external datasets (e.g., Kaggle / UCI)
│   └── processed/           # Sanitized experiment datasets
├── docs/
│   ├── MILESTONES.md        # Feature tracking and milestone deliverables
│   ├── KAGGLE_DATA_GUIDE.md # Instructions for external dataset integration
│   └── CLEANUP_REPORT.md    # Source audit, verification checks, and lint compliance
├── scripts/                 # Standalone dataset preparation and validation utilities
├── .env.example             # Template environment variables
├── .gitignore               # Multi-layer git ignore rules
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.x or 20.x+ (compatible with Vite 8)
- **PostgreSQL**: Running instance with a database created (e.g., `infosys_deep`)

---

### 1. Backend Setup

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
   Update `.env` with your PostgreSQL credentials and generate a secure `SECRET_KEY`:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

4. **Initialize the Database**:
   ```bash
   python backend/verify_db_conn.py
   python backend/init_db.py
   ```

5. **Start the API Server**:
   ```bash
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```
   - API Server runs at: `http://localhost:8000`
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   - Access the web application at: `http://localhost:5173`

---

## ⚙️ Environment Configuration

Configuration is managed via `.env` in the root directory:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy PostgreSQL connection URI | `postgresql+psycopg2://postgres:password@localhost:5432/infosys_deep` |
| `SECRET_KEY` | Cryptographic secret for signing JWT tokens | *Generated 64-char hex string* |
| `ALGORITHM` | Cryptographic algorithm for JWT signatures | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Session token validity window | `1440` (24 Hours) |
| `ENVIRONMENT` | Runtime mode (`development` / `production`) | `development` |
| `ALLOWED_ORIGINS` | Comma-delimited CORS allowed origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `PORT` | Backend uvicorn server port | `8000` |

---

## 🧪 Verification & Quality Assurance

This codebase adheres to high code quality and strict formatting standards:

```bash
# 1. Run Python unit & contract tests
python -m unittest backend.tests.test_prepare_student_data

# 2. Run backend integration tests (requires test database)
python -m pytest backend/tests -v

# 3. Lint Python files with Ruff
ruff check backend scripts

# 4. Lint Frontend codebase with Oxlint
npm --prefix frontend run lint

# 5. Verify Frontend Production Build
npm --prefix frontend run build
```

---

## 🔌 API Endpoints Overview

| Area | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register a new user account |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue session cookie |
| **Auth** | `POST` | `/api/auth/logout` | Invalidate active user session |
| **Auth** | `POST` | `/api/auth/forgot-password` | Request password reset token |
| **Auth** | `POST` | `/api/auth/reset-password` | Complete password reset with token |
| **User** | `GET` / `PUT`| `/api/users/me` | Fetch / update profile information |
| **Finance** | `GET` / `POST`| `/api/financial/` | Retrieve and record monthly income & savings goals |
| **Expenses**| `GET` / `POST`| `/api/expenses/` | Fetch breakdown & record new categorized expenses |
| **Expenses**| `DELETE` | `/api/expenses/{id}` | Remove specific expense item |
| **Study** | `GET` / `POST`| `/api/study/` | Log study sessions and view subject allocations |
| **Habits** | `GET` / `POST`| `/api/habits/` | Track daily habits, completions, and streaks |
| **Analytics**| `GET` | `/api/analytics/dashboard` | Aggregated metrics, scores, and recent activity |
| **Analytics**| `GET` | `/api/analytics/forecast` | Personal time-series regression projections |
| **Simulation**| `POST`| `/api/simulation/what-if` | Scenario projection based on input parameters |
| **Data** | `GET` | `/api/datasets/export/csv` | Export user activity records as downloadable CSV |

Interactive Swagger documentation is available at `http://localhost:8000/docs`.

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
- [ ] **Next Steps: Real External Benchmarks & Model Serving**
  - Offline training and benchmark comparisons using external academic datasets.
  - Model artifact versioning and scheduled retraining jobs.

---

## 📄 License & Acknowledgements

This project was engineered by **Deep Bisen** as part of the **Infosys Springboard Internship** program.

Distributed under the **MIT License**. See `LICENSE` for details.
