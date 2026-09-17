import { useEffect, useState } from "react";
import { FlaskConical, RefreshCw } from "lucide-react";
import api from "../api/client";
import "./ModelEvaluationCards.css";

const fixed = (value, digits = 3) => value.toLocaleString("en-US", {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
});

function MissingReport({ result }) {
  return <p className="card-desc" role="status">{result?.message || "Evaluation unavailable."}</p>;
}

function HabitResults({ result }) {
  if (result?.status !== "ready") return <MissingReport result={result} />;
  return <>
    <p className="eval-counts">{result.total_rows.toLocaleString()} survey rows · {result.train_rows} train / {result.test_rows} test</p>
    <p><strong>{result.selected_label}</strong> selected</p>
    <div className="table-container">
      <table className="data-table eval-table">
        <caption>Held-out classification metrics</caption>
        <thead><tr><th scope="col">Candidate</th><th scope="col">Macro-F1</th><th scope="col">Balanced accuracy</th></tr></thead>
        <tbody>{result.rows.map(row => <tr key={row.key} className={row.key === result.selected ? "eval-selected" : ""}>
          <th scope="row">{row.label}{row.key === result.selected && <span className="eval-tag">Selected</span>}</th>
          <td>{fixed(row.macro_f1)}</td><td>{fixed(row.balanced_accuracy)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="card-desc">Higher is better. Class-chance balanced accuracy: {fixed(result.chance_reference)}.</p>
    <p className="eval-method">{result.selection_rule}.</p>
    <p className="eval-interpretation">{result.interpretation}</p>
    <p className="card-desc">{result.limitation}</p>
  </>;
}

function FinanceResults({ result }) {
  if (result?.status !== "ready") return <MissingReport result={result} />;
  return <>
    <p className="eval-counts">{result.transaction_rows.toLocaleString()} transactions · {result.months} months</p>
    <p className="card-desc">After lag creation: {result.train_months} train / {result.test_months} test months. {result.excluded_transfer_rows} transfer rows excluded.</p>
    <p><strong>{result.selected_label}</strong> selected</p>
    <div className="table-container">
      <table className="data-table eval-table">
        <caption>Held-out one-month-ahead forecasting metrics</caption>
        <thead><tr><th scope="col">Candidate</th><th scope="col">MAE</th><th scope="col">RMSE</th><th scope="col">R²</th></tr></thead>
        <tbody>{result.rows.map(row => <tr key={row.key} className={row.key === result.selected ? "eval-selected" : ""}>
          <th scope="row">{row.label}{row.key === result.selected && <span className="eval-tag">Selected</span>}</th>
          <td>{fixed(row.mae, 2)}</td><td>{fixed(row.rmse, 2)}</td><td>{fixed(row.r2)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="card-desc">Lower MAE/RMSE is better · Units: {result.currency}. R² is not percentage accuracy.</p>
    <p className="eval-method">{result.selection_rule}. Test period: {result.test_period.join(" to ")}. Earlier test-month actuals inform later one-step predictions.</p>
    <p className="eval-interpretation">{result.interpretation}</p>
    <p className="card-desc">{result.limitation}</p>
  </>;
}

export default function ModelEvaluationCards() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/api/analytics/model-evaluations");
        if (active) setResults(response.data);
      } catch (err) {
        if (active) {
          setResults(null);
          setError(err.formattedMessage || "Could not load experiment results. Please retry.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [revision]);

  return <section className="model-evaluations" aria-labelledby="evaluation-title" aria-busy={loading}>
    <div className="eval-heading">
      <div>
        <h2 id="evaluation-title"><FlaskConical size={22} /> Model Evaluation</h2>
        <p className="card-desc">Experimental results from separate training datasets. These metrics describe the models, not your personal health or finances.</p>
      </div>
      <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => setRevision(value => value + 1)}>
        <RefreshCw size={14} /> {loading ? "Loading…" : "Refresh results"}
      </button>
    </div>
    {error && <p className="eval-error" role="alert">{error}</p>}
    {loading && <p role="status">Loading saved evaluation results…</p>}
    {!loading && !error && <div className="eval-grid">
      <article className="card">
        <div className="card-header"><h3 className="card-title">Habit analysis</h3><span className="badge badge-amber">Experimental</span></div>
        <HabitResults result={results?.habit} />
      </article>
      <article className="card">
        <div className="card-header"><h3 className="card-title">Finance forecasting</h3><span className="badge badge-amber">Experimental</span></div>
        <FinanceResults result={results?.finance} />
      </article>
    </div>}
  </section>;
}
