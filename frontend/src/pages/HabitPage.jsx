import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import PersonalTrends from "../components/PersonalTrends";
import DatasetAnalysis from "../components/DatasetAnalysis";
import {
  Activity,
  PlusCircle,
  ArrowLeft,
  History,
  Moon,
  Dumbbell,
  Smartphone,
} from "lucide-react";

export default function HabitPage({ setCurrentRoute }) {
  const [records, setRecords] = useState([]);
  const [, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    sleep_hours: "",
    exercise_minutes: "",
    screen_time: "",
    habit_notes: "",
    record_date: today,
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/habit-records");
      setRecords(res.data);
    } catch (err) {
      setError(err.formattedMessage || "Failed to load habit records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.sleep_hours ||
      !formData.exercise_minutes ||
      !formData.screen_time ||
      !formData.record_date
    ) {
      setError(
        "Please fill in sleep hours, exercise minutes, screen time, and date.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sleep_hours: parseFloat(formData.sleep_hours),
        exercise_minutes: parseInt(formData.exercise_minutes, 10),
        screen_time: parseFloat(formData.screen_time),
        habit_notes: formData.habit_notes.trim() || null,
        record_date: formData.record_date,
      };
      await api.post("/api/habit-records", payload);
      setSuccess("Daily habit record saved in PostgreSQL.");
      setFormData({
        sleep_hours: "",
        exercise_minutes: "",
        screen_time: "",
        habit_notes: "",
        record_date: today,
      });
      fetchRecords();
    } catch (err) {
      setError(err.formattedMessage || "Failed to save habit data.");
    } finally {
      setIsSubmitting(false);
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
      </div>

      <div className="grid-2">
        {/* Form Card */}
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">
              <Activity size={20} className="text-emerald-400" />
              <span>Submit Daily Habit Data</span>
            </h1>
          </div>
          <p className="card-desc" style={{ marginBottom: "1.25rem" }}>
            Track daily sleep, exercise, screen time, and wellness notes.
          </p>

          {error && (
            <Alert type="error" message={error} onClose={() => setError("")} />
          )}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="habit-sleep">
                  <Moon
                    size={14}
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: "4px",
                    }}
                  />
                  Sleep Duration (Hours) <span className="required">*</span>
                </label>
                <input
                  id="habit-sleep"
                  name="sleep_hours"
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  className="form-control"
                  placeholder="e.g. 7.5"
                  value={formData.sleep_hours}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="habit-exercise">
                  <Dumbbell
                    size={14}
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: "4px",
                    }}
                  />
                  Exercise (Minutes) <span className="required">*</span>
                </label>
                <input
                  id="habit-exercise"
                  name="exercise_minutes"
                  type="number"
                  min="0"
                  max="1440"
                  className="form-control"
                  placeholder="e.g. 45"
                  value={formData.exercise_minutes}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="habit-screen">
                  <Smartphone
                    size={14}
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: "4px",
                    }}
                  />
                  Screen Time (Hours) <span className="required">*</span>
                </label>
                <input
                  id="habit-screen"
                  name="screen_time"
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  className="form-control"
                  placeholder="e.g. 6.0"
                  value={formData.screen_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="habit-date">
                  Record Date <span className="required">*</span>
                </label>
                <input
                  id="habit-date"
                  name="record_date"
                  type="date"
                  className="form-control"
                  value={formData.record_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="habit-notes">
                Additional Habit / Wellness Notes
              </label>
              <textarea
                id="habit-notes"
                name="habit_notes"
                rows="3"
                className="form-control"
                placeholder="e.g. Morning meditation, good hydration, focused workflow."
                value={formData.habit_notes}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ marginTop: "1rem" }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Save Habit Record</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <History size={18} className="text-emerald-400" />
              <span>Collected Habit Records</span>
            </h2>
            <span className="badge badge-primary">
              {records.length} Records
            </span>
          </div>

          {records.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                padding: "1rem 0",
              }}
            >
              No habit records submitted yet. Use the form to record your first
              daily habit log.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sleep</th>
                    <th>Exercise</th>
                    <th>Screen Time</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td
                        style={{
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.record_date}
                      </td>
                      <td style={{ color: "#6ee7b7", fontWeight: 600 }}>
                        {r.sleep_hours} hrs
                      </td>
                      <td style={{ color: "#60a5fa" }}>
                        {r.exercise_minutes} mins
                      </td>
                      <td style={{ color: "var(--accent-amber)" }}>
                        {r.screen_time} hrs
                      </td>
                      <td style={{ color: "var(--text-primary)" }}>
                        {r.habit_notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <PersonalTrends kind="habit" records={records} />
      <DatasetAnalysis kind="habit" />
    </div>
  );
}
