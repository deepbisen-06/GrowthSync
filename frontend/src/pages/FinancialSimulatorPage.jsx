import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { OutcomeCards, QuickRecommendations, revealInvalid } from '../components/SimulatorSummary';
import AIRecommendations from '../components/AIRecommendations';
import './SimulatorPage.css';

const number = value => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const defaults = { months: 12, target_rate: 30, income_change: 0, risk_expense_increase: 0, risk_income_drop_pct: 0, starting_balance: 0 };
const colors = ['#3b82f6', '#10b981', '#f59e0b'];

function ScenarioChart({ scenarios, months }) {
  const values = scenarios.flatMap(s => s.points.map(p => p.balance));
  const low = Math.min(0, ...values), high = Math.max(1, ...values);
  const x = m => 110 + m / months * 660;
  const y = v => 265 - (v-low)/(high-low)*220;
  return <><div className="twin-legend">{scenarios.map((s,i) => <span key={s.key}><i style={{background:colors[i]}}/>{s.label}</span>)}</div>
    <svg viewBox="0 0 810 325" role="img" aria-label="Three conditional scenarios: cumulative balance by future month. Exact values in the table below." className="twin-chart">
      {[0,1,2,3,4].map(i => {const v=low+(high-low)*i/4;return <g key={i}><line x1="110" x2="770" y1={y(v)} y2={y(v)} stroke="currentColor" opacity=".15"/><text x="100" y={y(v)+4} textAnchor="end">{number(v)}</text></g>;})}
      {Array.from({length:months+1},(_,m)=><text key={m} x={x(m)} y="289" textAnchor="middle">{m}</text>)}
      <text x="440" y="316" textAnchor="middle">Future month (0 = starting balance)</text>
      {scenarios.map((s,i)=><g key={s.key}><polyline points={s.points.map(p=>`${x(p.month)},${y(p.balance)}`).join(' ')} fill="none" stroke={colors[i]} strokeWidth="3" strokeDasharray={i===0?'':i===1?'9 4':'3 5'}/>{s.points.map(p=><circle key={p.month} cx={x(p.month)} cy={y(p.balance)} r="3.5" fill={colors[i]}><title>{s.label}, month {p.month}: {number(p.balance)}</title></circle>)}</g>)}
    </svg></>;
}

