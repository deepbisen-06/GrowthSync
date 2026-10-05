import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, RotateCcw, Sparkles } from 'lucide-react';
import api from '../api/client';
import useAIProvider from '../hooks/useAIProvider';
import './FloatingChat.css';

export default function FloatingChat({ setCurrentRoute }) {
  const [open,setOpen]=useState(false), [started,setStarted]=useState(false);
  const [messages,setMessages]=useState([]), [text,setText]=useState('');
  const [busy,setBusy]=useState(false), [error,setError]=useState('');
  const provider=useAIProvider();
  const controller=useRef(null), lock=useRef(false), launcher=useRef(null), input=useRef(null), log=useRef(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  useEffect(()=>{if(open) input.current?.focus();},[open,started]);
  useEffect(()=>{if(log.current) log.current.scrollTop=log.current.scrollHeight;},[messages,busy,open]);
  const close=()=>{setOpen(false);launcher.current?.focus();};
  const clear=()=>{controller.current?.abort();controller.current=null;lock.current=false;setBusy(false);setMessages([]);setError('');setText('');};
  async function send(question=text) {
    question=question.trim();
    if(!question || lock.current || !started) return;
    const abort=new AbortController();controller.current=abort;lock.current=true;setBusy(true);setError('');setText('');
    const history=messages.slice(-6).map(m=>({role:m.role,content:m.text.slice(0,2000)}));
    setMessages(m=>[...m.slice(-18),{role:'user',text:question}]);
    try {
      const {data}=await api.post('/api/chat',{message:question,module:'general',use_ai:true,history},{signal:abort.signal,timeout:40000});
      if(!abort.signal.aborted) setMessages(m=>[...m,{role:'assistant',text:data.answer,data}]);
    } catch(e) {
      if(!abort.signal.aborted){setError(e.formattedMessage||'Could not connect. Please retry.');setText(question);setMessages(m=>m.slice(0,-1));}
    } finally {if(controller.current===abort){lock.current=false;setBusy(false);controller.current=null;}}
  }
  return <>
    <aside id="growthsync-chat-panel" className="floating-chat" hidden={!open} role="dialog" aria-modal="false" aria-labelledby="floating-chat-title" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();}}}>
      <header><div><strong id="floating-chat-title"><Sparkles size={18}/> GrowthSync Assistant</strong><small>Gemini · Ask a question</small></div><div><button onClick={clear} aria-label="New conversation"><RotateCcw size={18}/></button><button onClick={close} aria-label="Minimize chat"><X size={20}/></button></div></header>
      {!started ? <div className="floating-chat-welcome"><MessageCircle size={38}/><h3>Hi! How can I help?</h3><p>Ask about your finances, studies, habits, GrowthSync, or a general question.</p><p className="fc-muted">Starting chat sends your questions, recent conversation and selected finance, study and habit summaries to Google Gemini. Saved names, contacts and raw notes are excluded. Avoid typing private details.</p><button className="btn btn-primary" disabled={!provider?.configured} onClick={()=>setStarted(true)}>Start chat with Gemini</button>{provider && !provider.configured && <p role="status">Gemini is not configured or the backend is unavailable. Check your backend settings and refresh.</p>}</div> : <>
        <div className="floating-chat-log" ref={log} role="log" aria-live="polite" aria-relevant="additions">
          {!messages.length && <div className="fc-suggestions"><p>What would you like to know?</p>{['Give me an overview of my saved data.','How do I use Future Simulator?','Help me plan a study routine.'].map(q=><button key={q} onClick={()=>send(q)}>{q}</button>)}</div>}
          {messages.map((m,i)=><article className={`fc-message ${m.role}`} key={i}><small>{m.role==='user'?'You':m.data.source==='gemini'?'GrowthSync · Gemini':'GrowthSync · Fallback'}</small><p>{m.text}</p>{m.data?.source==='rule_based' && <p className="fc-muted">{m.data.status}</p>}{m.data?.evidence?.length>0 && <details><summary>View recorded evidence</summary><dl>{m.data.evidence.filter(e=>!m.data.evidence_ids?.length||m.data.evidence_ids.includes(e.id)).map(e=><div key={e.id}><dt>{e.label}</dt><dd>{e.value}</dd></div>)}</dl></details>}</article>)}
          {busy && <p role="status">Thinking…</p>}
        </div>
        {error && <p className="fc-error" role="alert">{error}</p>}
        <div className="fc-tools"><button onClick={()=>{setCurrentRoute('simulation');close();}}>Open Future Simulator →</button><span>AI answers may be inaccurate.</span></div>
        <form onSubmit={e=>{e.preventDefault();send();}}><label htmlFor="floating-chat-question" className="fc-sr">Your message</label><textarea ref={input} id="floating-chat-question" rows={2} maxLength={1000} placeholder="Ask me anything…" value={text} disabled={busy} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/><button type="submit" disabled={busy||!text.trim()} aria-label="Send message"><Send size={20}/></button></form>
      </>}
    </aside>
    <button className="floating-chat-launcher" ref={launcher} aria-label={open?'Close GrowthSync chat':'Open GrowthSync chat'} aria-expanded={open} aria-controls="growthsync-chat-panel" onClick={()=>open?close():setOpen(true)}>{open?<X size={26}/>:<MessageCircle size={28}/>}</button>
  </>;
}
