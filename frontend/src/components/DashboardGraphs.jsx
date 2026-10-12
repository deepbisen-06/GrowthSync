import { useId, useState } from 'react';
import './DashboardGraphs.css';

const format = value => Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
const dateLabel = date => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Summarize actual observations only; never create readings for missing dates.
function observations(records, dateKey, valueKey, mode = 'mean') {
  const days = new Map();
  records.forEach(record => {
    const date = String(record[dateKey] || '').slice(0, 10);
    const raw = record[valueKey];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || raw == null || raw === '') return;
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const day = days.get(date) || { date, total: 0, count: 0 };
    day.total += value;
    day.count += 1;
    days.set(date, day);
  });
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date)).map(day => ({ date: day.date, value: mode === 'sum' ? day.total : day.total / day.count }));
}

function Plot({ rows, bars, title, unit }) {
  const id = useId().replace(/:/g, '');
  const [active, setActive] = useState(null);
  if (!rows.length) return <div className="dg-empty">No recorded data yet.<span>Add records using the existing Finance, Study or Habit page.</span></div>;
  const low = Math.min(0, ...rows.map(row => row.value));
  const high = Math.max(1, ...rows.map(row => row.value));
  const y = value => 206 - (value - low) / (high - low) * 164;
  const first = Date.parse(rows[0].date), last = Date.parse(rows.at(-1).date);
  const x = (row, i) => bars ? 64 + (i + 0.5) * 380 / rows.length : rows.length === 1 ? 254 : 64 + (Date.parse(row.date) - first) / (last - first) * 380;
  const points = rows.map((row, i) => `${x(row, i)},${y(row.value)}`).join(' ');
  const selected = rows[active] || rows.at(-1);
  return <>
    <div className="dg-reading" aria-live="polite"><strong>{format(selected.value)}</strong><span>{unit} · {dateLabel(selected.date)}</span></div>
    <svg viewBox="0 0 470 245" role="group" aria-label={`${title}. ${unit}. Use Tab to inspect recorded values.`}>
      <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".32"/><stop offset="100%" stopColor="#10b981" stopOpacity=".02"/></linearGradient></defs>
      {[0, .25, .5, .75, 1].map(t => <g key={t}><line x1="64" x2="444" y1={y(low + t * (high - low))} y2={y(low + t * (high - low))} className="dg-grid"/><text x="56" y={y(low + t * (high - low)) + 4} textAnchor="end">{format(low + t * (high - low))}</text></g>)}
      {!bars && rows.length > 1 && <><polygon points={`${x(rows[0], 0)},${y(0)} ${points} ${x(rows.at(-1), rows.length - 1)},${y(0)}`} fill={`url(#${id}-fill)`}/><polyline points={points} fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round"/></>}
      {rows.map((row, i) => {
        const interaction = { tabIndex: 0, onFocus: () => setActive(i), onMouseEnter: () => setActive(i), onBlur: () => setActive(null), onMouseLeave: () => setActive(null), 'aria-label': `${row.date}: ${format(row.value)} ${unit}` };
        return bars ? <rect key={row.date} {...interaction} x={x(row, i) - Math.min(38, 260 / rows.length) / 2} y={Math.min(y(0), y(row.value))} width={Math.min(38, 260 / rows.length)} height={Math.max(2, Math.abs(y(row.value) - y(0)))} rx="12" fill={i === active || i === rows.length - 1 ? '#059669' : '#83c9ad'}><title>{row.date}: {format(row.value)} {unit}</title></rect> : <circle key={row.date} {...interaction} cx={x(row, i)} cy={y(row.value)} r={active === i ? 6 : 4} fill="#059669" stroke="var(--bg-card)" strokeWidth="2"><title>{row.date}: {format(row.value)} {unit}</title></circle>;
      })}
      <text x="64" y="235">{dateLabel(rows[0].date)}</text>{rows.length > 1 && <text x="444" y="235" textAnchor="end">{dateLabel(rows.at(-1).date)}</text>}
    </svg>
    <p className="dg-foot">{rows.length === 1 ? 'One recorded date — add more records to see a trend.' : bars ? 'Bars show recorded days only.' : 'Lines connect recorded dates; gaps are not zero.'}</p>
  </>;
}

export default function DashboardGraphs({ financial, study, habits, loading, error }) {
  const [period, setPeriod] = useState('all');
  const [habitMetric, setHabitMetric] = useState('sleep_hours');
  const labels = { sleep_hours: 'Sleep', screen_time: 'Screen time', exercise_minutes: 'Exercise' };
  const filter = rows => period === 'all' ? rows : rows.filter(row => Date.parse(row.date) >= Date.now() - Number(period) * 86400000);
  const financeRows = filter(observations(financial, 'created_at', 'monthly_savings'));
  const studyRows = filter(observations(study, 'study_date', 'study_hours', 'sum'));
  const habitRows = filter(observations(habits, 'record_date', habitMetric));
  return <section className="dashboard-graphs" aria-labelledby="dashboard-graphs-title">
    <header className="dg-heading"><div><h2 id="dashboard-graphs-title">Your growth at a glance</h2><p>Financial, study and habit trends from your saved records.</p></div><label>Period <select value={period} onChange={event => setPeriod(event.target.value)}><option value="all">All records</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label></header>
    {loading ? <p role="status">Loading your graphs…</p> : error ? <p role="status">Graphs could not be refreshed. Use Refresh dashboard to try again.</p> : <div className="dg-cards">
      <article className="dg-card"><header><h3>Savings trend</h3><span className="dg-tag">Finance</span></header><Plot rows={financeRows} title="Monthly savings observations" unit="saved currency units"/><p className="dg-caption">Monthly savings per entry date; same-day entries are averaged.</p></article>
      <article className="dg-card"><header><h3>Study activity</h3><span className="dg-tag">Study</span></header><Plot rows={studyRows} bars title="Daily study hours" unit="hours"/><p className="dg-caption">Study hours summed across sessions on each recorded day.</p></article>
      <article className="dg-card"><header><h3>Habit trend</h3><select aria-label="Habit graph metric" value={habitMetric} onChange={event => setHabitMetric(event.target.value)}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></header><Plot key={habitMetric} rows={habitRows} title={labels[habitMetric]} unit={habitMetric === 'exercise_minutes' ? 'minutes' : 'hours'}/><p className="dg-caption">Average {labels[habitMetric].toLowerCase()} per recorded day.</p></article>
    </div>}
  </section>;
}
