import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { PhoneMissed, Play } from 'lucide-react'
import { useStore, useV, nowOf } from '../store'
import { WhatsAppPhoneUI, type WaMsg } from '../components/WhatsApp'
import { fmtTime, istParts } from '../lib/format'
const Phones = lazy(() => import('../three/Phones'))

export default function Missed() {
  const v = useV(); const s = useStore(); const sl = s.data[s.variant]
  const [phase, setPhase] = useState<'idle' | 'ringing' | 'missed' | 'chat'>('idle'); const [rings, setRings] = useState(0); const [count, setCount] = useState(0); const [real, setReal] = useState(false)
  const [msgs, setMsgs] = useState<WaMsg[]>([]); const [typing, setTyping] = useState(false); const [step, setStep] = useState(-1); const data = useRef<Record<string, string>>({}); const phone = useRef('+91 99XXX XX408'); const timers = useRef<number[]>([])
  const [at, setAt] = useState(0)
  const flow = v.id === 'travel' ? [
    { k: 'destination', q: 'Great! Where would you like to go?', o: ['Kashmir', 'Kerala', 'Goa', 'Dubai'] }, { k: 'month', q: 'Which month are you planning to travel?', o: ['December', 'January', 'February', 'March'] }, { k: 'travellers', q: 'How many travellers?', o: ['2', '4', '6'] }, { k: 'name', q: 'May I have your name please?', o: [] }, { k: 'callback', q: 'When should our expert call you?', o: ['Tomorrow 11 AM', 'Tomorrow 5 PM', 'Monday 11 AM'] }]
    : v.id === 'clinic' ? [{ k: 'destination', q: 'Which treatment do you need?', o: ['Cleaning', 'Filling', 'Root canal', 'Braces'] }, { k: 'name', q: 'May I have your name please?', o: [] }, { k: 'callback', q: 'Preferred appointment time?', o: ['Tomorrow 6 PM', 'Saturday 11 AM', 'Saturday 6 PM'] }]
    : [{ k: 'destination', q: 'Which configuration are you looking at?', o: ['1 BHK', '2 BHK'] }, { k: 'name', q: 'May I have your name please?', o: [] }, { k: 'callback', q: 'Preferred site-visit time?', o: ['Sunday 11 AM', 'Sunday 4 PM', 'Monday 5 PM'] }]
  const first = v.id === 'travel' ? ['Holiday package', 'Visa help', 'Talk to an agent'] : v.id === 'clinic' ? ['Book appointment', 'Treatment prices', 'Talk to staff'] : ['Book site visit', 'Pricing', 'Talk to sales']
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }
  useEffect(() => clear, [])
  const add = (m: Omit<WaMsg, 'id' | 'time'>) => setMsgs(x => [...x, { ...m, id: Math.random().toString(36).slice(2), time: fmtTime(Date.now() + (nowOf() - Date.now())) }])
  const bot = (text: string, buttons?: WaMsg['buttons']) => { setTyping(true); later(() => { setTyping(false); add({ from: 'them', text, buttons }) }, 700) }
  const ask = (i: number) => { const f = flow[i]; if (!f) return finish(); setStep(i); bot(f.q, f.o.length ? f.o.map(o => ({ label: o, onClick: () => answer(i, o) })) : undefined) }
  const answer = (i: number, val: string) => { const f = flow[i]; data.current[f.k] = val; add({ from: 'me', text: val, ticks: 'read' }); setMsgs(m => m.map(x => x.buttons ? { ...x, buttons: undefined } : x)); later(() => ask(i + 1), 300) }
  const finish = () => { const d = data.current; bot(`Callback booked ✓ ${d.name ?? ''} ji, ${d.callback ?? ''} — our team will call you.`)
    later(() => { const st = useStore.getState(); st.addLead({ id: 'L-' + Math.floor(Math.random() * 9000), businessId: v.id, name: d.name ?? 'Missed caller', phone: phone.current, need: d, budget: 0, score: 55, stage: 'New', source: 'Missed call', callbackAt: nowOf() + 86400000, createdAt: Date.now() }); st.say('Lead added · source: Missed call') }, 900) }
  const start = () => { clear(); data.current = {}; setMsgs([]); setStep(-1); setPhase('ringing'); setRings(0); setCount(0); setAt(nowOf())
    for (let i = 1; i <= 4; i++) later(() => setRings(i), i * 1000)
    later(() => { setPhase('missed'); setCount(real ? 30 : 3); useStore.getState().addMissed({ id: 'M-' + Date.now(), businessId: v.id, callerPhone: phone.current, at: nowOf(), whatsappSent: false, replied: false }) }, 4300) }
  useEffect(() => { const h = () => start(); window.addEventListener('callcatch-missed', h); return () => window.removeEventListener('callcatch-missed', h) })
  useEffect(() => { if (phase !== 'missed') return; if (count <= 0) { setPhase('chat'); setMsgs([]); bot('Sorry we missed your call! 🙏 Tell us what you need and we\'ll get back to you.', first.map(l => ({ label: l, onClick: () => { add({ from: 'me', text: l, ticks: 'read' }); setMsgs(m => m.map(x => x.buttons ? { ...x, buttons: undefined } : x)); if (/agent|staff|sales/i.test(l)) bot('Sure, a team member will call you shortly.'); else later(() => ask(0), 300) } }))); return }
    const t = setTimeout(() => setCount(c => c - 1), 1000); return () => clearTimeout(t) }, [phase, count])
  const textStep = phase === 'chat' && step >= 0 && flow[step]?.k === 'name' && !data.current.name
  const screen = phase === 'chat' ? <WhatsAppPhoneUI title={v.name} sub="business account" msgs={msgs} typing={typing} h={620} input={textStep ? { placeholder: 'Type your name…', onSend: t => answer(step, t) } : undefined} />
    : <div style={{ width: 330, height: 620 }} className={`grid place-items-center text-center p-6 ${phase === 'missed' ? 'bg-gradient-to-b from-[#3a0f14] to-[#12060a]' : 'bg-gradient-to-b from-[#0f1830] to-[#070B14]'}`}><div><PhoneMissed size={44} className={`mx-auto ${phase === 'missed' ? 'text-alert' : 'text-white/40'}`} /><div className="mt-4 font-head text-lg">{phase === 'idle' ? 'Waiting for a call' : phase === 'ringing' ? `Ringing… (${rings}/4)` : 'Missed call'}</div>
      {phase !== 'idle' && <div className="text-white/60 text-sm mt-2">{phone.current} · {fmtTime(at)}</div>}{phase === 'missed' && <div className="mt-4 chip text-amber">WhatsApp auto-reply in {count}s</div>}</div></div>
  const today = sl.missed.filter(m => istParts(m.at).d === istParts(nowOf()).d || true).slice(0, 20); const replied = today.filter(m => m.replied).length; const fromMissed = sl.leads.filter(l => l.source === 'Missed call').length
  return <div className="p-3 md:p-6 grid xl:grid-cols-[1fr_380px] gap-6 max-w-7xl mx-auto">
    <div><h1 className="font-head text-2xl font-semibold">Missed-Call Mode</h1><p className="text-white/55 text-sm mb-3">No AI voice needed — every missed call gets a WhatsApp in 30 seconds.</p>
      <div className="flex gap-3 mb-2 items-center flex-wrap"><button className="btn btn-primary" onClick={start}><Play size={16} />Simulate missed call <kbd className="hidden md:inline text-[10px] opacity-60">M</kbd></button><label className="text-xs text-white/50 flex gap-2 items-center"><input type="checkbox" checked={real} onChange={e => setReal(e.target.checked)} />Real time (30s) instead of accelerated 3s</label></div>
      <div className="md:h-[660px]"><Suspense fallback={<div className="h-full grid place-items-center text-white/30">Loading 3D phone…</div>}><Phones w={330} h={620} className="w-full h-full" phones={[{ x: 0, label: 'Caller phone', red: phase === 'missed', ring: phase === 'ringing' || phase === 'missed', node: screen }]} /></Suspense></div></div>
    <aside className="card p-4 h-fit"><div className="text-sm font-semibold mb-1">Today's missed-call digest</div><div className="text-[11px] text-white/40 mb-3">Sent to the owner every evening at 8 p.m.</div>
      <div className="grid grid-cols-3 gap-2 text-center mb-4">{[['Missed', today.length], ['Replied', replied], ['Leads', fromMissed]].map(([l, n]) => <div key={l as string} className="rounded-xl bg-white/5 p-2"><div className="font-head text-xl">{n}</div><div className="text-[11px] text-white/45">{l}</div></div>)}</div>
      <div className="space-y-1.5 text-xs">{today.slice(0, 7).map(m => <div key={m.id} className="flex justify-between border-b border-white/5 pb-1"><span className="font-mono">{m.callerPhone}</span><span className="text-white/45">{fmtTime(m.at)}</span><span className={m.replied ? 'text-ok' : 'text-white/35'}>{m.replied ? 'replied' : 'no reply'}</span></div>)}</div></aside>
  </div>
}
