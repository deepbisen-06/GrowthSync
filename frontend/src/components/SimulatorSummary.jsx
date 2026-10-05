import React from 'react';

const format = value => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const labels = {current:'Current plan',proposed:'Your proposed plan',risk:'If things get harder'};

export function revealInvalid(event) {
  let parent = event.target.parentElement;
  while (parent) {
    if (parent.tagName === 'DETAILS') parent.open = true;
    parent = parent.parentElement;
  }
}

export function OutcomeCards({scenarios,metricKey,days}) {
  return <div className="twin-outcomes">{scenarios.map(s=>{
    const metric = metricKey ? s.metrics.find(m=>m.key===metricKey) : null;
    return <article key={s.key} className={`twin-outcome twin-outcome-${s.key}`}>
      <h3>{labels[s.key] || s.label}</h3>
      <p>{metric?`${metric.label} over ${days} days`:'Ending balance'}</p>
      <strong>{format(metric?metric.total:s.ending_balance)}{metric?' '+metric.unit:''}</strong>
      {s.key!=='current'&&<p>{format(metric?metric.difference:s.difference)} {metric?metric.unit:''} compared with current</p>}
      {s.key==='current'&&<p>Reference for your comparison</p>}
    </article>;
  })}</div>;
}

export function QuickRecommendations({recommendations}) {
  if (!recommendations?.length) return null;
  return <div className="twin-recommendations">{recommendations.map((r,i)=><article key={i}>
    <h3>{r.title}</h3><p><strong>Try this:</strong> {r.action}</p>
    <p><strong>Difference:</strong> {r.impact}</p>
    <p><strong>Depends on:</strong> {r.condition}</p>
    <details><summary>Why this suggestion?</summary><p>{r.observation}</p></details>
  </article>)}</div>;
}
