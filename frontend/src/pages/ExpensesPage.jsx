import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import { PlusCircle, PieChart, ShoppingBag } from "lucide-react";

export default function ExpensesPage({ setCurrentRoute }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [categories] = useState([
    "Food",
    "Travel",
    "Education",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Other",
  ]);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenseDate, setExpenseDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [description, setDescription] = useState("");

  const [, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [expRes, sumRes] = await Promise.all([
        api.get("/api/expense-records"),
        api.get("/api/expense-records/summary"),
      ]);
      setExpenses(expRes.data || []);
      setSummary(sumRes.data || []);
    } catch (err) {
      setError(err.formattedMessage || "Failed to load expense records.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid expense amount greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api.post("/api/expense-records", {
        amount: parseFloat(amount),
        category,
        expense_date: expenseDate,
        description: description.trim() || undefined,
      });

      setSuccess(
        `Successfully logged ₹${parseFloat(amount).toLocaleString()} under ${category}.`,
      );
      setAmount("");
      setDescription("");
      await loadData();
    } catch (err) {
      setError(err.formattedMessage || "Failed to submit expense record.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalSpent = summary.reduce((acc, curr) => acc + curr.total_amount, 0);

  return (
    <div className="dashboard-content">
      <div className="dashboard-hero">
        <div className="hero-title-area">
          <h1>Expense Tracking & Categories</h1>
          <p className="hero-subtitle">
            Log granular expenses by category to enable accurate ML spending
            breakdown & forecasting.
          </p>
        </div>
        <div className="hero-quick-actions">
          <button
            onClick={() => setCurrentRoute("forecasting")}
            className="btn btn-primary btn-sm"
          >
            <span>View Forecasting &rarr;</span>
          </button>
        </div>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Form Column */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="card-title-group">
              <h2>
                <PlusCircle size={18} className="text-emerald-400" />
                <span>Log Categorized Expense</span>
              </h2>
              <p>Record individual expenditures for ML category distribution</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "0.5rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">Expense Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="form-input"
                placeholder="e.g. 450.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Expense Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input
                type="text"
                maxLength={255}
                className="form-input"
                placeholder="e.g. Groceries, Metro card recharge"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ marginTop: "0.5rem" }}
            >
              {submitting ? "Logging Expense..." : "Save Expense Record"}
            </button>
          </form>
        </div>

        {/* Category Breakdown Column */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div className="card-title-group">
              <h2>
                <PieChart size={18} className="text-blue-400" />
                <span>Category Spending Distribution</span>
              </h2>
              <p>
                Total logged expenditures: ₹{totalSpent.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {summary.length === 0 ? (
            <div className="growth-empty-state" style={{ height: "200px" }}>
              <ShoppingBag size={24} className="text-muted" />
              <div className="empty-state-title">No Expenses Logged Yet</div>
              <p className="empty-state-desc">
                Log expenses to see category proportions and spending patterns.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                marginTop: "0.5rem",
              }}
            >
              {summary.map((s) => (
                <div key={s.category}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{ fontWeight: 600, color: "var(--text-primary)" }}
                    >
                      {s.category}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      ₹{s.total_amount.toLocaleString("en-IN")} ({s.percentage}
                      %)
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "var(--bg-hover)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${s.percentage}%`,
                        height: "100%",
                        background: "var(--primary)",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense History Table */}
      <div className="analytics-card" style={{ marginTop: "1.25rem" }}>
        <div className="analytics-card-header">
          <div className="card-title-group">
            <h2>Recent Expense Records</h2>
            <p>Individual line items saved in PostgreSQL</p>
          </div>
          <span className="sidebar-badge">{expenses.length} Records</span>
        </div>

        {expenses.length === 0 ? (
          <div className="growth-empty-state" style={{ height: "160px" }}>
            <p className="empty-state-desc">No expense records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              className="dataset-table"
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 10).map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.expense_date}</td>
                    <td>
                      <span className="sidebar-badge">{exp.category}</span>
                    </td>
                    <td
                      style={{ fontWeight: 700, color: "var(--text-primary)" }}
                    >
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {exp.description || "—"}
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