export default function SimulatorPage({ setCurrentRoute }) {
  const [baseline,setBaseline]=useState(null), [inputs,setInputs]=useState({...defaults});
  const [result,setResult]=useState(null), [error,setError]=useState('');
  const [loading,setLoading]=useState(true), [running,setRunning]=useState(false), [reload,setReload]=useState(0);
  const requestId=useRef(0);
  useEffect(()=>{
    let active=true; setLoading(true); setError(''); setResult(null);
    api.get('/api/simulation/financial/baseline').then(r=>{if(active)setBaseline(r.data);})
      .catch(e=>{if(active){setBaseline(null);setError(e.formattedMessage||'Could not load your financial records.');}})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;requestId.current++;};
  },[reload]);
  function change(key,value){requestId.current++;setRunning(false);setResult(null);setError('');setInputs(p=>({...p,[key]:value}));}
  function preset(values){requestId.current++;setRunning(false);setResult(null);setError('');setInputs(p=>({...p,...values}));}
  async function run(event){
    event.preventDefault(); const id=++requestId.current;setRunning(true);setError('');setResult(null);
    try {const response=await api.post('/api/simulation/financial',Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,Number(v)])));
      if(id===requestId.current){setResult(response.data);setBaseline(response.data.baseline);}
    }catch(e){if(id===requestId.current)setError(e.formattedMessage||'Simulation could not run.');}
    finally{if(id===requestId.current)setRunning(false);}
  }
  const field=(key,label,min,max,step='any')=><label className="twin-field" key={key}>{label}<input type="number" required min={min} max={max} step={step} value={inputs[key]} onChange={e=>change(key,e.target.value)}/></label>;
  return <div className="dashboard-content financial-twin">
    <div className="dashboard-hero"><div><p className="twin-eyebrow">PLAN YOUR NEXT STEP</p><h1>Your money, your plan</h1><p>Explore financial decisions using your saved budget.</p></div><button className="btn btn-secondary" onClick={()=>setCurrentRoute('forecasting')}>Back to Forecasting</button></div>
    <div className="twin-notice">Financial scenarios are conditional budget calculations. Your saved records remain unchanged.</div>
    {error&&<p role="alert" className="twin-error">{error}</p>}
    {loading?<p role="status">Loading your current situation…</p>:<>
      <section className="card twin-section"><div className="twin-heading"><h2>1. Current situation</h2><button className="btn btn-secondary" disabled={running} onClick={()=>setReload(n=>n+1)}>Refresh records</button></div>
      {!baseline?.available?<p>{baseline?.message||'Records unavailable. Select Refresh records to retry.'}</p>:<>
        <p>Latest budget: {baseline.latest.date} · {baseline.observed_months} observed month(s)</p>
        <div className="twin-stats">{[['Monthly income',baseline.latest.income],['Monthly expenses',baseline.latest.expenses],['Monthly savings',baseline.latest.savings]].map(([label,value])=><div key={label}><span>{label}</span><strong>{number(value)}</strong></div>)}<div><span>Savings rate</span><strong>{baseline.savings_rate===null?'N/A':`${number(baseline.savings_rate)}%`}</strong></div></div>
        <details><summary>View history and calculation method</summary><p>{baseline.method}</p><p>Observed average income: {number(baseline.average_income)} · Average expenses: {number(baseline.average_expenses)} · Expense range: {baseline.expense_range.map(number).join(' – ')}</p></details>
        {baseline.warnings.map(w=><p className="twin-notice" key={w}>{w}</p>)}
        {baseline.excluded_records>0&&<p>{baseline.excluded_records} invalid or future-dated record(s) excluded.</p>}
        <details><summary>Explore recorded monthly budgets</summary><div className="twin-table"><table><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Savings</th></tr></thead><tbody>{baseline.history.map(p=><tr key={p.month}><td>{p.month}</td><td>{number(p.income)}</td><td>{number(p.expenses)}</td><td>{number(p.savings)}</td></tr>)}</tbody></table></div></details>
      </>}<button type="button" className="btn btn-secondary" onClick={()=>setCurrentRoute('financial')}>Add or review financial data</button></section>
      {baseline?.available&&<>
      <form className="card twin-section" onSubmit={run} onInvalidCapture={revealInvalid}><h2>2. What would you like to change?</h2>
        <div className="twin-presets"><button type="button" onClick={()=>preset({target_rate:30,income_change:0,risk_income_drop_pct:0,risk_expense_increase:0})}>Save 30% of income</button><button type="button" onClick={()=>preset({risk_income_drop_pct:10,risk_expense_increase:0})}>Test a 10% income drop</button></div>
        <p>Shortcuts adjust the assumptions below. You can edit every value. Amounts use your recorded currency.</p>
        <div className="twin-fields"><label className="twin-field">Duration<select value={inputs.months} onChange={e=>change('months',e.target.value)}>{[3,6,12].map(m=><option key={m} value={m}>{m} months</option>)}</select></label>
        {field('target_rate','Proposed savings target (%)',0,100)}
        </div><details className="twin-advanced"><summary>More options: income, starting balance and risk</summary><div className="twin-fields">{field('income_change','Proposed monthly income change',-baseline.latest.income,1e12)}
        {field('starting_balance','Existing savings balance (optional)',0,1e12)}
        {field('risk_expense_increase','Risk: extra monthly expenses',0,1e12)}
        {field('risk_income_drop_pct','Risk: income decrease (%)',0,100)}</div></details>
        <p className="twin-selection">Selected: {inputs.target_rate}% savings · {inputs.months} months · income change {number(inputs.income_change)} · starting balance {number(inputs.starting_balance)} · risk income drop {inputs.risk_income_drop_pct}% / extra expenses {number(inputs.risk_expense_increase)}.</p>
        <p>Income and expenses stay constant in the current plan. The proposed target sets its expense budget. Zero risk changes make current and risk lines overlap.</p>
        <div className="twin-actions"><button className="btn btn-primary" disabled={running}>{running?'Calculating…':'Compare plans'}</button><button type="button" className="btn btn-secondary" onClick={()=>{requestId.current++;setInputs({...defaults});setResult(null);setRunning(false);setError('');}}>Reset assumptions</button></div>
      </form>
      {result&&<><section className="card twin-section"><h2>3. See the difference</h2><p>Cumulative balance · {result.months} months · same currency as your records</p>
        <OutcomeCards scenarios={result.scenarios} />
        <ScenarioChart scenarios={result.scenarios} months={result.months}/>
        <details><summary>View full comparison table</summary><div className="twin-table"><table><thead><tr><th>Scenario</th><th>Monthly income</th><th>Monthly expenses</th><th>Monthly savings</th><th>Ending balance</th><th>Vs current plan</th></tr></thead><tbody>{result.scenarios.map(s=><tr key={s.key}><th>{s.label}</th><td>{number(s.income)}</td><td>{number(s.expenses)}</td><td>{number(s.monthly_savings)}</td><td>{number(s.ending_balance)}</td><td>{number(s.difference)}</td></tr>)}</tbody></table></div></details>
        <p>{result.required_expense_reduction>=0?'Required monthly expense reduction':'Additional expense allowance'} for proposed plan: <strong>{number(Math.abs(result.required_expense_reduction))}</strong>.</p>
        {result.scenarios.map(s=><p key={s.key}><strong>{s.label}:</strong> {s.assumption}</p>)}
        <details><summary>Exact monthly comparison</summary><div className="twin-table"><table><thead><tr><th>Future month</th>{result.scenarios.map(s=><th key={s.key}>{s.label}</th>)}</tr></thead><tbody>{result.scenarios[0].points.map((p,i)=><tr key={p.month}><td>{p.month}</td>{result.scenarios.map(s=><td key={s.key}>{number(s.points[i].balance)}</td>)}</tr>)}</tbody></table></div></details>
      </section><section className="card twin-section"><h2>Your next step</h2><QuickRecommendations recommendations={result.recommendations}/>
        <details><summary>Calculation assumptions</summary><ul>{result.assumptions.map(a=><li key={a}>{a}</li>)}</ul></details>
      </section></>}
      {result&&<AIRecommendations kind="finance" inputs={inputs} token={result.recommendation_token}/>}
      </>}
    </>}
  </div>;
}
