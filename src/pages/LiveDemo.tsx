import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, PhoneOff, UserRound, Send, Keyboard, Play, Check, ShieldAlert, Cog, BookOpenCheck, PhoneCall } from 'lucide-react'
import { useCall } from '../services/session'
import { useStore, useV } from '../store'
import { mmss, fmtTime } from '../lib/format'
import { sttSupported } from '../services/voice'
import { VARIANTS } from '../data'
const Orb = lazy(() => import('../three/Orb'))
const Phones = lazy(() => import('../three/Phones'))
const Skel = () => <div className="w-full h-full grid place-items-center text-white/30 text-sm animate-pulse">Loading 3D scene…</div>

export function Flights() {
  const flights = useCall(s => s.flights)
  return <>{flights.map(f => <Flight key={f.id} f={f} />)}</>
}
function Flight({ f }: { f: { id: number; name: string; target: string } }) {
  const a = document.getElementById('orb-box')?.getBoundingClientRect(); const b = document.getElementById(f.target)?.getBoundingClientRect()
  if (!a || !b) return null
  return <motion.div initial={{ x: a.left + a.width / 2 - 40, y: a.top + a.height / 2, opacity: 0, scale: 0.6 }} animate={{ x: b.left + 20, y: b.top + 30, opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.8] }} transition={{ duration: 1.1, ease: 'easeInOut' }}
    className="fixed left-0 top-0 z-[80] pointer-events-none px-2.5 py-1 rounded-full text-[11px] font-mono text-white" style={{ background: 'var(--accent)', color: '#04201b', boxShadow: '0 0 18px var(--accent)' }}>⚙ {f.name}</motion.div>
}

function Gauge({ v }: { v: number }) {
  const r = 42, c = 2 * Math.PI * r
  return <svg viewBox="0 0 110 110" className="w-24 h-24 shrink-0"><circle cx="55" cy="55" r={r} stroke="rgba(255,255,255,.08)" strokeWidth="9" fill="none" /><motion.circle cx="55" cy="55" r={r} stroke={v >= 70 ? '#FF5A5F' : 'var(--accent)'} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - v / 100) }} transition={{ duration: 0.8 }} transform="rotate(-90 55 55)" /><text x="55" y="60" textAnchor="middle" fill="white" fontSize="24" fontWeight="700" fontFamily="Sora">{v}</text></svg>
}

export function Pre({ onStart }: { onStart: (m: 'live' | 'typed' | 'auto') => void }) {
  const v = useV(); const persona = useStore(s => s.settings.persona[s.variant]); const ok = sttSupported()
  return <div className="min-h-full grid lg:grid-cols-2 gap-6 p-4 md:p-6 items-center">
    <div className="md:hidden card p-5 flex items-center gap-4"><div className="w-16 h-16 rounded-full grid place-items-center text-xl font-head font-bold text-[#04201b] animate-pulse" style={{ background: 'var(--accent)' }}>{v.mono}</div><div><div className="font-head text-lg">{v.name}</div><div className="text-white/50 text-sm">Incoming call · {persona} (AI)</div></div></div>
    <div className="hidden md:block md:h-[520px] lg:h-full md:min-h-[420px]"><Suspense fallback={<Skel />}><Phones phones={[{ x: 0, label: 'Incoming', ring: true, node: <div style={{ width: 330, height: 640 }} className="bg-gradient-to-b from-[#0f1830] to-[#070B14] grid place-items-center text-center p-6"><div><div className="w-24 h-24 rounded-full mx-auto grid place-items-center text-3xl font-head font-bold text-[#04201b] animate-pulse" style={{ background: 'var(--accent)' }}>{v.mono}</div><div className="mt-5 font-head text-xl">{v.name}</div><div className="text-white/50 text-sm mt-1">Incoming call · {persona} (AI)</div></div></div> }]} w={330} h={640} className="w-full h-full" /></Suspense></div>
    <div className="max-w-md space-y-5">
      <h1 className="font-head text-3xl font-semibold">Call {persona}, your AI receptionist</h1>
      <p className="text-white/60">Speak in Hindi, English or Hinglish — or type. Watch the reasoning, the lead card and the guardrails live.</p>
      <ul className="card p-4 space-y-2 text-sm">{[[ok, ok ? 'Speech recognition available' : 'Speech recognition unavailable here — typed mode will be used'], [true, 'Language auto-detect: Hindi · English · Hinglish'], [true, 'Recording notice is spoken first']].map(([g, t], i) => <li key={i} className="flex gap-2 items-center"><Check size={15} className={g ? 'text-ok' : 'text-amber'} />{t as string}</li>)}</ul>
      <button className="btn btn-primary w-full justify-center text-base py-3" onClick={() => onStart('live')}><PhoneCall size={18} />Start call</button>
      <div className="flex gap-3"><button className="btn flex-1 justify-center" onClick={() => onStart('typed')}><Keyboard size={16} />Type instead</button><button className="btn flex-1 justify-center" onClick={() => onStart('auto')}><Play size={16} />Auto-play sample call <kbd className="hidden md:inline text-[10px] opacity-60">A</kbd></button></div>
    </div>
  </div>
}

