import React from "react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = "primary",
}) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              background: "var(--bg-surface)",
              padding: "6px",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent-cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: "0.25rem",
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {subtitle && (
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {subtitle}
          </span>
        )}
        {badgeText && (
          <span className={`badge badge-${badgeColor}`}>{badgeText}</span>
        )}
      </div>
    </div>
  );
}
