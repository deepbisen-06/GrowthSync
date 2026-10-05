import React, {useEffect,useRef,useState} from 'react';
import api from '../api/client';
import { OutcomeCards, QuickRecommendations, revealInvalid } from './SimulatorSummary';
import AIRecommendations from './AIRecommendations';

const format = n=>Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
const initial = {days:7,baseline_mode:'observed',reserved_hours:'',study_delta:0,sleep_delta:0,exercise_delta:0,screen_delta:0,risk_study_loss:0,risk_sleep_loss:0,risk_exercise_loss:0,risk_screen_increase:0,study_goal_hours:0};
const colors=['#3b82f6','#10b981','#f59e0b'];

function RoutineChart({result,metricKey,cumulative}) {
  const field=cumulative?'cumulative':'value';
  const series=result.scenarios.map(s=>({...s,metric:s.metrics.find(m=>m.key===metricKey)}));
  const max=Math.max(1,...series.flatMap(s=>s.metric.points.map(p=>p[field])))*1.1;
  const x=day=>75+(day-1)/(result.days-1)*685, y=v=>245-v/max*200;
  return <><div className="twin-legend">{series.map((s,i)=><span key={s.key}><i style={{background:colors[i]}}/>{s.label}</span>)}</div>
    <svg viewBox="0 0 800 310" className="twin-chart" role="img" aria-label={`${series[0].metric.label}, ${cumulative?'cumulative':'daily'} ${series[0].metric.unit}, three scenarios. Exact data below.`}>
      {[0,1,2,3,4].map(i=><g key={i}><line x1="75" x2="760" y1={y(max*i/4)} y2={y(max*i/4)} stroke="currentColor" opacity=".15"/><text x="65" y={y(max*i/4)+4} textAnchor="end">{format(max*i/4)}</text></g>)}
      {[1,...Array.from({length:Math.floor(result.days/7)},(_,i)=>(i+1)*7)].map(d=><text key={d} x={x(d)} y="270" textAnchor="middle">{d}</text>)}
      <text x="420" y="297" textAnchor="middle">Future day · {series[0].metric.unit}{cumulative?' accumulated from day 1':' per day'}</text>
      {series.map((s,i)=><g key={s.key}><polyline fill="none" stroke={colors[i]} strokeWidth="3" strokeDasharray={i===0?'':i===1?'9 4':'3 5'} points={s.metric.points.map(p=>`${x(p.day)},${y(p[field])}`).join(' ')}/>{s.metric.points.map(p=><circle key={p.day} cx={x(p.day)} cy={y(p[field])} r="3" fill={colors[i]}><title>{s.label}: {p.date}, {format(p[field])} {s.metric.unit}</title></circle>)}</g>)}
    </svg></>;
}

