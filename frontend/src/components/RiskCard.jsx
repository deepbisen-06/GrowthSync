import React from "react";
import {
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function RiskCard({ risks = [] }) {
  if (!risks || risks.length === 0) {
    return (
      <div className="analytics-card" style={{ height: "100%" }}>
        <div className="analytics-card-header">
          <div className="card-title-group">
            <h2>
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>Future Threat & Risk Engine</span>
            </h2>
            <p>
              Algorithmic trend risk analysis across financial, study, and habit
              trends
            </p>
          </div>
        </div>
        <div className="growth-empty-state" style={{ height: "180px" }}>
          <CheckCircle2 size={28} className="text-emerald-400" />
          <div className="empty-state-title" style={{ color: "#10b981" }}>
            No High Risks Detected
          </div>
          <p className="empty-state-desc">
            Your financial spending, study hours, and lifestyle habits are
            currently tracking within healthy parameters.
          </p>
        </div>
      </div>
    );
  }

  const getLevelStyle = (level) => {
    switch (level) {
      case "HIGH":
        return {
          bg: "rgba(239, 68, 68, 0.12)",
          border: "rgba(239, 68, 68, 0.35)",
          color: "#ef4444",
          icon: ShieldAlert,
        };
      case "MEDIUM":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          border: "rgba(245, 158, 11, 0.35)",
          color: "#f59e0b",
          icon: AlertTriangle,
        };
      default:
        return {
          bg: "rgba(59, 130, 246, 0.12)",
          border: "rgba(59, 130, 246, 0.35)",
          color: "#3b82f6",
          icon: AlertCircle,
        };
    }
  };

  return (
    <div className="analytics-card" style={{ height: "100%" }}>
      <div className="analytics-card-header">
        <div className="card-title-group">
          <h2>
            <AlertTriangle size={18} className="text-orange-400" />
            <span>Future Threat & Risk Advisory</span>
          </h2>
          <p>
            Early warning indicators derived from negative velocity or goal
            deviation
          </p>
        </div>
        <span
          className="sidebar-badge"
          style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}
        >
          {risks.length}{" "}
          {risks.length === 1 ? "Threat Flagged" : "Threats Flagged"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          marginTop: "0.5rem",
        }}
      >
        {risks.map((risk, idx) => {
          const style = getLevelStyle(risk.level);
          const Icon = style.icon;
          return (
            <div
              key={idx}
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: "8px",
                padding: "0.85rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Icon size={16} style={{ color: style.color }} />
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {risk.category} &bull; {risk.reason}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.45rem",
                    borderRadius: "4px",
                    background: style.color,
                    color: "#ffffff",
                  }}
                >
                  {risk.level}
                </span>
              </div>

              <div
                style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}
              >
                <strong>Evidence:</strong> {risk.supporting_metric}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.76rem",
                  color: style.color,
                  fontWeight: 600,
                  marginTop: "0.2rem",
                }}
              >
                <ArrowRight size={13} />
                <span>Suggested Action: {risk.recommendation}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
