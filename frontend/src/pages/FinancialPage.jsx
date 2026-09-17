import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import { DollarSign, PlusCircle, ArrowLeft, History } from "lucide-react";

export default function FinancialPage({ setCurrentRoute }) {
  const [records, setRecords] = useState([]);
  const [, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    monthly_income: "",
    monthly_expenses: "",
    monthly_savings: "",
    financial_goal: "",
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/financial-records");
      setRecords(res.data);
    } catch (err) {
      setError(err.formattedMessage || "Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate savings if income and expenses are entered
      if (
        (name === "monthly_income" || name === "monthly_expenses") &&
        updated.monthly_income !== "" &&
        updated.monthly_expenses !== ""
      ) {
        const inc = parseFloat(updated.monthly_income) || 0;
        const exp = parseFloat(updated.monthly_expenses) || 0;
        updated.monthly_savings = (inc - exp).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.monthly_income ||
      !formData.monthly_expenses ||
      !formData.financial_goal.trim()
    ) {
      setError("Please fill in all required financial fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        monthly_income: parseFloat(formData.monthly_income),
        monthly_expenses: parseFloat(formData.monthly_expenses),
        monthly_savings: parseFloat(formData.monthly_savings || 0),
        financial_goal: formData.financial_goal.trim(),
      };
      await api.post("/api/financial-records", payload);
      setSuccess("Financial record submitted and stored in PostgreSQL.");
      setFormData({
        monthly_income: "",
        monthly_expenses: "",
        monthly_savings: "",
        financial_goal: "",
      });
      fetchRecords();
    } catch (err) {
      setError(err.formattedMessage || "Failed to save financial data.");
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

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setCurrentRoute("expenses")}
            className="btn btn-secondary"
            style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
          >
            Expense Categories &rarr;
          </button>
          <button
            onClick={() => setCurrentRoute("forecasting")}
            className="btn btn-primary"
            style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
          >
            AI Forecasting &rarr;
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Form Card */}
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">
              <DollarSign size={20} className="text-cyan-400" />
              <span>Submit Financial Data</span>
            </h1>
          </div>
          <p className="card-desc" style={{ marginBottom: "1.25rem" }}>
            Data collected here will be securely associated with your user
            profile in PostgreSQL.
          </p>

          {error && (
            <Alert type="error" message={error} onClose={() => setError("")} />
          )}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fin-income">
                Monthly Income ($ / ₹) <span className="required">*</span>
              </label>
              <input
                id="fin-income"
                name="monthly_income"
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="e.g. 5000.00"
                value={formData.monthly_income}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fin-expenses">
                Monthly Expenses ($ / ₹) <span className="required">*</span>
              </label>
              <input
                id="fin-expenses"
                name="monthly_expenses"
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="e.g. 3200.00"
                value={formData.monthly_expenses}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fin-savings">
                Monthly Savings (Calculated) <span className="required">*</span>
              </label>
              <input
                id="fin-savings"
                name="monthly_savings"
                type="number"
                step="0.01"
                className="form-control"
                placeholder="Auto-calculated from Income - Expenses"
                value={formData.monthly_savings}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fin-goal">
                Primary Financial Goal <span className="required">*</span>
              </label>
              <input
                id="fin-goal"
                name="financial_goal"
                type="text"
                className="form-control"
                placeholder="e.g. Build emergency fund or save for Masters"
                value={formData.financial_goal}
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
                  <span>Save Financial Record</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <History size={18} className="text-blue-400" />
              <span>Collected Financial Records</span>
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
              No financial records submitted yet. Use the form to record your
              first entry.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Income</th>
                    <th>Expenses</th>
                    <th>Savings</th>
                    <th>Goal</th>
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
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ color: "#6ee7b7", fontWeight: 600 }}>
                        ${r.monthly_income.toFixed(2)}
                      </td>
                      <td style={{ color: "#fca5a5" }}>
                        ${r.monthly_expenses.toFixed(2)}
                      </td>
                      <td
                        style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
                      >
                        ${r.monthly_savings.toFixed(2)}
                      </td>
                      <td style={{ color: "var(--text-primary)" }}>
                        {r.financial_goal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
