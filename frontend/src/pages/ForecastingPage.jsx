import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import ForecastChart from "../components/ForecastChart";
import ProductivityBreakdown from "../components/ProductivityBreakdown";
import RiskCard from "../components/RiskCard";
import ModelTransparencyCard from "../components/ModelTransparencyCard";
import {
  TrendingUp,
  DollarSign,
  BookOpen,
  Activity,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Calendar,
  Clock,
  PieChart,
} from "lucide-react";

export default function ForecastingPage({ setCurrentRoute }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    loadAnalytics(demoMode);
  }, [demoMode]);

  async function loadAnalytics(isDemo) {
    try {
      setLoading(true);
      setError("");
      const endpoint = isDemo
        ? "/api/analytics/demo-data"
        : "/api/analytics/dashboard";
      const res = await api.get(endpoint);
      setAnalytics(res.data);
    } catch (err) {
      setAnalytics(null);
      setError(
        err.code === "ERR_NETWORK"
          ? "Could not connect to the API. Check that the backend is running, then select Refresh."
          : err.formattedMessage || "Failed to load forecasting and predictive analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  const fin = analytics?.financial || {};
  const prod = analytics?.productivity || {};
  const study = analytics?.study || {};
  const habits = analytics?.habits || {};
  const risks = analytics?.risks || [];

  return (
    <div className="dashboard-content">
      {/* Top Header Banner */}
      <div className="dashboard-hero">
        <div className="hero-title-area">
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Forecasting & Predictive Analytics</span>
            {demoMode && (
              <span
                className="sidebar-badge"
                style={{
                  background: "rgba(245, 158, 11, 0.2)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  fontSize: "0.72rem",
                }}
              >
                DEMO MODE ACTIVE
              </span>
            )}
          </h1>
          <p className="hero-subtitle">
            AI-powered predictions for financial, study and habit outcomes.
          </p>
        </div>

        <div className="hero-quick-actions" style={{ alignItems: "center" }}>
          {/* Demo Mode Toggle Button */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`btn ${demoMode ? "btn-primary" : "btn-secondary"} btn-sm`}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            title="Toggle between your real PostgreSQL records and demonstration data"
          >
            <Sparkles size={14} />
            <span>
              {demoMode ? "Viewing Demo Data" : "Switch to Demo Mode"}
            </span>
          </button>

          <button
            onClick={() => loadAnalytics(demoMode)}
            className="btn btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setCurrentRoute("simulation")}
            className="btn btn-primary btn-sm"
          >
            <span>Future Simulator &rarr;</span>
          </button>
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}

      {loading && <p role="status">Loading forecasting data…</p>}

      {!loading && !error && analytics && (
        <>
      {/* Low-data Warning Banner if real data is under 4 months */}
      {!demoMode && fin.has_sufficient_data && fin.low_data_warning && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            color: "#f59e0b",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertTriangle size={18} flexShrink={0} />
          <span>
            <strong>Preliminary Trend Analysis:</strong> {fin.message}
          </span>
        </div>
      )}

      {/* Demo Mode Banner */}
      {demoMode && (
        <div
          style={{
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.35)",
            color: "#93c5fd",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={18} style={{ color: "#60a5fa" }} />
            <span>
              <strong>DEMO MODE:</strong> Showing sample 6-month historical
              dataset for ML evaluation and presentation purposes. No real
              database records are modified.
            </span>
          </div>
          <button
            onClick={() => setDemoMode(false)}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
          >
            Exit Demo
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: FINANCIAL FORECASTING */}
      {/* ======================================================== */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          className="sidebar-section-title"
          style={{
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <DollarSign size={16} className="text-emerald-400" />
          <span>Section 1 &bull; Financial Forecasting</span>
        </div>

        {/* Financial KPI Cards */}
        <div className="metrics-grid" style={{ marginBottom: "1.25rem" }}>
          <div className="metric-card emerald">
            <div className="metric-card-header">
              <span className="metric-card-title">Current Monthly Savings</span>
              <DollarSign size={18} className="text-emerald-400" />
            </div>
            <div className="metric-card-value">
              ₹
              {fin.current_savings
                ? fin.current_savings.toLocaleString("en-IN")
                : "0"}
            </div>
            <div className="metric-card-subtext">Recorded in PostgreSQL</div>
          </div>

          <div className="metric-card emerald">
            <div className="metric-card-header">
              <span className="metric-card-title">
                Projected Next Month Savings
              </span>
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div className="metric-card-value">
              {fin.predicted_next_savings !== null &&
              fin.predicted_next_savings !== undefined
                ? `₹${fin.predicted_next_savings.toLocaleString("en-IN")}`
                : "Awaiting Data"}
            </div>
            <div className="metric-card-subtext">
              {fin.savings_growth_percentage !== undefined
                ? `${fin.savings_growth_percentage}% velocity`
                : "Linear Regression"}
            </div>
          </div>

          <div className="metric-card orange">
            <div className="metric-card-header">
              <span className="metric-card-title">Predicted Next Expenses</span>
              <AlertTriangle size={18} className="text-orange-400" />
            </div>
            <div className="metric-card-value">
              {fin.predicted_next_expenses !== null &&
              fin.predicted_next_expenses !== undefined
                ? `₹${fin.predicted_next_expenses.toLocaleString("en-IN")}`
                : "Awaiting Data"}
            </div>
            <div className="metric-card-subtext">
              {fin.overspending_risk
                ? "⚠️ Expense growth accelerating"
                : "Within income bounds"}
            </div>
          </div>

          <div className="metric-card blue">
            <div className="metric-card-header">
              <span className="metric-card-title">Top Expense Category</span>
              <PieChart size={18} className="text-blue-400" />
            </div>
            <div className="metric-card-value" style={{ fontSize: "1.2rem" }}>
              {fin.highest_spending_category || "None Logged"}
            </div>
            <div className="metric-card-subtext">
              <button
                onClick={() => setCurrentRoute("expenses")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  textDecoration: "underline",
                }}
              >
                Manage Categories &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Financial Charts Row */}
        {!fin.has_sufficient_data ? (
          <div className="analytics-card">
            <div className="growth-empty-state" style={{ height: "200px" }}>
              <Calendar size={28} className="text-muted" />
              <div className="empty-state-title">
                More Historical Data Required
              </div>
              <p className="empty-state-desc">{fin.message}</p>
              <button
                onClick={() => setCurrentRoute("financial")}
                className="btn btn-secondary btn-sm"
              >
                Log Financial Records
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <ForecastChart
              historyComparison={fin.history_comparison || []}
              savingsProjection={fin.savings_projection || []}
              title="Savings & Expense Trajectory (Actual vs Predicted)"
              type="savings"
            />
            {/* Category Breakdown Donut / Bar List */}
            <div className="analytics-card" style={{ height: "100%" }}>
              <div className="analytics-card-header">
                <div className="card-title-group">
                  <h2>
                    <PieChart size={18} className="text-blue-400" />
                    <span>Category Spending Trend</span>
                  </h2>
                  <p>Expense allocations used in ML risk detection</p>
                </div>
              </div>

              {!fin.category_breakdown ||
              fin.category_breakdown.length === 0 ? (
                <div className="growth-empty-state" style={{ height: "180px" }}>
                  <p className="empty-state-desc">
                    No category-wise expenses logged.
                  </p>
                  <button
                    onClick={() => setCurrentRoute("expenses")}
                    className="btn btn-secondary btn-sm"
                  >
                    + Log Category Expenses
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {fin.category_breakdown.map((c) => (
                    <div key={c.category}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8rem",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {c.category}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          ₹{c.total_amount.toLocaleString("en-IN")} (
                          {c.percentage}%)
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          background: "var(--bg-hover)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${c.percentage}%`,
                            height: "100%",
                            background: "#3b82f6",
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: STUDY & PRODUCTIVITY */}
      {/* ======================================================== */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          className="sidebar-section-title"
          style={{
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <BookOpen size={16} className="text-blue-400" />
          <span>Section 2 &bull; Study & Productivity Analysis</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Productivity Score Engine Component */}
          <ProductivityBreakdown productivityData={prod} />

          {/* Study Forecast & Best Study Day Card */}
          <div className="analytics-card" style={{ height: "100%" }}>
            <div className="analytics-card-header">
              <div className="card-title-group">
                <h2>
                  <BookOpen size={18} className="text-blue-400" />
                  <span>Academic Study Trajectory</span>
                </h2>
                <p>Weekly study hours & empirical day-of-week productivity</p>
              </div>
            </div>

            {!study.has_sufficient_data ? (
              <div className="growth-empty-state" style={{ height: "180px" }}>
                <Clock size={24} className="text-muted" />
                <div className="empty-state-title">Insufficient Study Logs</div>
                <p className="empty-state-desc">{study.message}</p>
                <button
                  onClick={() => setCurrentRoute("study")}
                  className="btn btn-secondary btn-sm"
                >
                  Log Study Session
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      background: "var(--bg-hover)",
                      padding: "0.75rem",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Avg Weekly Hours
                    </div>
                    <div
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginTop: "0.2rem",
                      }}
                    >
                      {study.avg_weekly_hours} hrs
                    </div>
                  </div>
                  <div
                    style={{
                      background: "var(--bg-hover)",
                      padding: "0.75rem",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Predicted Next Week
                    </div>
                    <div
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "#3b82f6",
                        marginTop: "0.2rem",
                      }}
                    >
                      {study.predicted_next_week_hours} hrs
                    </div>
                  </div>
                </div>

                {/* Best Study Day Highlight */}
                {study.best_study_day && (
                  <div
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      padding: "0.85rem",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#60a5fa",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <Calendar size={13} />
                      <span>Best Study Day (From Historical Study Dates)</span>
                    </div>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        marginTop: "0.3rem",
                      }}
                    >
                      {study.best_study_day.day}
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-secondary)",
                        marginTop: "0.2rem",
                      }}
                    >
                      Averaging {study.best_study_day.avg_hours} hrs across{" "}
                      {study.best_study_day.total_sessions} logged sessions.
                    </div>
                  </div>
                )}

                {/* Study Consistency Gauge */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.78rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      Study Habit Consistency
                    </span>
                    <span style={{ fontWeight: 700, color: "#10b981" }}>
                      {study.study_consistency_percentage}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "var(--bg-hover)",
                      borderRadius: "3px",
                    }}
                  >
                    <div
                      style={{
                        width: `${study.study_consistency_percentage}%`,
                        height: "100%",
                        background: "#10b981",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: HABIT PREDICTIONS & SECTION 4: RISKS */}
      {/* ======================================================== */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          className="sidebar-section-title"
          style={{
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Activity size={16} className="text-purple-400" />
          <span>
            Section 3 &bull; Habit Predictions & Section 4 &bull; Future Risk
            Advisory
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Habits Card */}
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="card-title-group">
                <h2>
                  <Activity size={18} className="text-purple-400" />
                  <span>Lifestyle Habit Trajectories</span>
                </h2>
                <p>Sleep regularity, exercise frequency, and screen balance</p>
              </div>
            </div>

            {!habits.has_sufficient_data ? (
              <div className="growth-empty-state" style={{ height: "180px" }}>
                <Activity size={24} className="text-muted" />
                <div className="empty-state-title">Insufficient Habit Logs</div>
                <p className="empty-state-desc">{habits.message}</p>
                <button
                  onClick={() => setCurrentRoute("habit")}
                  className="btn btn-secondary btn-sm"
                >
                  Track Daily Habit
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  marginTop: "0.5rem",
                }}
              >
                {Object.entries(habits.habits || {}).map(([key, h]) => (
                  <div
                    key={key}
                    style={{
                      background: "var(--bg-hover)",
                      padding: "0.75rem 0.9rem",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          textTransform: "capitalize",
                          color: "var(--text-primary)",
                        }}
                      >
                        {key.replace("_", " ")}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color:
                            h.trend_percentage >= 0 ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {h.trend_percentage >= 0
                          ? `+${h.trend_percentage}%`
                          : `${h.trend_percentage}%`}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginTop: "0.2rem",
                      }}
                    >
                      Avg: {h.average} {h.unit} &bull;{" "}
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.78rem",
                        }}
                      >
                        Forecast: {h.prediction} {h.unit}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-secondary)",
                        marginTop: "0.2rem",
                      }}
                    >
                      {h.insight}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Future Risk Center */}
          <RiskCard risks={risks} />
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 5: MODEL TRANSPARENCY & VALIDATION */}
      {/* ======================================================== */}
      <ModelTransparencyCard
        modelMetadata={fin.model_metadata}
        observationCount={fin.observation_count || 0}
      />
        </>
      )}
    </div>
  );
}
