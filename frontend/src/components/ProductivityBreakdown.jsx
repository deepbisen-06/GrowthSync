import React from "react";
import {
  Zap,
  BookOpen,
  Moon,
  Activity,
  Monitor,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

export default function ProductivityBreakdown({ productivityData = {} }) {
  const {
    productivity_score = 0,
    breakdown = { study: 0, sleep: 0, exercise: 0, screen_time: 0 },
    change_percentage = 0.0,
    trend = "stable",
    confidence_label = "Moderate Confidence",
  } = productivityData;

  const factors = [
    {
      key: "study",
      label: "Study Progress & Consistency",
      weight: "35%",
      score: breakdown.study || 0,
      icon: BookOpen,
      color: "#3b82f6",
    },
    {
      key: "sleep",
      label: "Sleep Regularity & Rest",
      weight: "25%",
      score: breakdown.sleep || 0,
      icon: Moon,
      color: "#8b5cf6",
    },
    {
      key: "exercise",
      label: "Physical Activity Regularity",
      weight: "20%",
      score: breakdown.exercise || 0,
      icon: Activity,
      color: "#10b981",
    },
    {
      key: "screen_time",
      label: "Digital Balance & Focus",
      weight: "20%",
      score: breakdown.screen_time || 0,
      icon: Monitor,
      color: "#f59e0b",
    },
  ];

  const getTrendBadge = () => {
    if (trend === "improving") {
      return (
        <span
          className="trend-badge positive"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <TrendingUp size={14} />
          <span>Improving (+{change_percentage}%)</span>
        </span>
      );
    } else if (trend === "declining") {
      return (
        <span
          className="trend-badge negative"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <TrendingDown size={14} />
          <span>Declining ({change_percentage}%)</span>
        </span>
      );
    }
    return (
      <span
        className="trend-badge neutral"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
      >
        <Minus size={14} />
        <span>Stable (±{Math.abs(change_percentage)}%)</span>
      </span>
    );
  };

  return (
    <div className="analytics-card" style={{ height: "100%" }}>
      <div className="analytics-card-header">
        <div className="card-title-group">
          <h2>
            <Zap size={18} className="text-emerald-400" />
            <span>Productivity Score Engine</span>
          </h2>
          <p>
            Explainable composite index derived from multi-domain personal
            metrics
          </p>
        </div>
        {getTrendBadge()}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: `conic-gradient(#10b981 ${productivity_score * 3.6}deg, var(--bg-hover) 0deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "86px",
              height: "86px",
              borderRadius: "50%",
              background: "var(--bg-card)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {productivity_score}
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              / 100 Score
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "0.25rem",
            }}
          >
            Performance Assessment
          </div>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {productivity_score >= 80
              ? "Exceptional execution across academic focus, physical workouts, and rest consistency."
              : productivity_score >= 60
                ? "Solid personal routine with tangible opportunities to optimize study volume or sleep regularity."
                : "Score signals an emerging dip in consistency. Re-align daily habits to rebuild positive momentum."}
          </p>
          <div style={{ marginTop: "0.5rem" }}>
            <span
              className="sidebar-badge"
              style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
            >
              {confidence_label}
            </span>
          </div>
        </div>
      </div>

      {/* Factor Breakdown Bars */}
      <div
        style={{
          marginTop: "0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        {factors.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.78rem",
                  marginBottom: "0.3rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  <Icon size={14} style={{ color: f.color }} />
                  <span>{f.label}</span>
                  <span
                    style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                  >
                    ({f.weight})
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: f.color }}>
                  {f.score} / 100
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "7px",
                  background: "var(--bg-hover)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, f.score))}%`,
                    height: "100%",
                    background: f.color,
                    borderRadius: "4px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
