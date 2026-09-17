import React, { useState } from "react";
import { LineChart, Calendar } from "lucide-react";

export default function PerformanceChart({
  studyRecords = [],
  habitRecords = [],
  setCurrentRoute,
}) {
  const [timeFilter, setTimeFilter] = useState("7d");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute daily chart points from real database records
  const generateChartData = () => {
    const daysCount = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 14;
    const now = new Date();
    const dataPoints = [];

    // Index existing records by date
    const studyMap = {};
    studyRecords.forEach((r) => {
      if (r.study_date)
        studyMap[r.study_date] =
          (studyMap[r.study_date] || 0) + (r.study_hours || 0);
    });

    const habitMap = {};
    habitRecords.forEach((h) => {
      if (h.record_date) {
        // Compute habit index (e.g. sleep/8 + exercise/45)
        const score = Math.min(
          10,
          ((h.sleep_hours || 0) / 8) * 5 + ((h.exercise_minutes || 0) / 45) * 5,
        );
        habitMap[h.record_date] = parseFloat(score.toFixed(1));
      }
    });

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      dataPoints.push({
        date: dateStr,
        label,
        studyHours: studyMap[dateStr] || 0,
        habitScore: habitMap[dateStr] || 0,
      });
    }

    return dataPoints;
  };

  const points = generateChartData();
  const hasData = studyRecords.length > 0 || habitRecords.length > 0;

  // Chart SVG Coordinates Calculation
  const width = 680;
  const height = 200;
  const paddingX = 40;
  const paddingY = 25;

  const maxStudy = Math.max(8, ...points.map((p) => p.studyHours));
  const maxHabit = 10;

  const getStudyY = (val) =>
    height - paddingY - (val / maxStudy) * (height - 2 * paddingY);
  const getHabitY = (val) =>
    height - paddingY - (val / maxHabit) * (height - 2 * paddingY);
  const getX = (idx) =>
    paddingX + (idx / (points.length - 1)) * (width - 2 * paddingX);

  const studyPath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getStudyY(p.studyHours).toFixed(1)}`,
    )
    .join(" ");

  const habitPath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getHabitY(p.habitScore).toFixed(1)}`,
    )
    .join(" ");

  const studyArea = `${studyPath} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="card-title-group">
          <h2>
            <LineChart size={18} className="text-emerald-400" />
            <span>Performance Insights</span>
          </h2>
          <p>
            Daily correlation between academic study hours & habit consistency
          </p>
        </div>

        <div className="time-filter-pills">
          <button
            className={`time-pill-btn ${timeFilter === "7d" ? "active" : ""}`}
            onClick={() => setTimeFilter("7d")}
          >
            Last 7 Days
          </button>
          <button
            className={`time-pill-btn ${timeFilter === "30d" ? "active" : ""}`}
            onClick={() => setTimeFilter("30d")}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="growth-empty-state" style={{ height: "230px" }}>
          <div className="empty-icon-wrap">
            <Calendar size={24} />
          </div>
          <div className="empty-state-title">No Performance Logs Yet</div>
          <p className="empty-state-desc">
            Start recording study sessions or daily habits to visualize your
            personal progress trends.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setCurrentRoute("study")}
              className="btn btn-secondary btn-sm"
            >
              Log Study
            </button>
            <button
              onClick={() => setCurrentRoute("habit")}
              className="btn btn-secondary btn-sm"
            >
              Track Habit
            </button>
          </div>
        </div>
      ) : (
        <div className="chart-container-box">
          <svg
            className="svg-chart"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="studyAreaGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, idx) => {
              const y = paddingY + ratio * (height - 2 * paddingY);
              return (
                <line
                  key={idx}
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="var(--chart-grid)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Study Hours Area & Line (Blue) */}
            <path d={studyArea} fill="url(#studyAreaGradient)" />
            <path
              d={studyPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Habit Score Line (Purple) */}
            <path
              d={habitPath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Dots & Hover trigger */}
            {points.map((p, i) => {
              const cx = getX(i);
              const cyStudy = getStudyY(p.studyHours);
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={cx}
                    cy={cyStudy}
                    r="4"
                    fill="#3b82f6"
                    stroke="var(--bg-card)"
                    strokeWidth="2"
                  />
                  {/* Transparent hover target */}
                  <rect
                    x={cx - 15}
                    y={0}
                    width={30}
                    height={height}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltip Overlay */}
          {hoveredPoint && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "var(--chart-tooltip-bg)",
                color: "#ffffff",
                padding: "0.45rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.76rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                zIndex: 10,
                pointerEvents: "none",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                {hoveredPoint.label} ({hoveredPoint.date})
              </div>
              <div style={{ color: "#93c5fd" }}>
                Study: {hoveredPoint.studyHours} hrs
              </div>
              <div style={{ color: "#c4b5fd" }}>
                Habit Score: {hoveredPoint.habitScore}/10
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="chart-legend-row">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#3b82f6" }} />
          <span>Study Hours (Daily)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#8b5cf6" }} />
          <span>Habit Consistency Score</span>
        </div>
      </div>
    </div>
  );
}