export default function RoutineSimulator({kind,setCurrentRoute}) {
  const study=kind==='study', title=study?'Study':'Habit';
  const [baseline,setBaseline]=useState(null),[inputs,setInputs]=useState({...initial});
  const [result,setResult]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[running,setRunning]=useState(false),[reload,setReload]=useState(0);
  const [metricKey,setMetricKey]=useState(study?'study_hours':'sleep_hours'),[cumulative,setCumulative]=useState(study);
  const request=useRef(0);
  useEffect(()=>{let active=true;setLoading(true);setError('');setResult(null);
    api.get(`/api/simulation/routine/${kind}/baseline`).then(r=>{if(active)setBaseline(r.data);})
      .catch(e=>{if(active){setBaseline(null);setError(e.formattedMessage||'Could not load your records.');}})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;request.current++;};
  },[kind,reload]);
  function change(key,value){request.current++;setRunning(false);setResult(null);setError('');setInputs(p=>({...p,[key]:value,...(key==='baseline_mode'&&value==='trend'?{days:7}:{})}));}
  function preset(values){request.current++;setRunning(false);setResult(null);setError('');setInputs(p=>({...p,study_delta:0,sleep_delta:0,exercise_delta:0,screen_delta:0,...values}));}
  async function run(e){e.preventDefault();const id=++request.current;setRunning(true);setError('');setResult(null);
    try{const payload=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,k==='baseline_mode'?v:Number(v)]));
      const r=await api.post(`/api/simulation/routine/${kind}`,payload);
      if(id===request.current){setResult(r.data);setBaseline(r.data.baseline);}
    }catch(err){if(id===request.current)setError(err.formattedMessage||'Simulation failed.');}
    finally{if(id===request.current)setRunning(false);}
  }
  const field=(key,label,min,max)=><label className="twin-field" key={key}>{label}<input type="number" step="any" required min={min} max={max} value={inputs[key]} onChange={e=>change(key,e.target.value)}/></label>;
  return <div className="dashboard-content financial-twin"><div className="dashboard-hero"><div><p className="twin-eyebrow">PLAN YOUR NEXT STEP</p><h1>Your {kind} plan</h1><p>Compare current, proposed and setback routines using your own logs.</p></div><button className="btn btn-secondary" onClick={()=>setCurrentRoute('forecasting')}>Back to Forecasting</button></div>
    <p className="twin-notice">These scenarios compare time allocations. They do not predict causal changes in grades, stress or health. Saved records remain unchanged.</p>
    {error&&<p className="twin-error" role="alert">{error}</p>}
    {loading?<p role="status">Loading recent {kind} history…</p>:<>
      <section className="card twin-section"><div className="twin-heading"><h2>1. Current routine</h2><button className="btn btn-secondary" disabled={running} onClick={()=>setReload(n=>n+1)}>Refresh records</button></div>
        {!baseline?.available?<p>{baseline?'Add a valid '+kind+' record within the last 30 days to begin.':'Could not load records. Select Refresh records to retry.'}</p>:<>
          <p>{baseline.observed_dates} recorded dates / 30 calendar days · {baseline.window_start} to {baseline.as_of}</p>
          <div className="twin-stats">{baseline.series.map(s=><div key={s.key}><span>{s.label} · observed average</span><strong>{format(s.average)} {s.unit}</strong></div>)}</div>
          <p className="twin-notice">{baseline.message}</p>
          <details><summary>View records and model details</summary><p>{baseline.method}</p>{baseline.series.map(s=><div key={s.key}><h3>{s.label}</h3><div className="twin-table"><table><thead><tr><th>Date</th><th>{s.unit}</th></tr></thead><tbody>{s.history.map(p=><tr key={p.date}><td>{p.date}</td><td>{format(p.value)}</td></tr>)}</tbody></table></div>{s.evaluation&&<p>Chronological holdout: MAE {s.evaluation.mae}, RMSE {s.evaluation.rmse}; last-value baseline MAE {s.evaluation.baseline_mae} ({s.unit}). These are forecast errors, not simulation accuracy.</p>}</div>)}</details>
        </>}
      <button type="button" className="btn btn-secondary" onClick={()=>setCurrentRoute(kind)}>Add or review {kind} records</button></section>
      {baseline?.available&&<><form className="card twin-section" onSubmit={run} onInvalidCapture={revealInvalid}><h2>2. What would you like to change?</h2>
        <div className="twin-presets">{study?<><button type="button" onClick={()=>preset({study_delta:.5})}>Study +30 minutes</button><button type="button" onClick={()=>preset({study_delta:1})}>Study +1 hour</button></>:<><button type="button" onClick={()=>{preset({screen_delta:-Math.min(1,baseline.series.find(s=>s.key==='screen_time').average)});setMetricKey('screen_time');}}>Reduce screen time up to 1 hour</button><button type="button" onClick={()=>{preset({exercise_delta:15});setMetricKey('exercise_minutes');}}>Exercise +15 minutes</button></>}</div>
        <p>Shortcuts replace proposed changes; your duration, commitments and risk settings stay as shown.</p>
        <div className="twin-fields">
          <label className="twin-field">Duration<select value={inputs.days} onChange={e=>change('days',e.target.value)}>{[7,14,28].map(d=><option key={d} value={d} disabled={inputs.baseline_mode==='trend'&&d!==7}>{d} days</option>)}</select></label>
          {field('reserved_hours',study?'Time for everything else, including sleep (hours/day)':'Other commitments outside sleep/exercise (hours/day)',0,24)}
          {study?field('study_delta','Study change (hours/day)',-24,24):<>{field('sleep_delta','Sleep change (hours/day)',-24,24)}{field('exercise_delta','Exercise change (minutes/day)',-1440,1440)}{field('screen_delta','Screen-time change (hours/day)',-24,24)}</>}
        </div><details className="twin-advanced"><summary>More options: risk, goals and forecast method</summary><div className="twin-fields">
          <label className="twin-field">Starting pattern<select value={inputs.baseline_mode} onChange={e=>change('baseline_mode',e.target.value)}><option value="observed">Recorded-date average</option><option value="trend" disabled={!baseline.trend_available}>Seven-day ML trend</option></select></label>
          {study?<>{field('risk_study_loss','Risk: study hours lost per day',0,24)}{field('study_goal_hours','Study-time goal (hours; 0 = none)',0,672)}</>:<>{field('risk_sleep_loss','Risk: sleep hours lost per day',0,24)}{field('risk_exercise_loss','Risk: exercise minutes lost per day',0,1440)}{field('risk_screen_increase','Risk: extra screen hours per day',0,24)}</>}
        </div></details><p className="twin-selection">Selected: {inputs.days} days · {inputs.baseline_mode==='trend'?'seven-day ML trend':'recorded-date average'} · reserved time {inputs.reserved_hours===''?'not entered':inputs.reserved_hours+' hours/day'}. {study?`Risk: lose ${inputs.risk_study_loss} study hours/day. Goal: ${inputs.study_goal_hours||'none'} hours.`:`Risk per day: sleep −${inputs.risk_sleep_loss} hours, exercise −${inputs.risk_exercise_loss} minutes, screen +${inputs.risk_screen_increase} hours.`}</p>
        <div>        </div><p>{study?'Reserve time for all activities outside study, including sleep.':'Reserve study, work, travel and meals outside sleep/exercise. Total screen time may overlap study/work; it is checked against waking hours rather than counted twice.'}</p>
        <p>Zero changes produce overlapping lines. Recorded-average mode produces flat daily lines; cumulative totals rise only as time accumulates.</p>
        <div className="twin-actions"><button className="btn btn-primary" disabled={running}>{running?'Calculating…':'Compare routines'}</button><button type="button" className="btn btn-secondary" onClick={()=>{request.current++;setInputs({...initial});setResult(null);setRunning(false);setError('');}}>Reset assumptions</button></div>
      </form>
      {result&&<><section className="card twin-section"><h2>3. See the difference</h2><div className="twin-fields"><label className="twin-field">Metric<select value={metricKey} onChange={e=>setMetricKey(e.target.value)}>{result.scenarios[0].metrics.map(m=><option key={m.key} value={m.key}>{m.label} ({m.unit})</option>)}</select></label><label className="twin-field">Chart view<select value={cumulative?'total':'daily'} onChange={e=>setCumulative(e.target.value==='total')}><option value="daily">Daily allocation</option><option value="total">Cumulative allocation</option></select></label></div>
        <OutcomeCards scenarios={result.scenarios} metricKey={metricKey} days={result.days}/>
        <RoutineChart result={result} metricKey={metricKey} cumulative={cumulative}/>
        <details><summary>View full comparison table</summary><div className="twin-table"><table><thead><tr><th>Scenario</th><th>Metric</th><th>Daily average</th><th>Total in {result.days} days</th><th>Total vs current</th></tr></thead><tbody>{result.scenarios.flatMap(s=>s.metrics.map(m=><tr key={s.key+m.key}><th>{s.label}</th><td>{m.label}</td><td>{format(m.daily_average)} {m.unit}</td><td>{format(m.total)} {m.unit}</td><td>{format(m.difference)} {m.unit}</td></tr>))}</tbody></table></div></details>
        {result.scenarios.map(s=><p key={s.key}><strong>{s.label}:</strong> minimum unallocated time {format(Math.min(...s.daily.map(d=>d.unallocated_hours)))} hours/day.{s.risk_floor_applied?' Some risk losses were limited to zero remaining time.':''}{study&&result.study_goal_hours>0?` Study-time goal: ${s.goal_date||'not reached within horizon'}.`:''}</p>)}
        <details><summary>Exact daily and cumulative values</summary><div className="twin-table"><table><thead><tr><th>Date</th><th>Scenario</th><th>Daily ({result.scenarios[0].metrics.find(m=>m.key===metricKey).unit})</th><th>Cumulative</th></tr></thead><tbody>{result.scenarios.flatMap(s=>s.metrics.find(m=>m.key===metricKey).points.map(p=><tr key={s.key+p.date}><td>{p.date}</td><td>{s.label}</td><td>{format(p.value)}</td><td>{format(p.cumulative)}</td></tr>))}</tbody></table></div></details>
      </section><section className="card twin-section"><h2>Your next step</h2><QuickRecommendations recommendations={result.recommendations}/><details><summary>Methods and assumptions</summary><ul>{result.assumptions.map(a=><li key={a}>{a}</li>)}</ul></details></section></>}
      {result&&<AIRecommendations kind={kind} inputs={inputs} token={result.recommendation_token}/>}
      </>}
    </>}
  </div>;
}
