import React from "react";
import { Compass, CheckCircle2, ArrowRight } from "lucide-react";

export default function GrowthJourney({
  hasFinancial = false,
  hasStudy = false,
  hasHabits = false,
  totalRecords = 0,
  setCurrentRoute,
}) {
  const steps = [
    {
      id: "data_added",
      name: "Data Added",
      desc: "Profile & initial metrics submitted",
      completed: totalRecords > 0,
      progress: Math.min(100, (totalRecords / 3) * 100),
      color: "#10b981",
    },
    {
      id: "goals_set",
      name: "Goals Set",
      desc: "Financial & academic targets defined",
      completed: hasFinancial && hasStudy,
      progress:
        hasFinancial && hasStudy ? 100 : hasFinancial || hasStudy ? 50 : 0,
      color: "#3b82f6",
    },
    {
      id: "habits_tracked",
      name: "Habits Tracked",
      desc: "Daily sleep, exercise & screen logs",
      completed: hasHabits,
      progress: hasHabits ? 100 : 0,
      color: "#8b5cf6",
    },
    {
      id: "progress_achieved",
      name: "Progress Achieved",
      desc: "Consistent multiday dataset compiled",
      completed: totalRecords >= 5,
      progress: Math.min(100, (totalRecords / 5) * 100),
      color: "#f97316",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const overallProgress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>
            <Compass size={18} className="text-emerald-400" />
            <span>Growth Journey</span>
          </h2>
          <p>Your milestone progression path</p>
        </div>
        <span className="badge badge-emerald">{overallProgress}% Complete</span>
      </div>

      <div className="funnel-steps-list">
        {steps.map((step) => (
          <div key={step.id} className="funnel-step-item">
            <div className="funnel-step-header">
              <div className="funnel-step-title">
                {step.completed ? (
                  <CheckCircle2 size={15} style={{ color: step.color }} />
                ) : (
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      border: "2px solid var(--border-subtle)",
                      display: "inline-block",
                    }}
                  />
                )}
                <span>{step.name}</span>
              </div>
              <span
                className={`funnel-step-badge ${step.completed ? "complete" : ""}`}
              >
                {step.completed ? "Done" : `${Math.round(step.progress)}%`}
              </span>
            </div>

            <div className="funnel-progress-track">
              <div
                className="funnel-progress-fill"
                style={{
                  width: `${step.progress}%`,
                  background: step.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {totalRecords === 0 && (
        <div
          style={{
            textAlign: "center",
            marginTop: "0.85rem",
            padding: "0.5rem",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginBottom: "0.4rem",
            }}
          >
            Start tracking to see your growth journey progress.
          </p>
          <button
            onClick={() => setCurrentRoute("financial")}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "0.74rem", padding: "0.25rem 0.6rem" }}
          >
            Start Now <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
