import React, { useEffect, useState } from "react";
import api from "../api/client";
import "./PersonalTrends.css";

function TrendGraph({ series, range, demo }) {
  const history = series.history.slice(-range);
  const points = [...history.map(p => ({ ...p, forecast: false })),
    ...series.forecast.map(p => ({ ...p, forecast: true }))];
  const [selected, setSelected] = useState(null);
  const width = 800, height = 260, left = 60, right = 735, top = 25, bottom = 212;
  const dates = points.map(p => Date.parse(`${p.date}T00:00:00Z`));
  const min = dates[0], span = dates.at(-1) - min || 1;
  const max = Math.max(1, ...points.map(p => p.value)) * 1.1;
  const x = p => left + ((Date.parse(`${p.date}T00:00:00Z`) - min) / span) * (right - left);
  const y = p => bottom - (p.value / max) * (bottom - top);
  const tip = points.find(p => p.date === selected) || points.at(-1);
  const estimates = points.filter(p => p.forecast);
  const forecastLine = history.length ? [history.at(-1), ...estimates] : estimates;
  const ticks = [...new Set([points[0]?.date, points[Math.floor(points.length / 2)]?.date, points.at(-1)?.date])];
  return <>
    <p className="card-desc">{demo ? "Demo readings" : "Recorded readings"} — line segments connect consecutive logged days only.</p>
    <svg viewBox={`0 0 ${width} ${height}`} className="personal-trend-svg" role="img" aria-label={`${series.label}: recorded observations and seven-day forecast in ${series.unit}`}>
      {[0, 1, 2, 3, 4].map(i => <g key={i}>
        <line x1={left} x2={right} y1={bottom - i / 4 * (bottom - top)} y2={bottom - i / 4 * (bottom - top)} stroke="var(--text-muted)" opacity="0.2" />
        <text x={left - 10} y={bottom - i / 4 * (bottom - top) + 4} textAnchor="end">{(max * i / 4).toFixed(1)}</text>
      </g>)}
      {history.slice(1).map((p, i) => Date.parse(p.date) - Date.parse(history[i].date) === 86400000 && <line key={p.date} x1={x(history[i])} y1={y(history[i])} x2={x(p)} y2={y(p)} stroke="#3b82f6" strokeWidth="3" />)}
      {forecastLine.length > 1 && <polyline points={forecastLine.map(p => `${x(p)},${y(p)}`).join(" ")} fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="6 5" />}
      {points.map(p => <circle key={p.date} cx={x(p)} cy={y(p)} r="5" fill={p.forecast ? "#10b981" : "#3b82f6"} tabIndex="0" aria-label={`${p.date}: ${p.value} ${series.unit}, ${p.forecast ? "forecast" : "recorded"}`} onFocus={() => setSelected(p.date)} onMouseEnter={() => setSelected(p.date)} onClick={() => setSelected(p.date)}>
        <title>{p.date}: {p.value} {series.unit}</title>
      </circle>)}
      {ticks.filter(Boolean).map(day => <text key={day} x={x({date: day})} y={240} textAnchor="middle">{day}</text>)}
    </svg>
    <p aria-live="polite">{tip ? `${tip.date}: ${tip.value.toFixed(2)} ${series.unit} (${tip.forecast ? "forecast" : "recorded"})` : "No recorded history yet."}</p>
    <p className="card-desc">Blue line: {demo ? "sample readings" : "recorded dates"}. Green dashed line: forecast, when available. Unlogged dates remain gaps.</p>
  </>;
}

export default function PersonalTrends({ kind, records }) {
  const [data, setData] = useState(null), [error, setError] = useState("");
  const demo = false;
  const [loading, setLoading] = useState(true), [refresh, setRefresh] = useState(0);
  const [range, setRange] = useState(30);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setData(null);
    api.get(`/api/analytics/personal-trends/${kind}`).then(res => {
      if (active) setData(res.data);
    }).catch(err => { if (active) setError(err.formattedMessage || "Could not load analysis. Please retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, records, refresh]);
  return <section className="card personal-trends" aria-label={`${kind} analysis`}>
    <div className="personal-trends-heading">
      <div><h2>{kind === "study" ? "Study trends & forecast" : "Habit trends & forecast"}</h2><p className="card-desc">Your recorded history and preliminary estimates for the next seven days.</p></div>
      <button type="button" className="btn btn-secondary" onClick={() => setRefresh(n => n + 1)} disabled={loading}>Refresh analysis</button>
    </div>
    {loading && <p role="status">Loading analysis…</p>}
    {error && <p role="alert">{error}</p>}
    {data && <>
      <p>{data.observed_dates} recorded dates. {data.message}</p>
      <p className="card-desc">{data.aggregation} {data.missing_days}</p>
      <label>History window <select value={range} onChange={e => setRange(Number(e.target.value))}>
        <option value={14}>Last 14 recorded dates</option><option value={30}>Last 30 recorded dates</option><option value={90}>Last 90 recorded dates</option>
      </select></label>
      {data.series.map(series => <article key={series.key} className="personal-series">
        <h3>{series.label} ({series.unit})</h3>
        {series.average !== null && <p>Recorded-date average: <strong>{series.average} {series.unit}</strong></p>}
        {series.history.length ? <TrendGraph series={series} range={range} demo={demo} /> : <p>Add your first record to see this graph.</p>}
        {series.evaluation ? <p>Held-out MAE: {series.evaluation.mae} {series.unit} · RMSE: {series.evaluation.rmse} · Last-value baseline MAE: {series.evaluation.baseline_mae}. Train: {series.evaluation.train_dates} dates; test: {series.evaluation.test_dates} dates. {series.evaluation.protocol}</p> : <p className="card-desc">Evaluation becomes available after 14 distinct recorded dates.</p>}
        {series.history.length > 0 && <details><summary>View chart data</summary><div className="table-container"><table className="data-table"><thead><tr><th>Date</th><th>Value ({series.unit})</th><th>Type</th></tr></thead><tbody>
          {series.history.slice(-range).map(p => <tr key={p.date}><td>{p.date}</td><td>{p.value}</td><td>Recorded</td></tr>)}
          {series.forecast.map(p => <tr key={p.date}><td>{p.date}</td><td>{p.value}</td><td>Forecast</td></tr>)}
        </tbody></table></div></details>}
      </article>)}
    </>}
  </section>;
}
