import React, { useState } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

export default function ForecastChart({
  historyComparison = [],
  savingsProjection = [],
  title = "Actual vs Predicted Trajectory",
  type = "expenses", // 'expenses' or 'savings'
}) {
  const [activeTab, setActiveTab] = useState("comparison"); // 'comparison' or 'projection'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const isExpense = type === "expenses";
  const primaryColor = isExpense ? "#f97316" : "#10b981"; // orange for expenses, emerald for savings
  const predictedColor = isExpense ? "#fb923c" : "#34d399";

  const chartData =
    activeTab === "comparison"
      ? historyComparison.map((h) => ({
          label: h.month_label,
          actual: isExpense ? h.actual_expenses : h.actual_savings,
          predicted: isExpense ? h.predicted_expenses : h.predicted_savings,
        }))
      : savingsProjection.map((p) => ({
          label: p.label,
          actual: null,
          predicted: isExpense
            ? p.predicted_monthly_expenses
            : p.predicted_monthly_savings,
          cumulative: p.projected_cumulative_savings,
        }));

  const width = 680;
  const height = 220;
  const paddingX = 45;
  const paddingY = 30;

  const validValues = chartData
    .flatMap((d) => [d.actual, d.predicted])
    .filter((v) => typeof v === "number" && !isNaN(v));

  const maxVal =
    validValues.length > 0 ? Math.max(...validValues) * 1.15 : 50000;
  const minVal =
    validValues.length > 0 ? Math.min(0, Math.min(...validValues)) : 0;
  const range = maxVal - minVal || 1;

  const getY = (val) => {
    if (val === null || val === undefined) return height - paddingY;
    const ratio = (val - minVal) / range;
    return height - paddingY - ratio * (height - 2 * paddingY);
  };

  const getX = (idx) => {
    if (chartData.length <= 1) return width / 2;
    return paddingX + (idx / (chartData.length - 1)) * (width - 2 * paddingX);
  };

  // Build SVG Paths
  const actualPoints = chartData
    .map((d, i) =>
      d.actual !== null
        ? { x: getX(i), y: getY(d.actual), val: d.actual, label: d.label }
        : null,
    )
    .filter(Boolean);
  const predictedPoints = chartData
    .map((d, i) =>
      d.predicted !== null
        ? { x: getX(i), y: getY(d.predicted), val: d.predicted, label: d.label }
        : null,
    )
    .filter(Boolean);

  const actualPath = actualPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const predictedPath = predictedPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="analytics-card" style={{ marginBottom: "1.25rem" }}>
      <div className="analytics-card-header">
        <div className="card-title-group">
          <h2>
            <TrendingUp size={18} style={{ color: primaryColor }} />
            <span>{title}</span>
          </h2>
          <p>
            Linear Regression numerical forecast vs recorded PostgreSQL values
          </p>
        </div>

        <div className="time-filter-pills">
          <button
            className={`time-pill-btn ${activeTab === "comparison" ? "active" : ""}`}
            onClick={() => setActiveTab("comparison")}
          >
            Historical vs Predicted
          </button>
          {savingsProjection.length > 0 && (
            <button
              className={`time-pill-btn ${activeTab === "projection" ? "active" : ""}`}
              onClick={() => setActiveTab("projection")}
            >
              Future Projections (3M–1Y)
            </button>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="growth-empty-state" style={{ height: "200px" }}>
          <AlertCircle size={24} className="text-muted" />
          <div className="empty-state-title">
            No Comparison Records Available
          </div>
          <p className="empty-state-desc">
            Log monthly financial records to view trend curves.
          </p>
        </div>
      ) : (
        <div className="chart-container-box">
          <svg
            className="svg-chart"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingY + ratio * (height - 2 * paddingY);
              const gridVal = maxVal - ratio * range;
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="var(--chart-grid)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    fill="var(--text-muted)"
                    fontSize="9"
                    textAnchor="end"
                  >
                    ₹{Math.round(gridVal / 1000)}k
                  </text>
                </g>
              );
            })}

            {/* Actual Curve (Solid) */}
            {actualPath && (
              <path
                d={actualPath}
                fill="none"
                stroke={primaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Predicted Curve (Dashed) */}
            {predictedPath && (
              <path
                d={predictedPath}
                fill="none"
                stroke={predictedColor}
                strokeWidth="2.2"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Actual Points */}
            {actualPoints.map((p, i) => (
              <circle
                key={`act-${i}`}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={primaryColor}
                stroke="var(--bg-card)"
                strokeWidth="2"
                onMouseEnter={() =>
                  setHoveredPoint({
                    label: p.label,
                    type: "Actual",
                    value: p.val,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: "pointer" }}
              />
            ))}

            {/* Predicted Points */}
            {predictedPoints.map((p, i) => (
              <g key={`pred-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="var(--bg-card)"
                  stroke={predictedColor}
                  strokeWidth="2"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      label: p.label,
                      type: "Predicted",
                      value: p.val,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: "pointer" }}
                />
                <rect
                  x={p.x - 15}
                  y={0}
                  width={30}
                  height={height}
                  fill="transparent"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      label: p.label,
                      type: "Predicted",
                      value: p.val,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: "pointer" }}
                />
              </g>
            ))}
          </svg>

          {hoveredPoint && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "20px",
                background: "var(--chart-tooltip-bg)",
                color: "#ffffff",
                padding: "0.5rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.78rem",
                boxShadow: "0 6px 16px rgba(0,0,0,0.45)",
                pointerEvents: "none",
                zIndex: 10,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{ fontWeight: 700, color: "var(--text-primary, #fff)" }}
              >
                {hoveredPoint.label}
              </div>
              <div
                style={{
                  color:
                    hoveredPoint.type === "Actual"
                      ? primaryColor
                      : predictedColor,
                  marginTop: "2px",
                }}
              >
                {hoveredPoint.type}: ₹
                {hoveredPoint.value?.toLocaleString("en-IN")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="chart-legend-row" style={{ marginTop: "0.75rem" }}>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: primaryColor }} />
          <span>Actual Recorded Values</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-dot"
            style={{ background: predictedColor, border: "1px dashed #fff" }}
          />
          <span>ML Linear Regression Forecast</span>
        </div>
      </div>
    </div>
  );
}
