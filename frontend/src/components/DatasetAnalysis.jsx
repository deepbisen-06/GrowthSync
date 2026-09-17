import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function DatasetAnalysis({ kind }) {
  const [data, setData] = useState(null), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError("");
    api.get(`/api/analytics/dataset-analysis/${kind}`).then(res => { if (active) setData(res.data); })
      .catch(err => { if (active) setError(err.formattedMessage || "Dataset analysis could not load."); });
    return () => { active = false; };
  }, [kind, retry]);
  return <section className="card personal-trends" aria-label="Dataset analysis">
    <h2>Dataset Analysis</h2>
    <p className="card-desc">Actual uploaded CSV values, grouped for comparison. These datasets contain no daily dates.</p>
    {error ? <><p role="alert">{error}</p><button type="button" className="btn btn-secondary" onClick={() => setRetry(n => n + 1)}>Retry dataset analysis</button></> : !data && <p role="status">Loading dataset analysis…</p>}
    {data && <><p><strong>{data.rows} source rows</strong> · {data.source}</p><p>{data.description}</p>
      {data.charts.map(chart => {
        const max = Math.max(1, ...chart.points.map(p => p.value)) * 1.15;
        return <article key={chart.title} className="personal-series"><h3>{chart.title}</h3>
          <svg viewBox="0 0 800 280" className="personal-trend-svg" role="img" aria-label={`${chart.title}, units ${chart.unit}`}>
            {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="60" x2="760" y1={220-i*45} y2={220-i*45} stroke="var(--text-muted)" opacity=".2"/><text x="50" y={224-i*45} textAnchor="end">{(max*i/4).toFixed(1)}</text></g>)}
            {chart.points.map((point, i) => {
              const step = 680/chart.points.length, x = 70+i*step, h = point.value/max*180;
              return <g key={point.label}><rect x={x+step*.2} y={220-h} width={step*.6} height={h} fill="#3b82f6"><title>{point.label}: {point.value} {chart.unit}, n={point.count}</title></rect><text x={x+step/2} y={210-h} textAnchor="middle">{point.value.toFixed(2)}</text><text x={x+step/2} y="245" textAnchor="middle">{point.label}</text><text x={x+step/2} y="266" textAnchor="middle">n={point.count}</text></g>;
            })}
          </svg><p className="card-desc">Values show group means in {chart.unit}; n is the number of source rows in each group.</p>
          <details><summary>View exact grouped values</summary><div className="table-container"><table className="data-table"><thead><tr><th>Group</th><th>Mean ({chart.unit})</th><th>Rows</th></tr></thead><tbody>{chart.points.map(point => <tr key={point.label}><td>{point.label}</td><td>{point.value}</td><td>{point.count}</td></tr>)}</tbody></table></div></details>
        </article>;
      })}</>}
  </section>;
}
