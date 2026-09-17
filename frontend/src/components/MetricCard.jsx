import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function MetricCard({
  title,
  value,
  unit = "",
  trendText,
  trendType = "positive", // positive, neutral, negative
  subtext,
  icon: Icon,
  colorVariant = "emerald", // emerald, blue, purple, orange
  sparklineData = [12, 18, 15, 22, 28, 25, 34],
}) {
  // Generate simple SVG path for sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 70;
    const height = 24;

    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const colors = {
      emerald: "#10b981",
      blue: "#3b82f6",
      purple: "#8b5cf6",
      orange: "#f97316",
    };
    const strokeColor = colors[colorVariant] || "#10b981";

    return (
      <svg className="kpi-sparkline-svg" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
      </svg>
    );
  };

  return (
    <div className="growth-kpi-card">
      <div className="kpi-top-row">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <div className={`kpi-icon-badge ${colorVariant}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="kpi-main-metric">
        <span className="kpi-value">{value}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>

      <div className="kpi-bottom-row">
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {trendText && (
            <span className={`kpi-trend-pill ${trendType}`}>
              {trendType === "positive" ? (
                <TrendingUp size={12} />
              ) : trendType === "negative" ? (
                <TrendingDown size={12} />
              ) : (
                <Minus size={12} />
              )}
              {trendText}
            </span>
          )}
          {subtext && <span className="kpi-subtext">{subtext}</span>}
        </div>

        {renderSparkline()}
      </div>
    </div>
  );
}
