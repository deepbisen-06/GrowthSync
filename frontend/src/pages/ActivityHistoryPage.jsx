import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import { Clock, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ActivityHistoryPage({ setCurrentRoute }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/activity-history");
        setActivities(res.data);
      } catch (err) {
        setError(err.formattedMessage || "Failed to load activity logs.");
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const filtered = activities.filter((act) => {
    const matchesFilter =
      filterType === "ALL" || act.activity_type.includes(filterType);
    const matchesSearch =
      (act.activity_description &&
        act.activity_description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (act.activity_type &&
        act.activity_type.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

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
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div className="card-title-group">
            <h1 className="card-title">
              <Clock size={20} className="text-orange-400" />
              <span>Full Activity History & Audit Trail</span>
            </h1>
            <p>Every action is permanently recorded in PostgreSQL</p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.82rem",
                  width: "200px",
                }}
              />
            </div>

            {/* Filter Pills */}
            <select
              className="form-control"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: "0.45rem 0.85rem",
                fontSize: "0.82rem",
                width: "160px",
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="FINANCIAL">Financial Data</option>
              <option value="STUDY">Study Records</option>
              <option value="HABIT">Habit Logs</option>
              <option value="PROFILE">Profile Updates</option>
              <option value="USER_">Authentication</option>
            </select>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "3rem",
            }}
          >
            <div
              className="spinner"
              style={{ width: "2rem", height: "2rem", borderWidth: "3px" }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="growth-empty-state">
            <div className="empty-icon-wrap">
              <ShieldCheck size={24} />
            </div>
            <div className="empty-state-title">No Audit Logs Found</div>
            <p className="empty-state-desc">
              {searchTerm || filterType !== "ALL"
                ? "No records matched your search/filter criteria."
                : "Submit financial, study, or habit records to generate activity logs."}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Category</th>
                  <th>Activity Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((act) => (
                  <tr key={act.id}>
                    <td
                      style={{
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(act.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-emerald">
                        {act.activity_type}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-primary)" }}>
                      {act.activity_description}
                    </td>
                    <td>
                      <span className="badge badge-blue">Verified in DB</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
