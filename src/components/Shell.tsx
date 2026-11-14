import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Phone, PhoneMissed, LayoutDashboard, ListChecks, Users, BookOpen, Settings2, Calculator, ChevronLeft, ChevronRight, SlidersHorizontal, Terminal, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, nowOf } from '../store'
import { VARIANTS } from '../data'
import type { VariantId } from '../types'
import { fmtDay, fmtTime } from '../lib/format'
import { useCall } from '../services/session'
import { cancelSpeech } from '../services/voice'

const NAV = [['/call', 'Live Demo', Phone], ['/missed', 'Missed-Call Mode', PhoneMissed], ['/dashboard', 'Dashboard', LayoutDashboard], ['/calls', 'Calls', ListChecks], ['/leads', 'Leads', Users], ['/kb', 'Knowledge Base', BookOpen], ['/settings', 'Agent Settings', Settings2], ['/roi', 'ROI & Plans', Calculator]] as const

export default function Shell() {
  const [collapsed, setCollapsed] = useState(false); const [pres, setPres] = useState(false); const [consoleOpen, setConsole] = useState(false); const [clockOpen, setClockOpen] = useState(false)
  const nav = useNavigate(); const loc = useLocation()
  const { variant, setVariant, toast, say, presenter, settings, clock, clockLive } = useStore()
  const v = VARIANTS[variant]
  useEffect(() => { document.documentElement.style.setProperty('--accent', v.accent) }, [v.accent])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => say(''), 2600); return () => clearTimeout(t) }, [toast, say])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName; if (e.ctrlKey && e.key === '.') { e.preventDefault(); setPres(p => !p); return }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase(); const st = useStore.getState()
      if (k === 'a') { cancelSpeech(); nav('/call'); setTimeout(() => window.dispatchEvent(new CustomEvent('callcatch-auto')), 120) }
      else if (k === 'm') { nav('/missed'); setTimeout(() => window.dispatchEvent(new CustomEvent('callcatch-missed')), 120) }
      else if (k === 'r') { st.reset() } else if (k === '1' || k === '2' || k === '3') st.setVariant((['travel', 'clinic', 'realestate'] as VariantId[])[+k - 1])
      else if (k === 'l') st.setSettings({ engine: st.settings.engine === 'demo' ? 'live' : 'demo' }); else if (k === 'f') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen() }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [nav])
  const [, tick] = useState(0); useEffect(() => { const i = setInterval(() => tick(x => x + 1), 15000); return () => clearInterval(i) }, [])
  const t = nowOf(); const landing = loc.pathname === '/'
  if (landing) return <><Outlet /><ToastBar toast={toast} /></>
  return <div className="h-full flex">
    <aside className={`shrink-0 border-r border-white/5 bg-[#0a101c] flex flex-col transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}>
      <button onClick={() => nav('/')} className="flex items-center gap-3 px-4 h-16 text-left">
        <span className="w-9 h-9 rounded-xl grid place-items-center font-head font-bold text-[#04201b]" style={{ background: 'var(--accent)' }}>CC</span>
        {!collapsed && <span><b className="font-head block leading-4">CallCatch</b><span className="text-[11px] text-white/40">by Neovia AI</span></span>}
      </button>
      <nav className="flex-1 px-2 space-y-1">{NAV.map(([to, label, Icon]) => <NavLink key={to} to={to} title={label} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon size={18} />{!collapsed && label}</NavLink>)}</nav>
      <button className="m-3 btn justify-center" onClick={() => setCollapsed(c => !c)} aria-label="Collapse sidebar">{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
    </aside>
    <div className="flex-1 min-w-0 flex flex-col">
      <header className="h-16 shrink-0 flex items-center gap-3 px-5 border-b border-white/5 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">{(Object.keys(VARIANTS) as VariantId[]).map(k => <button key={k} onClick={() => setVariant(k)} className={`px-3 py-1.5 rounded-lg text-sm transition ${variant === k ? 'text-[#04201b] font-semibold' : 'text-white/60 hover:text-white'}`} style={variant === k ? { background: 'var(--accent)' } : {}}>{{ travel: 'Travel', clinic: 'Clinic', realestate: 'Real Estate' }[k]}</button>)}</div>
        <span className="text-sm text-white/50 hidden lg:block">{presenter.whiteLabel && presenter.prospectBusiness ? presenter.prospectBusiness : v.name}</span>
        <div className="flex-1" />
        <div className="relative">
          <button className="chip hover:bg-white/10" onClick={() => setClockOpen(o => !o)}>🕘 {new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }).format(t)} {fmtTime(t)} · {clockLive ? 'live' : 'simulated'}</button>
          {clockOpen && <div className="absolute right-0 top-9 z-40 card p-3 w-64 space-y-2 shadow-2xl">
            <div className="text-xs text-white/50">Simulated clock (IST) — {fmtDay(t)}</div>
            <input type="datetime-local" className="w-full" value={new Date((clock ?? t) + 19800000).toISOString().slice(0, 16)} onChange={e => { if (e.target.value) { useStore.getState().setClock(new Date(e.target.value + ':00Z').getTime() - 19800000); useStore.getState().setClockLive(false) } }} />
            <div className="flex gap-2"><button className="btn flex-1 justify-center" onClick={() => { useStore.getState().setClockLive(false); useStore.getState().setClock(clock ?? Date.now()) }}>Simulated</button><button className="btn flex-1 justify-center" onClick={() => useStore.getState().setClockLive(true)}>Real time</button></div>
          </div>}
        </div>
        <button className="chip" onClick={() => setSettings()} title="Toggle engine (L)"><span className={`w-2 h-2 rounded-full ${settings.engine === 'demo' ? 'bg-amber' : 'bg-ok'}`} />{settings.engine === 'demo' ? 'Demo engine' : 'Live engine'}</button>
        <button className="btn" onClick={() => setPres(true)}><SlidersHorizontal size={16} />Presenter</button>
      </header>
      <main className="flex-1 min-h-0 overflow-auto"><Outlet /></main>
      <footer className="shrink-0 h-8 flex items-center justify-between px-5 text-[11px] text-white/35 border-t border-white/5"><span>Demo · Fictional business data · Built by Neovia AI</span><button className="flex items-center gap-1 hover:text-white" onClick={() => setConsole(c => !c)}><Terminal size={12} />Console</button></footer>
    </div>
    <AnimatePresence>{pres && <Presenter onClose={() => setPres(false)} />}</AnimatePresence>
    {consoleOpen && <Console onClose={() => setConsole(false)} />}
    <ToastBar toast={toast} />
  </div>
  function setSettings() { useStore.getState().setSettings({ engine: settings.engine === 'demo' ? 'live' : 'demo' }) }
}
function ToastBar({ toast }: { toast: string }) { return <AnimatePresence>{toast && <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl bg-[#17203a] border border-white/10 text-sm shadow-2xl">{toast}</motion.div>}</AnimatePresence> }
function Console({ onClose }: { onClose: () => void }) { const logs = useStore(s => s.logs); return <div className="fixed bottom-8 right-4 w-[520px] max-w-[95vw] h-64 card z-50 flex flex-col shadow-2xl"><div className="flex justify-between items-center px-3 py-2 border-b border-white/5 text-xs"><b>Presenter console · engine logs, raw STT, latency, fallbacks</b><button onClick={onClose}><X size={14} /></button></div><div className="flex-1 overflow-auto p-3 font-mono text-[11px] text-white/70 space-y-1">{logs.length ? logs.slice().reverse().map((l, i) => <div key={i}>{l}</div>) : 'No events yet.'}</div></div> }
function Presenter({ onClose }: { onClose: () => void }) {
  const { presenter: p, setPresenter, reset, settings, setSettings } = useStore(); const nav = useNavigate()
  return <motion.div initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="fixed right-0 top-0 bottom-0 w-[360px] z-[90] bg-[#0b1220]/95 backdrop-blur border-l border-white/10 p-5 overflow-auto space-y-4">
    <div className="flex justify-between"><h3 className="font-head font-semibold">Presenter</h3><button onClick={onClose}><X size={18} /></button></div>
    {([['prospectName', 'Prospect name'], ['prospectBusiness', 'Prospect business'], ['prospectPhone', 'Prospect WhatsApp (e.g. 919876543210)']] as const).map(([k, l]) => <label key={k} className="block text-xs text-white/50">{l}<input className="w-full mt-1" value={p[k]} onChange={e => setPresenter({ [k]: e.target.value })} /></label>)}
    {([['whiteLabel', 'White-label preview'], ['hidePrices', 'Hide prices'], ['lite', 'Lite mode (no bloom, fewer particles)']] as const).map(([k, l]) => <label key={k} className="flex items-center justify-between text-sm">{l}<input type="checkbox" checked={p[k]} onChange={e => setPresenter({ [k]: e.target.checked })} /></label>)}
    <label className="block text-xs text-white/50">Engine<select className="w-full mt-1" value={settings.engine} onChange={e => setSettings({ engine: e.target.value as 'demo' | 'live' })}><option value="demo">Demo (scripted)</option><option value="live">Live (LLM, falls back to scripted)</option></select></label>
    <button className="btn w-full justify-center" onClick={() => { reset(); nav('/') }}>Reset demo (R)</button>
    <div className="text-xs text-white/40 leading-6">Hotkeys: <b>A</b> auto-play · <b>M</b> missed call · <b>R</b> reset · <b>1/2/3</b> variant · <b>L</b> engine · <b>F</b> fullscreen · hold <b>Space</b> push-to-talk · <b>Ctrl+.</b> this menu</div>
  </motion.div>
}
