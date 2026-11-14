import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, PhoneMissed, LayoutDashboard } from 'lucide-react'
import { useStore } from '../store'
import { rupee } from '../lib/format'
const Hero = lazy(() => import('../three/Hero'))
export default function Landing() {
  const nav = useNavigate(); const p = useStore(s => s.presenter); const [calls, setCalls] = useState(212); const [leads, setLeads] = useState(64)
  useEffect(() => { const i = setInterval(() => setCalls(c => c + 1), 3500); return () => clearInterval(i) }, [])
  return <div className="h-full relative overflow-hidden bg-ink">
    <div className="absolute inset-0"><Suspense fallback={null}><Hero onCatch={() => setLeads(l => l + 1)} /></Suspense></div>
    <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-center z-10"><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl grid place-items-center font-head font-bold text-[#04201b] bg-teal">CC</span><b className="font-head">CallCatch <span className="text-white/40 font-normal text-sm">by Neovia AI</span></b></div><button className="btn" onClick={() => nav('/dashboard')}>Open app</button></div>
    <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-10 bg-gradient-to-t from-ink via-ink/80 to-transparent">
      <div className="max-w-3xl">{p.prospectBusiness && <div className="chip mb-3 text-teal">Demo prepared for {p.prospectBusiness}</div>}
        <h1 className="font-head text-3xl md:text-5xl font-semibold leading-tight">Never miss an enquiry again — even at 10 p.m. on a Sunday.</h1>
        <p className="text-white/65 mt-3 md:text-lg">Riya answers your calls in Hindi, English and Hinglish, captures the lead, books a callback and sends everything to WhatsApp.</p>
        <div className="flex gap-3 flex-wrap mt-6"><button className="btn btn-primary text-base py-3" onClick={() => nav('/call')}><Phone size={18} />📞 Call Riya now</button><button className="btn py-3" onClick={() => nav('/missed')}><PhoneMissed size={16} />See missed-call recovery</button><button className="btn py-3" onClick={() => nav('/dashboard')}><LayoutDashboard size={16} />Open dashboard</button></div></div>
      <div className="flex gap-8 mt-8 flex-wrap">{[['Calls answered tonight', calls], ['Leads captured', leads], ['Revenue rescued (est.)', rupee(leads * 38000)]].map(([l, v]) => <div key={l as string}><div className="font-head text-3xl text-teal tabular-nums">{typeof v === 'number' ? v : v}</div><div className="text-xs text-white/45">{l}</div></div>)}</div>
      <div className="text-[11px] text-white/30 mt-6">Demo · Fictional business data · Built by Neovia AI</div></div></div>
}
