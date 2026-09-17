import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import {
  Sliders,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function SimulatorPage({ setCurrentRoute }) {
  // Simulation Input State
  const [incomeDelta, setIncomeDelta] = useState(0);
  const [expenseReduction, setExpenseReduction] = useState(2000);
  const [studyDeltaHours, setStudyDeltaHours] = useState(1.0);
  const [sleepDeltaHours, setSleepDeltaHours] = useState(0.5);
  const [screenTimeReduction, setScreenTimeReduction] = useState(1.0);
  const [exerciseExtraMinutes, setExerciseExtraMinutes] = useState(15);

  const [simulationResult, setSimulationResult] = useState(null);
  const [, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounced or live simulation call
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 200);
    return () => clearTimeout(timer);
  }, [
    incomeDelta,
    expenseReduction,
    studyDeltaHours,
    sleepDeltaHours,
    screenTimeReduction,
    exerciseExtraMinutes,
  ]);

  async function runSimulation() {
    try {
      setLoading(true);
      setError("");
      const payload = {
        income_delta: parseFloat(incomeDelta) || 0,
        expense_reduction: Math.max(0, parseFloat(expenseReduction) || 0),
        daily_study_delta_hours: parseFloat(studyDeltaHours) || 0,
        daily_sleep_delta_hours: parseFloat(sleepDeltaHours) || 0,
        daily_screen_time_reduction_hours: Math.max(
          0,
          parseFloat(screenTimeReduction) || 0,
        ),
        weekly_exercise_extra_minutes: Math.max(
          0,
          parseInt(exerciseExtraMinutes) || 0,
        ),
      };

      const res = await api.post("/api/simulation/what-if", payload);
      setSimulationResult(res.data);
    } catch (err) {
      setError(err.formattedMessage || "Failed to execute simulation.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setIncomeDelta(0);
    setExpenseReduction(0);
    setStudyDeltaHours(0);
    setSleepDeltaHours(0);
    setScreenTimeReduction(0);
    setExerciseExtraMinutes(0);
  }

  const res = simulationResult;

  return (
    <div className="dashboard-content">
      {/* Hero Header */}
      <div className="dashboard-hero">
        <div className="hero-title-area">
          <div
            style={{
              fontSize: "0.74rem",
              fontWeight: 700,
              letterSpacing: "1px",
              color: "var(--primary)",
              textTransform: "uppercase",
              marginBottom: "0.25rem",
            }}
          >
            GROWTHSYNC INNOVATION ENGINE
          </div>
          <h1>GrowthSync Future Simulator</h1>
          <p className="hero-subtitle">
            &ldquo;See how today&apos;s decisions could affect tomorrow&apos;s
            outcomes.&rdquo;
          </p>
        </div>

        <div className="hero-quick-actions">
          <button
            onClick={handleReset}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <RotateCcw size={14} />
            <span>Reset Sliders</span>
          </button>
          <button
            onClick={() => setCurrentRoute("forecasting")}
            className="btn btn-primary btn-sm"
          >
            <span>&larr; Return to Forecasting</span>
          </button>
        </div>
      </div>

      {/* Stateless Guarantee Notice */}
      <div
        style={{
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          color: "#34d399",
          padding: "0.65rem 1rem",
          borderRadius: "8px",
          marginBottom: "1.25rem",
          fontSize: "0.8rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <ShieldCheck size={18} flexShrink={0} />
        <span>
          <strong>Safe Simulation Sandbox:</strong> Variable adjustments are
          calculated statelessly in memory. Your saved PostgreSQL database
          records are never modified.
        </span>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Left Column: Interactive Simulation Sliders */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="card-title-group">
              <h2>
                <Sliders size={18} className="text-emerald-400" />
                <span>Simulation Controls</span>
              </h2>
              <p>Tune prospective lifestyle & financial variables</p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              marginTop: "0.5rem",
            }}
          >
            {/* Control 1: Expense Reduction */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  marginBottom: "0.3rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Monthly Expense Reduction
                </span>
                <span style={{ fontWeight: 700, color: "#10b981" }}>
                  -₹{parseInt(expenseReduction).toLocaleString("en-IN")}/mo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25000"
                step="500"
                value={expenseReduction}
                onChange={(e) => setExpenseReduction(e.target.value)}
                style={{
                  width: "100%",
                  accentColor: "#10b981",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                <span>₹0</span>
                <span>₹10k</span>
                <span>₹25k</span>
              </div>
            </div>

            {/* Control 2: Income Change */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  marginBottom: "0.3rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Monthly Income Delta
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: incomeDelta >= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  {incomeDelta >= 0
                    ? `+₹${parseInt(incomeDelta).toLocaleString("en-IN")}`
                    : `-₹${Math.abs(parseInt(incomeDelta)).toLocaleString("en-IN")}`}
                  /mo
                </span>
              </div>
              <input
                type="range"
                min="-20000"
                max="50000"
                step="1000"
                value={incomeDelta}
                onChange={(e) => setIncomeDelta(e.target.value)}
                style={{
                  width: "100%",
                  accentColor: "#3b82f6",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                <span>-₹20k</span>
                <span>Baseline (₹0)</span>
                <span>+₹50k</span>
              </div>
            </div>

            {/* Control 3: Daily Study Adjustment */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  marginBottom: "0.3rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Daily Study Hours Delta
                </span>
                <span style={{ fontWeight: 700, color: "#3b82f6" }}>
                  {studyDeltaHours >= 0
                    ? `+${studyDeltaHours} hrs/day`
                    : `${studyDeltaHours} hrs/day`}
                </span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="4.0"
                step="0.5"
                value={studyDeltaHours}
                onChange={(e) => setStudyDeltaHours(e.target.value)}
                style={{
                  width: "100%",
                  accentColor: "#3b82f6",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                <span>-2.0 hrs</span>
                <span>0 hrs</span>
                <span>+4.0 hrs</span>
              </div>
            </div>

            {/* Control 4: Daily Screen Time Reduction */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  marginBottom: "0.3rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Screen Time Reduction
                </span>
                <span style={{ fontWeight: 700, color: "#f59e0b" }}>
                  -{screenTimeReduction} hrs/day
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.5"
                value={screenTimeReduction}
                onChange={(e) => setScreenTimeReduction(e.target.value)}
                style={{
                  width: "100%",
                  accentColor: "#f59e0b",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                <span>0 hrs</span>
                <span>2.5 hrs</span>
                <span>5.0 hrs</span>
              </div>
            </div>

            {/* Control 5: Extra Exercise Minutes */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  marginBottom: "0.3rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Daily Extra Exercise
                </span>
                <span style={{ fontWeight: 700, color: "#10b981" }}>
                  +{exerciseExtraMinutes} mins/day
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={exerciseExtraMinutes}
                onChange={(e) => setExerciseExtraMinutes(e.target.value)}
                style={{
                  width: "100%",
                  accentColor: "#10b981",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                <span>0 mins</span>
                <span>30 mins</span>
                <span>60 mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Side-by-Side Impact Comparison */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Main Outcome Comparison Grid */}
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="card-title-group">
                <h2>
                  <Zap size={18} className="text-emerald-400" />
                  <span>Simulated Outcome Comparison</span>
                </h2>
                <p>
                  Real-time projection: Current Baseline vs Simulated Scenario
                </p>
              </div>
            </div>

            {res && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  marginTop: "0.5rem",
                }}
              >
                {/* Metric 1: Monthly Savings */}
                <div
                  style={{
                    background: "var(--bg-hover)",
                    padding: "0.85rem 1rem",
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
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Monthly Savings Trajectory
                    </span>
                    <span
                      className="sidebar-badge"
                      style={{
                        background:
                          res.monthly_savings.delta >= 0
                            ? "rgba(16, 185, 129, 0.2)"
                            : "rgba(239, 68, 68, 0.2)",
                        color:
                          res.monthly_savings.delta >= 0
                            ? "#10b981"
                            : "#ef4444",
                        fontWeight: 700,
                      }}
                    >
                      {res.monthly_savings.delta >= 0
                        ? `+₹${res.monthly_savings.delta.toLocaleString("en-IN")}`
                        : `-₹${Math.abs(res.monthly_savings.delta).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.75rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--text-secondary)",
                        textDecoration: "line-through",
                      }}
                    >
                      ₹
                      {res.monthly_savings.current_value.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                    <ArrowRight size={14} className="text-muted" />
                    <span
                      style={{
                        fontSize: "1.45rem",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                      }}
                    >
                      ₹
                      {res.monthly_savings.simulated_value.toLocaleString(
                        "en-IN",
                      )}{" "}
                      / mo
                    </span>
                  </div>
                </div>

                {/* Metric 2: Annual Savings Projection */}
                <div
                  style={{
                    background: "var(--bg-hover)",
                    padding: "0.85rem 1rem",
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
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      1-Year Cumulative Capital Growth
                    </span>
                    <span
                      className="sidebar-badge"
                      style={{
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "#10b981",
                        fontWeight: 700,
                      }}
                    >
                      +
                      {res.annual_savings_projection.delta.toLocaleString(
                        "en-IN",
                      )}{" "}
                      1-Yr Delta
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.75rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--text-secondary)",
                        textDecoration: "line-through",
                      }}
                    >
                      ₹
                      {res.annual_savings_projection.current_value.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                    <ArrowRight size={14} className="text-muted" />
                    <span
                      style={{
                        fontSize: "1.45rem",
                        fontWeight: 800,
                        color: "#10b981",
                      }}
                    >
                      ₹
                      {res.annual_savings_projection.simulated_value.toLocaleString(
                        "en-IN",
                      )}{" "}
                      / yr
                    </span>
                  </div>
                </div>

                {/* Metric 3: Productivity Score */}
                <div
                  style={{
                    background: "var(--bg-hover)",
                    padding: "0.85rem 1rem",
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
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Composite Productivity Score
                    </span>
                    <span
                      className="sidebar-badge"
                      style={{
                        background:
                          res.productivity_score.delta >= 0
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(239, 68, 68, 0.2)",
                        color:
                          res.productivity_score.delta >= 0
                            ? "#60a5fa"
                            : "#ef4444",
                        fontWeight: 700,
                      }}
                    >
                      {res.productivity_score.delta >= 0
                        ? `+${res.productivity_score.delta} Points`
                        : `${res.productivity_score.delta} Points`}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.75rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--text-secondary)",
                        textDecoration: "line-through",
                      }}
                    >
                      {res.productivity_score.current_value}%
                    </span>
                    <ArrowRight size={14} className="text-muted" />
                    <span
                      style={{
                        fontSize: "1.45rem",
                        fontWeight: 800,
                        color: "#3b82f6",
                      }}
                    >
                      {res.productivity_score.simulated_value}% Index
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contextual Takeaways Card */}
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="card-title-group">
                <h2>
                  <Sparkles size={18} className="text-orange-400" />
                  <span>Compound Impact Takeaways</span>
                </h2>
                <p>Actionable projections translated from your simulation</p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
                marginTop: "0.5rem",
              }}
            >
              {res?.insights?.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.45,
                    padding: "0.45rem 0",
                    borderBottom:
                      idx < res.insights.length - 1
                        ? "1px solid var(--border-color)"
                        : "none",
                  }}
                >
                  <Sparkles
                    size={14}
                    className="text-emerald-400"
                    style={{ flexShrink: 0, marginTop: "2px" }}
                  />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
