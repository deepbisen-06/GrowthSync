import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, RotateCcw, Sparkles, SlidersHorizontal } from 'lucide-react';
import api from '../api/client';
import useAIProvider from '../hooks/useAIProvider';
import './GrowthSyncChat.css';

const suggestions = {
  finance: ['Summarize my recorded budget.', 'What should I review before increasing savings?'],
  study: ['Summarize my recent study time.', 'Explain the limitations of my study data.'],
  habit: ['Summarize my sleep, exercise and screen time.', 'How can I compare a routine change?'],
};
const initialFinance = { months:12, target_rate:30, income_change:0, starting_balance:0, risk_income_drop_pct:0, risk_expense_increase:0 };
const initialRoutine = { days:7, baseline_mode:'observed', reserved_hours:'', study_delta:0, sleep_delta:0, exercise_delta:0, screen_delta:0, risk_study_loss:0, risk_sleep_loss:0, risk_exercise_loss:0, risk_screen_increase:0, study_goal_hours:0 };
const number = n => Number(n).toLocaleString(undefined, { maximumFractionDigits:2 });

function Comparison({ charts }) {
  const [selected, setSelected] = useState(0);
  const chart = charts[selected] || charts[0];
  if (!chart) return null;
  const values = chart.series.flatMap(s => s.points.map(p => p.y));
  const low = Math.min(0,...values), high = Math.max(1,...values), span = high-low || 1;
  const maxX = Math.max(1,...chart.series.flatMap(s=>s.points.map(p=>p.x)));
  const x = value => 80+(value/maxX)*650;
  const y = value => 200-((value-low)/span)*170;
  const colors = ['#3b82f6','#10b981','#f59e0b'];
  return <div className="gs-chat-chart">
    {charts.length > 1 && <label>Comparison metric <select value={selected} onChange={e=>setSelected(Number(e.target.value))}>{charts.map((c,i)=><option key={c.label} value={i}>{c.label}</option>)}</select></label>}
    <p><strong>{chart.label}</strong> ({chart.unit})</p>
    <svg viewBox="0 0 760 240" role="img" aria-label={`${chart.label}. Exact values are in the table below.`}>
      {[0,0.5,1].map(t=><g key={t}><line x1="80" x2="730" y1={200-t*170} y2={200-t*170} stroke="currentColor" opacity=".15"/><text x="72" y={204-t*170} textAnchor="end">{number(low+t*span)}</text></g>)}
      {chart.series.map((s,i)=><polyline key={s.name} points={s.points.map(p=>`${x(p.x)},${y(p.y)}`).join(' ')} fill="none" stroke={colors[i]} strokeWidth="3" strokeDasharray={i===2?'6 4':undefined}/>)}
      <text x="80" y="226">0</text><text x="410" y="226" textAnchor="middle">{chart.x_label}</text><text x="730" y="226" textAnchor="end">{maxX}</text>
    </svg>
    <div className="gs-chat-legend">{chart.series.map((s,i)=><span key={s.name}><i style={{background:colors[i]}}/>{s.name}</span>)}</div>
    <details><summary>Exact comparison values</summary><div className="gs-chat-table-scroll"><table><thead><tr><th>{chart.x_label}</th>{chart.series.map(s=><th key={s.name}>{s.name}</th>)}</tr></thead><tbody>{chart.series[0].points.map((p,i)=><tr key={p.x}><td>{p.x}</td>{chart.series.map(s=><td key={s.name}>{number(s.points[i].y)}</td>)}</tr>)}</tbody></table></div></details>
  </div>;
}
function NumberField({ name, label, values, setValues, min, max, step='any' }) {
  return <label>{label}<input type="number" value={values[name]} min={min} max={max} step={step} required onChange={e=>setValues(v=>({...v,[name]:e.target.value===''?'':Number(e.target.value)}))}/></label>;
}
function Reply({ data }) {
  return <div className="gs-chat-reply">
    <p className="gs-chat-source">{data.source === 'gemini' ? 'Gemini explanation' : 'Calculated / rule-based response'}</p>
    <p className="gs-chat-answer">{data.answer}</p>
    <p className="gs-chat-status">{data.status}</p>
    {!!data.warnings?.length && <ul className="gs-chat-warnings">{data.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>}
    <details open><summary>Recorded and calculated evidence</summary><dl className="gs-chat-evidence">{data.evidence.map(e=><div key={e.id} className={data.evidence_ids?.includes(e.id)?'gs-chat-cited':''}><dt>{e.label}</dt><dd>{e.value}</dd></div>)}</dl></details>
    <Comparison charts={data.charts || []}/>
    {data.recommendations?.map((r,i)=><div className="gs-chat-recommendation" key={i}><strong>{r.title}</strong>{r.observation && <p>{r.observation}</p>}<p>{r.action}</p>{r.impact && <p><strong>Calculated impact:</strong> {r.impact}</p>}<p className="gs-chat-condition"><strong>Condition:</strong> {r.condition}</p></div>)}
    <details><summary>Assumptions</summary><ul>{data.assumptions?.map((a,i)=><li key={i}>{a}</li>)}</ul></details>
  </div>;
}

export default function GrowthSyncChat({ setCurrentRoute }) {
  const provider = useAIProvider();
  const [module,setModule]=useState('finance');
  const [message,setMessage]=useState('');
  const [messages,setMessages]=useState([]);
  const [useAI,setUseAI]=useState(false);
  const [compare,setCompare]=useState(false);
  const [finance,setFinance]=useState(initialFinance);
  const [routine,setRoutine]=useState(initialRoutine);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const requestRef=useRef(null);
  const busyRef=useRef(false);
  const logRef=useRef(null);
  useEffect(()=>()=>requestRef.current?.abort(),[]);
  useEffect(()=>{if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight;},[messages,busy]);

  const reset = (next=module) => {
    requestRef.current?.abort(); requestRef.current=null; busyRef.current=false;
    setModule(next);setMessages([]);setMessage('');setError('');setBusy(false);setCompare(false);setRoutine(initialRoutine);setFinance(initialFinance);
  };
  async function send(text) {
    const question=text.trim();
    if(!question || busyRef.current) return;
    if(compare && Object.values(module==='finance'?finance:routine).some(v=>v==='')) {setError('Complete every plan field, including other daily commitments. Enter zero only when it is your intended assumption.');return;}
    const payload={message:question,module,use_ai:useAI,history:messages.slice(-6).map(m=>({role:m.role,content:(m.role==='user'?m.text:m.data.answer).slice(0,2000)}))};
    if(compare) payload[module==='finance'?'financial_plan':'routine_plan']=module==='finance'?finance:routine;
    const controller=new AbortController();requestRef.current=controller;busyRef.current=true;
    setError('');setBusy(true);setMessage('');
    setMessages(v=>[...v.slice(-18),{role:'user',text:question}]);
    try {
      const {data}=await api.post('/api/chat',payload,{signal:controller.signal,timeout:40000});
      if(!controller.signal.aborted) setMessages(v=>[...v,{role:'assistant',data}]);
    } catch(err) {
      if(!controller.signal.aborted) {setError(err.formattedMessage || 'Chat could not connect. Check the backend and retry.');setMessage(question);setMessages(v=>v.slice(0,-1));}
    } finally {
      if(requestRef.current===controller) {busyRef.current=false;setBusy(false);requestRef.current=null;}
    }
  }
  const routineField=(name,label,min,max)=><NumberField key={name} name={name} label={label} values={routine} setValues={setRoutine} min={min} max={max}/>;
  return <section id="growthsync-chat" className="gs-chat" aria-labelledby="gs-chat-heading">
    <header className="gs-chat-heading"><div><h2 id="gs-chat-heading"><MessageCircle size={23}/> Ask GrowthSync</h2><p>Understand your records and compare a plan.</p></div><button className="btn btn-secondary btn-sm" onClick={()=>reset()}><RotateCcw size={15}/> New chat</button></header>
    <div className="gs-chat-controls"><div className="gs-chat-modules" aria-label="Chat topic">{['finance','study','habit'].map(m=><button key={m} className={m===module?'selected':''} aria-pressed={m===module} onClick={()=>reset(m)}>{m==='finance'?'Finance':m==='study'?'Study':'Habits'}</button>)}</div><button className="btn btn-secondary btn-sm" onClick={()=>setCurrentRoute(module==='finance'?'financial':module)}>Add / review records</button></div>
    <label className="gs-chat-check gs-chat-consent"><input type="checkbox" checked={useAI} disabled={busy || !provider?.configured} onChange={e=>setUseAI(e.target.checked)}/> Chat with Gemini</label>
    <p className="gs-chat-help">When enabled, sending shares your question, recent chat messages and selected financial/routine summaries with Google Gemini. Saved names, contact details and raw notes are excluded. Avoid typing private details. Chat clears on leaving this dashboard or starting a new chat. AI explanations can be wrong.</p>
    {provider && !provider.configured && <p className="gs-chat-help">Gemini is not ready. Check the backend API key configuration and restart the backend. Calculated summaries still work.</p>}
    <div className="gs-chat-suggestions">{suggestions[module].map(q=><button key={q} disabled={busy} onClick={()=>send(q)}>{q}</button>)}</div>
    <div className="gs-chat-plan"><label className="gs-chat-check"><input type="checkbox" checked={compare} disabled={busy} onChange={e=>setCompare(e.target.checked)}/><SlidersHorizontal size={16}/> Compare a plan with this message</label>
      {compare && <div><p className="gs-chat-help">These fields define the calculation. Question text cannot override them. Zero risk changes make the risk scenario match the current plan.</p><fieldset disabled={busy} className="gs-chat-fields">
        {module==='finance'?<>
          <label>Duration<select value={finance.months} onChange={e=>setFinance(v=>({...v,months:Number(e.target.value)}))}>{[3,6,12].map(n=><option key={n} value={n}>{n} months</option>)}</select></label>
          <NumberField name="target_rate" label="Target savings (%)" values={finance} setValues={setFinance} min={0} max={100}/>
          <NumberField name="starting_balance" label="Starting balance (saved units)" values={finance} setValues={setFinance} min={0} max={1e12}/>
          <NumberField name="income_change" label="Monthly income change (saved units)" values={finance} setValues={setFinance} min={-1e12} max={1e12}/>
          <NumberField name="risk_income_drop_pct" label="Risk: income decrease (%)" values={finance} setValues={setFinance} min={0} max={100}/>
          <NumberField name="risk_expense_increase" label="Risk: extra monthly expenses" values={finance} setValues={setFinance} min={0} max={1e12}/>
        </>:<>
          <label>Duration<select value={routine.days} onChange={e=>setRoutine(v=>({...v,days:Number(e.target.value)}))}>{[7,14,28].map(n=><option key={n} value={n}>{n} days</option>)}</select></label>
          <label>Baseline<select value={routine.baseline_mode} onChange={e=>setRoutine(v=>({...v,baseline_mode:e.target.value,days:e.target.value==='trend'?7:v.days}))}><option value="observed">Recorded-day average</option><option value="trend">Short trend (7 days only)</option></select></label>
          {routineField('reserved_hours',module==='study'?'Other commitments incl. sleep (hours/day)':'Other commitments excl. sleep/exercise (hours/day)',0,24)}
          {module==='study'?<>{routineField('study_delta','Daily study change (hours)',-24,24)}{routineField('risk_study_loss','Risk: lost study time (hours/day)',0,24)}{routineField('study_goal_hours','Remaining study-time goal (hours; 0 = none)',0,672)}</>:<>
            {routineField('sleep_delta','Daily sleep change (hours)',-24,24)}{routineField('exercise_delta','Daily exercise change (minutes)',-1440,1440)}{routineField('screen_delta','Daily screen-time change (hours)',-24,24)}
            {routineField('risk_sleep_loss','Risk: sleep loss (hours/day)',0,24)}{routineField('risk_exercise_loss','Risk: exercise loss (minutes/day)',0,1440)}{routineField('risk_screen_increase','Risk: screen increase (hours/day)',0,24)}
          </>}
        </>}
      </fieldset><button className="btn btn-secondary btn-sm" disabled={busy} onClick={()=>send('Compare the configured plan and explain the main trade-offs.')}>Calculate comparison</button></div>}
    </div>
    <div className="gs-chat-log" ref={logRef} role="log" aria-label="Chat conversation" aria-live="polite" aria-relevant="additions">
      {!messages.length && <div className="gs-chat-empty"><Sparkles size={24}/><p>Ask about your {module} records, or compare a plan.</p><small>No sample records are added. Answers use your saved data.</small></div>}
      {messages.map((m,i)=><article key={i} className={`gs-chat-message ${m.role}`}><span className="gs-chat-role">{m.role==='user'?'You':'GrowthSync'}</span>{m.role==='user'?<p>{m.text}</p>:<Reply data={m.data}/>}</article>)}
      {busy && <p role="status">Reading your records{useAI?' and requesting an AI explanation':''}…</p>}
    </div>
    {error && <p className="gs-chat-error" role="alert">{error}</p>}
    <form className="gs-chat-compose" onSubmit={e=>{e.preventDefault();send(message);}}><label className="gs-chat-input-label" htmlFor="gs-chat-question">Your question</label><textarea id="gs-chat-question" rows={2} maxLength={1000} value={message} disabled={busy} placeholder={`Ask about your ${module} data…`} onChange={e=>setMessage(e.target.value)}/><button className="btn btn-primary" type="submit" disabled={busy || !message.trim()}><Send size={17}/> {busy?'Sending…':'Send'}</button></form>
  </section>;
}
