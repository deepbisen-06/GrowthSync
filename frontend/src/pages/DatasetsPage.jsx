import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import StatCard from "../components/StatCard";
import {
  Download,
  FileSpreadsheet,
  Database,
  ArrowLeft,
  Shield,
  Info,
} from "lucide-react";

export default function DatasetsPage({ setCurrentRoute }) {
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("live");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/api/datasets/summary");
        setSummary(res.data);
      } catch (err) {
        console.error("Failed to load dataset summary", err);
      }
    };
    fetchSummary();
  }, []);

  const handleExportCSV = async () => {
    try {
      setDownloading(true);
      setError("");
      // Trigger browser download via API
      const res = await api.get("/api/datasets/export", {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "anonymized_collected_dataset.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess("Anonymized dataset CSV exported successfully!");
    } catch {
      setError("Failed to download exported dataset.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => setCurrentRoute("dashboard")}
          className="btn btn-secondary"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <button
          onClick={handleExportCSV}
          className="btn btn-success"
          disabled={downloading}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {downloading ? (
            <>
              <div className="spinner" />
              <span>Exporting CSV...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Export Anonymized CSV</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      {/* Dataset Header Card */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h1 className="card-title">
            <Database size={20} className="text-cyan-400" />
            <span>Dataset Management & ML Readiness</span>
          </h1>
          <span className="badge badge-success">
            <Shield size={12} /> Privacy Guaranteed
          </span>
        </div>
        <p className="card-desc" style={{ marginBottom: "1rem" }}>
          In Milestone 1, all collected user profile, financial, academic study,
          and daily habit logs are structured and validated in PostgreSQL. Data
          is pre-formatted for future data science analysis and machine learning
          model training in upcoming milestones.
        </p>

        <div className="alert alert-info">
          <Info size={18} className="flex-shrink-0" />
          <div>
            <strong>Anonymization Standard:</strong> When exporting collected
            datasets, personally identifiable information (PII) including{" "}
            <code>full_name</code>, <code>email</code>, and{" "}
            <code>password_hash</code> are strictly stripped to ensure academic
            privacy compliance.
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        <StatCard
          title="Total Users"
          value={summary?.total_users ?? 0}
          subtitle="Registered participants"
          badgeText="PostgreSQL"
          badgeColor="primary"
        />
        <StatCard
          title="Financial Entries"
          value={summary?.total_financial_records ?? 0}
          subtitle="Aggregated rows"
          badgeText="Ready"
          badgeColor="cyan"
        />
        <StatCard
          title="Study Logs"
          value={summary?.total_study_records ?? 0}
          subtitle="Aggregated sessions"
          badgeText="Ready"
          badgeColor="primary"
        />
        <StatCard
          title="Habit Records"
          value={summary?.total_habit_records ?? 0}
          subtitle="Aggregated logs"
          badgeText="Ready"
          badgeColor="emerald"
        />
      </div>

      {/* Dataset Exploration Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FileSpreadsheet size={18} className="text-blue-400" />
            <span>Sample Datasets & Structure Guide</span>
          </h2>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              onClick={() => setActiveTab("live")}
              className={`btn ${activeTab === "live" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            >
              Export Format
            </button>
            <button
              onClick={() => setActiveTab("sample_fin")}
              className={`btn ${activeTab === "sample_fin" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            >
              Sample Financial
            </button>
            <button
              onClick={() => setActiveTab("sample_study")}
              className={`btn ${activeTab === "sample_study" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            >
              Sample Study
            </button>
            <button
              onClick={() => setActiveTab("sample_habit")}
              className={`btn ${activeTab === "sample_habit" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            >
              Sample Habit
            </button>
          </div>
        </div>

        {activeTab === "live" && (
          <div>
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-secondary)",
                marginBottom: "0.75rem",
              }}
            >
              Unified CSV export schema generated directly from PostgreSQL:
            </p>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                    <th>Description</th>
                    <th>Anonymized / PII</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>record_category</code>
                    </td>
                    <td>VARCHAR</td>
                    <td>FINANCIAL, STUDY, or HABIT</td>
                    <td>
                      <span className="badge badge-success">Safe</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>anonymous_user_id</code>
                    </td>
                    <td>VARCHAR</td>
                    <td>
                      Masked user identifier (e.g. <code>anon_usr_0001</code>)
                    </td>
                    <td>
                      <span className="badge badge-success">Pseudonymized</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>user_age / user_gender</code>
                    </td>
                    <td>INT / VARCHAR</td>
                    <td>Demographic metrics for ML feature correlation</td>
                    <td>
                      <span className="badge badge-success">De-identified</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>user_education_level / user_course</code>
                    </td>
                    <td>VARCHAR</td>
                    <td>Academic profile background variables</td>
                    <td>
                      <span className="badge badge-success">De-identified</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>financial_income / expenses / savings</code>
                    </td>
                    <td>FLOAT</td>
                    <td>Quantitative financial metrics</td>
                    <td>
                      <span className="badge badge-success">Safe</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>study_hours / study_subjects / study_date</code>
                    </td>
                    <td>FLOAT / TEXT / DATE</td>
                    <td>Academic productivity metrics</td>
                    <td>
                      <span className="badge badge-success">Safe</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>
                        habit_sleep_hours / exercise_minutes / screen_time
                      </code>
                    </td>
                    <td>FLOAT / INT / FLOAT</td>
                    <td>Daily lifestyle and wellness variables</td>
                    <td>
                      <span className="badge badge-success">Safe</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sample_fin" && (
          <div>
            <span
              className="badge badge-amber"
              style={{ marginBottom: "0.75rem" }}
            >
              REFERENCE SAMPLE DATA ONLY
            </span>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Monthly Income</th>
                    <th>Monthly Expenses</th>
                    <th>Monthly Savings</th>
                    <th>Financial Goal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>101</td>
                    <td>$4,500.00</td>
                    <td>$2,800.00</td>
                    <td>$1,700.00</td>
                    <td>Save for Masters Degree</td>
                  </tr>
                  <tr>
                    <td>102</td>
                    <td>$6,200.00</td>
                    <td>$3,900.00</td>
                    <td>$2,300.00</td>
                    <td>Emergency Fund & Investments</td>
                  </tr>
                  <tr>
                    <td>103</td>
                    <td>$3,200.00</td>
                    <td>$2,100.00</td>
                    <td>$1,100.00</td>
                    <td>Clear Student Loan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sample_study" && (
          <div>
            <span
              className="badge badge-amber"
              style={{ marginBottom: "0.75rem" }}
            >
              REFERENCE SAMPLE DATA ONLY
            </span>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Study Hours</th>
                    <th>Subjects</th>
                    <th>Academic Goal</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>101</td>
                    <td>4.5 hrs</td>
                    <td>Machine Learning, Linear Algebra</td>
                    <td>Complete Project Milestone 1</td>
                    <td>2026-08-01</td>
                  </tr>
                  <tr>
                    <td>102</td>
                    <td>6.0 hrs</td>
                    <td>Data Structures, Operating Systems</td>
                    <td>Ace Technical Interview</td>
                    <td>2026-08-02</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sample_habit" && (
          <div>
            <span
              className="badge badge-amber"
              style={{ marginBottom: "0.75rem" }}
            >
              REFERENCE SAMPLE DATA ONLY
            </span>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Sleep Hours</th>
                    <th>Exercise (Mins)</th>
                    <th>Screen Time</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>101</td>
                    <td>7.5 hrs</td>
                    <td>45 mins</td>
                    <td>6.0 hrs</td>
                    <td>Morning run and meditation; focused study session.</td>
                  </tr>
                  <tr>
                    <td>102</td>
                    <td>6.5 hrs</td>
                    <td>30 mins</td>
                    <td>8.5 hrs</td>
                    <td>
                      Heavy screen time preparing presentation; evening walk.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