export default function LiveDemo() {
  const c = useCall(); const v = useV(); const nav = useNavigate(); const [sp] = useSearchParams(); const persona = useStore(s => s.settings.persona[s.variant])
  const [leaving, setLeaving] = useState(false); const [txt, setTxt] = useState(''); const [open, setOpen] = useState<number | null>(null); const scroller = useRef<HTMLDivElement>(null)
  const finish = () => { if (useCall.getState().status !== 'active') return; setLeaving(true); setTimeout(() => { const id = useCall.getState().end(); if (id) nav('/call/summary/' + id) }, 1200) }
  useEffect(() => { const a = () => useCall.getState().start('auto'); const e = () => finish(); window.addEventListener('callcatch-auto', a); window.addEventListener('callcatch-ended', e); if (sp.get('auto') === '1') a(); return () => { window.removeEventListener('callcatch-auto', a); window.removeEventListener('callcatch-ended', e) } }, [])
  useEffect(() => { const d = (e: KeyboardEvent) => { if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && useCall.getState().status === 'active') { e.preventDefault(); if (!e.repeat) useCall.getState().ptt(true) } }; const u = (e: KeyboardEvent) => { if (e.code === 'Space') useCall.getState().ptt(false) }; window.addEventListener('keydown', d); window.addEventListener('keyup', u); return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u) } }, [])
  useEffect(() => { scroller.current?.scrollTo({ top: 1e5, behavior: 'smooth' }) }, [c.items.length])
  useEffect(() => { if (c.status === 'ended') useCall.setState({ status: 'idle' }) }, [])
  if (c.status !== 'active') return <Pre onStart={m => useCall.getState().start(m)} />
  const words = c.caption.split(/(\s+)/); let pos = 0
  const orbColor = { idle: '#7f8aa3', listening: '#2EE6C5', thinking: '#8B7CFF', speaking: '#FFB547' }[c.orb]
  const fieldKeys = ['phone', ...v.slots.filter(k => k !== 'callback'), 'callback'].filter((k, i, a) => a.indexOf(k) === i && k !== 'callback' || k === 'callback')
  return <div className="min-h-full p-3 md:p-4 grid gap-4 xl:grid-cols-[40fr_35fr_25fr] lg:grid-cols-2 relative">
    <AnimatePresence>{leaving && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1 }} className="absolute inset-0 z-50 bg-ink pointer-events-none" />}</AnimatePresence>
    <Flights />
    {/* left */}
    <section className="card flex flex-col p-4 min-h-[520px]">
      <motion.div animate={leaving ? { scale: 0.45, opacity: 0.2 } : { scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: 'easeInOut' }} className="h-[300px] md:h-auto md:flex-1 md:min-h-[280px]"><Suspense fallback={<Skel />}><Orb className="w-full h-full" /></Suspense></motion.div>
      <div className="text-center text-xs mb-1" style={{ color: orbColor }}>● {c.orb.toUpperCase()}{c.transferring && ' · Connecting you to Priya…'}</div>
      <div className="min-h-[84px] text-center text-base md:text-xl font-head leading-snug px-2" aria-live="polite">{c.interim ? <span className="text-white/50">{c.interim}</span> : words.map((w, i) => { const s = pos; pos += w.length; const on = s <= c.capIdx; return <span key={i} className={on ? (c.capWho === 'riya' ? 'text-amber' : 'text-teal') : 'text-white/25'}>{w}</span> })}</div>
      {c.banner && <div className="text-xs text-amber text-center mb-2">{c.banner}</div>}
      <div className="flex justify-center gap-2 md:gap-3 my-3 flex-wrap">
        <button className="btn" onMouseDown={() => c.ptt(true)} onMouseUp={() => c.ptt(false)} title="Tap to talk · hold Space for push-to-talk"><Mic size={16} />Talk</button>
        <button className={`btn ${c.muted ? 'btn-danger' : ''}`} onClick={c.mute} aria-label="Mute">{c.muted ? <MicOff size={16} /> : <Mic size={16} />}Mute</button>
        <button className="btn" onClick={() => useStore.getState().say(c.tools.length || true ? 'Transfer requested — try saying "mujhe human se baat karni hai"' : '')}><UserRound size={16} />Transfer to human</button>
        <button className="btn btn-danger" onClick={finish}><PhoneOff size={16} />End call</button>
      </div>
      <div className="text-center text-[12px] text-white/50 font-mono"><span className="text-alert">● REC</span> {mmss(c.secs)} · {c.lang === 'MIX' ? 'Hinglish' : c.lang === 'HI' ? 'Hindi' : 'English'} detected · Response {c.latency ? c.latency + 's' : '—'}</div>
    </section>
    {/* middle */}
    <section className="card flex flex-col min-h-[420px] lg:max-h-[calc(100vh-130px)]">
      <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold">Live transcript</div>
      <div ref={scroller} className="flex-1 overflow-auto p-4 space-y-3">
        {c.items.map((it, i) => it.k === 'turn' ? <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${it.t.who === 'caller' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${it.t.who === 'caller' ? 'bg-teal/15 border border-teal/20' : 'bg-white/5 border border-white/5'}`}>
          <div className="text-[10px] text-white/40 mb-0.5 flex gap-2"><span>{it.t.who === 'riya' ? persona : 'Caller'}</span><span className="chip !py-0 !text-[10px]">{it.t.lang === 'MIX' ? 'MIX' : it.t.lang}</span><span>{fmtTime(it.t.at)}</span></div>{it.t.text}</div></motion.div>
          : <div key={i} className="flex justify-center"><button onClick={() => setOpen(open === it.c.id ? null : it.c.id)} className="chip font-mono !text-[11px] hover:bg-white/10">⚙ {it.c.name} · {it.c.ms}ms ✓</button>
            {open === it.c.id && <pre className="absolute z-10 mt-7 card p-3 text-[11px] font-mono max-w-sm overflow-auto text-teal">{JSON.stringify({ args: it.c.args, result: it.c.result }, null, 2)}</pre>}</div>)}
        {!c.items.length && <div className="text-white/30 text-sm text-center mt-10">Transcript will appear here…</div>}
      </div>
      <form className="p-3 border-t border-white/5 flex gap-2" onSubmit={e => { e.preventDefault(); c.typed(txt); setTxt('') }}><input className="flex-1" placeholder="Type as the caller… e.g. Kashmir December mein chaar log, budget dedh lakh" value={txt} onChange={e => setTxt(e.target.value)} /><button className="btn btn-primary" aria-label="Send"><Send size={16} /></button></form>
    </section>
    {/* right */}
    <section className="space-y-4 lg:col-span-2 xl:col-span-1 overflow-auto lg:max-h-[calc(100vh-130px)]">
      <div id="panel-lead" className="card p-4"><div className="text-sm font-semibold mb-3">Live lead card</div>
        <div className="space-y-2">{['phone', ...v.slots.filter(k => k !== 'callback'), 'callback'].map(k => <div key={k} className="flex justify-between items-center text-sm border-b border-white/5 pb-1.5"><span className="text-white/50">{v.labels[k]}</span><AnimatePresence mode="wait"><motion.span key={c.fields[k] ?? '-'} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} className={c.fields[k] ? 'text-white flex items-center gap-1' : 'text-white/25'}>{c.fields[k] ? <><Check size={13} className="text-ok" />{c.fields[k]}</> : '—'}</motion.span></AnimatePresence></div>)}</div>
        <div className="mt-4 flex items-center gap-3"><Gauge v={c.score} /><div className="text-[12px] space-y-1">{c.reasons.length ? c.reasons.map(r => <div key={r.label} className="text-white/70">+{r.pts} <span className="text-white/45">{r.label}</span></div>) : <span className="text-white/35">Lead score builds as the call proceeds</span>}{c.score >= 70 && <div className="text-alert font-semibold">🔥 Hot lead</div>}</div></div>
      </div>
      <div id="panel-rag" className="card p-4"><div className="text-sm font-semibold mb-2 flex gap-2 items-center"><BookOpenCheck size={15} />Answer source (RAG)</div>
        {c.rag.length ? c.rag.map(r => <div key={r.title} className="mb-2"><div className="flex justify-between text-xs"><span>{r.title}</span><span className="font-mono text-white/50">{r.score.toFixed(2)}</span></div><div className="h-1.5 rounded bg-white/10 mt-1"><motion.div className="h-full rounded" style={{ background: 'var(--accent)' }} animate={{ width: r.score * 100 + '%' }} /></div></div>) : <div className="text-xs text-white/35">No lookup yet</div>}</div>
      <div className="card p-4"><div className="text-sm font-semibold mb-2 flex gap-2 items-center"><ShieldAlert size={15} />Guardrails</div>{c.guards.length ? c.guards.map((g, i) => <div key={i} className="text-xs text-amber mb-1">{g}</div>) : <div className="text-xs text-white/35">Riya declines to invent answers — events appear here</div>}</div>
      <div className="text-[11px] text-white/30 flex items-center gap-1"><Cog size={11} />{VARIANTS[useStore.getState().variant].persona} · hands-free · barge-in enabled · hold Space to talk</div>
    </section>
  </div>
}
