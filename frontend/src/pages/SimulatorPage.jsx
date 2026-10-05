import React, { useState } from 'react';
import FinancialSimulatorPage from './FinancialSimulatorPage';
import RoutineSimulator from '../components/RoutineSimulator';
import './SimulatorPage.css';

export default function SimulatorPage({setCurrentRoute}) {
  const [module,setModule]=useState('finance');
  return <><nav className="twin-module-nav" aria-label="Simulation modules">
    {['finance','study','habit'].map(kind=><button key={kind} className={`btn ${module===kind?'btn-primary':'btn-secondary'}`} aria-pressed={module===kind} onClick={()=>setModule(kind)}>{kind==='finance'?'Finance':kind==='study'?'Study':'Habit'} simulation</button>)}
  </nav>{module==='finance'?<FinancialSimulatorPage setCurrentRoute={setCurrentRoute}/>:<RoutineSimulator key={module} kind={module} setCurrentRoute={setCurrentRoute}/>}</>;
}
