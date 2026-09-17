import { useState } from "react";
import { GraduationCap } from "lucide-react";
import api from "../api/client";
import Alert from "./Alert";

export default function AcademicPredictionCard() {
  const [inputs, setInputs] = useState({ studytime: "2", failures: "0", absences: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setInputs((previous) => ({ ...previous, [name]: value }));
    setResult(null);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await api.post("/api/analytics/academic-prediction", {
        studytime: Number(inputs.studytime),
        failures: Number(inputs.failures),
        absences: Number(inputs.absences),
      });
      setResult(response.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail :
        err.formattedMessage || "Could not calculate a grade. Check your inputs and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" style={{ marginBottom: "1.5rem" }} aria-labelledby="grade-title">
      <div className="card-header">
        <h2 id="grade-title" className="card-title">
          <GraduationCap size={20} /> Academic Grade Prediction
        </h2>
        <span className="badge badge-amber">Experimental</span>
      </div>
      <p className="card-desc" style={{ marginBottom: "1rem" }}>
        Estimate a final grade on a 0–20 scale using weekly study time,
        previous failures and course absences. This is separate from your daily study log.
      </p>
      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <legend className="form-label">Academic inputs</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="grade-studytime" className="form-label">Weekly study time</label>
              <select id="grade-studytime" name="studytime" className="form-control"
                value={inputs.studytime} onChange={handleChange} required>
                <option value="1">Less than 2 hours</option>
                <option value="2">2–5 hours</option>
                <option value="3">5–10 hours</option>
                <option value="4">More than 10 hours</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="grade-failures" className="form-label">Previous class failures</label>
              <select id="grade-failures" name="failures" className="form-control"
                value={inputs.failures} onChange={handleChange} required>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="grade-absences" className="form-label">Course absences</label>
              <input id="grade-absences" name="absences" type="number" min="0" max="93"
                step="1" required className="form-control" placeholder="Enter known absence count"
                value={inputs.absences} onChange={handleChange} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">
            {busy ? "Predicting…" : "Predict Grade"}
          </button>
        </fieldset>
      </form>
      <div aria-live="polite" style={{ marginTop: "1rem" }}>
        {error && <Alert type="error" message={error} />}
        {result && (
          <div>
            <p style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {result.predicted_grade.toFixed(1)} / 20
            </p>
            <p>Estimated final grade · Model: {result.model_name === "ridge" ? "Ridge Regression" : "Mean baseline"}</p>
            {result.test_mae != null && <p>Held-out average absolute error: {result.test_mae.toFixed(2)} marks.</p>}
            {result.display_clipped && <p>The raw estimate ({result.raw_prediction.toFixed(2)}) was outside the grade scale. The displayed value is limited to 0–20.</p>}
            <p className="card-desc">{result.message}</p>
          </div>
        )}
      </div>
      <p className="card-desc" style={{ marginTop: "1rem" }}>
        Trained on historical secondary-school records. Inputs outside the observed
        training ranges can be unreliable; this sample contained 0–3 previous failures
        and 0–32 absences. Estimates are not validated for Indian college students.
      </p>
    </section>
  );
}
