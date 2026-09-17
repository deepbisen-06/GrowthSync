import React from "react";
import { Cpu } from "lucide-react";

export default function ModelTransparencyCard({
  modelMetadata = {},
  observationCount = 0,
}) {
  const {
    model_name = "Linear Regression (scikit-learn)",
    evaluation_status = "Insufficient data for reliable model evaluation.",
    sample_count = observationCount,
    mae = null,
    rmse = null,
    r2 = null,
  } = modelMetadata;

  const isEvaluated = evaluation_status === "Evaluated";

  return (
    <div className="analytics-card" style={{ marginTop: "1.25rem" }}>
      <div className="analytics-card-header">
        <div className="card-title-group">
          <h2>
            <Cpu size={18} className="text-blue-400" />
            <span>Model Transparency & Evaluation Metrics</span>
          </h2>
          <p>
            Verified Machine Learning parameters, sample sizes, and empirical
            validation metrics
          </p>
        </div>
        <span
          className="sidebar-badge"
          style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
        >
          Production ML Baseline
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginTop: "0.75rem",
        }}
      >
        {/* Param 1: Model Type */}
        <div
          style={{
            background: "var(--bg-hover)",
            padding: "0.85rem",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Algorithm / Baseline
          </div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginTop: "0.25rem",
            }}
          >
            {model_name}
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            scikit-learn Ordinary Least Squares
          </div>
        </div>

        {/* Param 2: Training Samples */}
        <div
          style={{
            background: "var(--bg-hover)",
            padding: "0.85rem",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Historical Observations
          </div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginTop: "0.25rem",
            }}
          >
            {sample_count} Recorded Periods
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            Stored in PostgreSQL DB
          </div>
        </div>

        {/* Param 3: Evaluation Status */}
        <div
          style={{
            background: "var(--bg-hover)",
            padding: "0.85rem",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Model Evaluation
          </div>
          <div
            style={{
              fontSize: isEvaluated ? "0.95rem" : "0.78rem",
              fontWeight: 700,
              color: isEvaluated ? "#10b981" : "#f59e0b",
              marginTop: "0.25rem",
            }}
          >
            {evaluation_status}
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            {isEvaluated
              ? "Calculated on historical split"
              : "Requires ≥ 5 temporal observations"}
          </div>
        </div>

        {/* Param 4: Empirical Metrics */}
        <div
          style={{
            background: "var(--bg-hover)",
            padding: "0.85rem",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Validation Metrics (MAE / R²)
          </div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginTop: "0.25rem",
            }}
          >
            {isEvaluated ? `MAE: ₹${mae} | R²: ${r2}` : "N/A (Awaiting Data)"}
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            {isEvaluated
              ? `RMSE: ₹${rmse}`
              : "Synthetic accuracy strictly avoided"}
          </div>
        </div>
      </div>
    </div>
  );
}
