import React, {useEffect,useRef,useState} from 'react';
import api from '../api/client';
import useAIProvider from '../hooks/useAIProvider';

export default function AIRecommendations({kind,inputs,token}) {
  const provider = useAIProvider();
  const [answer,setAnswer]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const sequence=useRef(0);
  useEffect(()=>{setAnswer(null);setError('');setLoading(false);return ()=>{sequence.current++;};},[token]);
  async function generate(){
    const id=++sequence.current;setLoading(true);setError('');setAnswer(null);
    const path=kind==='finance'?'/api/simulation/financial/recommendations':`/api/simulation/routine/${kind}/recommendations`;
    const payload=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,k==='baseline_mode'?v:Number(v)]));
    try{const r=await api.post(path,{...payload,recommendation_token:token},{timeout:45000});
      if(id===sequence.current)setAnswer(r.data);
    }catch(e){if(id===sequence.current)setError(e.formattedMessage||'AI is unavailable. Your rule-based recommendations above remain available.');}
    finally{if(id===sequence.current)setLoading(false);}
  }
  return <section className="card twin-section" aria-label="AI recommendations"><h2>5. AI Recommendations</h2>
    <p>Generate a {provider?.label || 'AI'} explanation of this comparison. Clicking sends calculated recommendation evidence and assumptions to {provider?.recipient || 'the configured AI service'}; raw logs, names and contact details are excluded.</p>
    <button type="button" className="btn btn-primary" disabled={loading||!token||!provider?.configured} onClick={generate}>{loading?'Generating explanation…':'Generate AI Recommendations'}</button>
    {provider && !provider.configured && <p>Configure the AI provider in the backend environment. Rule-based recommendations remain available above.</p>}
    {!token&&<p>Run the comparison again after restarting the updated backend.</p>}
    {loading&&<p role="status">Waiting for {provider?.label || 'AI'}…</p>}{error&&<p role="alert" className="twin-error">{error}</p>}
    {answer&&<><p role="status"><strong>{answer.source==='gemini'?`Gemini · ${answer.model}`:'Rule-based fallback'}</strong> — {answer.message}</p>
      <div className="twin-recommendations">{answer.recommendations.map(r=><article key={r.id}><h3>{r.title}</h3>{r.explanation&&<p>{r.explanation}</p>}<p><strong>Evidence:</strong> {r.observation}</p><p><strong>Action:</strong> {r.action}</p><p><strong>Calculated impact:</strong> {r.impact}</p><p><strong>Condition:</strong> {r.condition}</p></article>)}</div></>}
  </section>;
}
