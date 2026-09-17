import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import AcademicPredictionCard from "../components/AcademicPredictionCard";
import PersonalTrends from "../components/PersonalTrends";
import DatasetAnalysis from "../components/DatasetAnalysis";
import { BookOpen, PlusCircle, ArrowLeft, History } from "lucide-react";

export default function StudyPage({ setCurrentRoute }) {
  const [records, setRecords] = useState([]);
  const [, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    study_hours: "",
    subjects: "",
    academic_goal: "",
    study_date: today,
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/study-records");
      setRecords(res.data);
    } catch (err) {
      setError(err.formattedMessage || "Failed to load study records.");
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
      !formData.study_hours ||
      !formData.subjects.trim() ||
      !formData.academic_goal.trim() ||
      !formData.study_date
    ) {
      setError("Please fill in all required study fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        study_hours: parseFloat(formData.study_hours),
        subjects: formData.subjects.trim(),
        academic_goal: formData.academic_goal.trim(),
        study_date: formData.study_date,
      };
      await api.post("/api/study-records", payload);
      setSuccess("Study session record saved in PostgreSQL.");
      setFormData({
        study_hours: "",
        subjects: "",
        academic_goal: "",
        study_date: today,
      });
      fetchRecords();
    } catch (err) {
      setError(err.formattedMessage || "Failed to save study data.");
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
              <BookOpen size={20} className="text-blue-400" />
              <span>Submit Study Record</span>
            </h1>
          </div>
          <p className="card-desc" style={{ marginBottom: "1.25rem" }}>
            Log daily academic study hours, focus areas, and milestone goals.
          </p>

          {error && (
            <Alert type="error" message={error} onClose={() => setError("")} />
          )}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="study-hours">
                  Study Hours <span className="required">*</span>
                </label>
                <input
                  id="study-hours"
                  name="study_hours"
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  className="form-control"
                  placeholder="e.g. 4.5"
                  value={formData.study_hours}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="study-date">
                  Study Date <span className="required">*</span>
                </label>
                <input
                  id="study-date"
                  name="study_date"
                  type="date"
                  className="form-control"
                  value={formData.study_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="study-subjects">
                Subjects / Topics Studied <span className="required">*</span>
              </label>
              <textarea
                id="study-subjects"
                name="subjects"
                rows="3"
                className="form-control"
                placeholder="e.g. Relational Databases, PostgreSQL indexing, Machine Learning Foundations"
                value={formData.subjects}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="academic-goal">
                Academic Goal <span className="required">*</span>
              </label>
              <input
                id="academic-goal"
                name="academic_goal"
                type="text"
                className="form-control"
                placeholder="e.g. Complete Milestone 1 and prepare technical report"
                value={formData.academic_goal}
                onChange={handleChange}
                required
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
                  <span>Save Study Record</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <History size={18} className="text-cyan-400" />
              <span>Collected Study Records</span>
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
              No study records submitted yet. Use the form to record your first
              study session.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Study Date</th>
                    <th>Hours</th>
                    <th>Subjects / Topics</th>
                    <th>Academic Goal</th>
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
                        {r.study_date}
                      </td>
                      <td style={{ color: "#60a5fa", fontWeight: 700 }}>
                        {r.study_hours} hrs
                      </td>
                      <td style={{ color: "var(--text-primary)" }}>
                        {r.subjects}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {r.academic_goal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <PersonalTrends kind="study" records={records} />
      <DatasetAnalysis kind="student" />
      <AcademicPredictionCard />
    </div>
  );
}
