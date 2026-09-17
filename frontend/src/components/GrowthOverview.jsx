import React from "react";
import { PieChart } from "lucide-react";

export default function GrowthOverview({ summary = {}, counts = {} }) {
  const financialCount =
    counts.financial || summary.user_financial_records || 0;
  const studyCount = counts.study || summary.user_study_records || 0;
  const habitCount = counts.habit || summary.user_habit_records || 0;
  const activityCount = counts.activity || 0;

  const total = financialCount + studyCount + habitCount + activityCount;

  const categories = [
    {
      label: "Financial",
      count: financialCount,
      color: "#10b981",
      bg: "var(--accent-financial-bg)",
    },
    {
      label: "Study",
      count: studyCount,
      color: "#3b82f6",
      bg: "var(--accent-study-bg)",
    },
    {
      label: "Habits",
      count: habitCount,
      color: "#8b5cf6",
      bg: "var(--accent-habit-bg)",
    },
    {
      label: "Activity",
      count: activityCount,
      color: "#f97316",
      bg: "var(--accent-activity-bg)",
    },
  ];

  // SVG Donut calculation
  const size = 150;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="card-title-group">
          <h2>
            <PieChart size={18} className="text-cyan-400" />
            <span>Growth Overview</span>
          </h2>
          <p>Distribution of your tracked personal data</p>
        </div>
      </div>

      <div className="donut-chart-wrapper">
        <div className="donut-svg-box">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--bg-surface)"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {total > 0 ? (
              categories.map((cat, idx) => {
                const percent = cat.count / total;
                const strokeDasharray = `${(percent * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
                const strokeDashoffset = -accumulatedPercent * circumference;
                accumulatedPercent += percent;

                if (cat.count === 0) return null;

                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={cat.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                );
              })
            ) : (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
              />
            )}
          </svg>

          {/* Center Metric Text */}
          <div className="donut-center-metric">
            <div className="donut-center-value">{total}</div>
            <div className="donut-center-label">Total Logs</div>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="donut-legend-grid">
          {categories.map((cat, idx) => {
            const percentage =
              total > 0 ? Math.round((cat.count / total) * 100) : 0;
            return (
              <div key={idx} className="donut-legend-entry">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: cat.color,
                    }}
                  />
                  <span style={{ color: "var(--text-secondary)" }}>
                    {cat.label}
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
