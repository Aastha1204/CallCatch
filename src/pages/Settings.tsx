import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { useStore, useV } from '../store'
import { voices } from '../services/voice'
export default function Settings() {
  const s = useStore(); const v = useV(); const st = s.settings; const [vs, setVs] = useState(voices())
  useEffect(() => { const f = () => setVs(voices()); f(); speechSynthesis?.addEventListener?.('voiceschanged', f); return () => speechSynthesis?.removeEventListener?.('voiceschanged', f) }, [])
  const sorted = [...vs].sort((a, b) => (+(b.lang === 'hi-IN') * 2 + +(b.lang === 'en-IN')) - (+(a.lang === 'hi-IN') * 2 + +(a.lang === 'en-IN')))
  const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block text-xs text-white/50 space-y-1"><span>{t}</span>{children}</label>
  return <div className="p-6 max-w-3xl mx-auto space-y-5"><h1 className="font-head text-2xl font-semibold">Agent Settings · {v.name}</h1>
    <div className="card p-4 space-y-4"><L t="Persona name"><input className="w-full" value={st.persona[v.id]} onChange={e => s.setSettings({ persona: { ...st.persona, [v.id]: e.target.value } })} /></L>
      <L t="Greeting (AI disclosure and recording notice are locked)"><div className="relative"><textarea readOnly rows={3} className="w-full opacity-80" value={v.greeting.replace(/Riya|Asha|Neha/, st.persona[v.id])} /><Lock size={14} className="absolute right-3 top-3 text-amber" /></div></L>
      <div className="flex gap-4 flex-wrap text-sm">{Object.keys(st.languages).map(l => <label key={l} className="flex gap-2 items-center"><input type="checkbox" checked={st.languages[l]} onChange={e => s.setSettings({ languages: { ...st.languages, [l]: e.target.checked } })} />{l}</label>)}</div>
      <L t="Speech recognition language"><select value={st.sttLang} onChange={e => s.setSettings({ sttLang: e.target.value as 'hi-IN' | 'en-IN' })}><option value="hi-IN">hi-IN (Hindi + Hinglish)</option><option value="en-IN">en-IN (English)</option></select></L></div>
    <div className="card p-4 space-y-4"><L t="Voice (prefers hi-IN and en-IN)"><select className="w-full" value={st.voiceURI} onChange={e => s.setSettings({ voiceURI: e.target.value })}><option value="">Auto-select best voice</option>{sorted.map(x => <option key={x.voiceURI} value={x.voiceURI}>{x.name} · {x.lang}</option>)}</select></L>
      <L t={`Speaking rate · ${st.rate.toFixed(2)}×`}><input type="range" min={0.7} max={1.4} step={0.05} className="w-full" value={st.rate} onChange={e => s.setSettings({ rate: +e.target.value })} /></L></div>
    <div className="card p-4 grid sm:grid-cols-2 gap-4"><L t="Transfer number"><input className="w-full" value={st.transferNumber} onChange={e => s.setSettings({ transferNumber: e.target.value })} /></L><L t="After-hours behaviour"><select className="w-full" value={st.afterHours} onChange={e => s.setSettings({ afterHours: e.target.value as 'callback' | 'voicemail' })}><option value="callback">Book a callback</option><option value="voicemail">Take a message</option></select></L>
      <L t="Recording retention (days)"><input type="number" className="w-full" value={st.retentionDays} onChange={e => s.setSettings({ retentionDays: +e.target.value })} /></L><L t="Cost per minute (₹)"><input type="number" step="0.1" className="w-full" value={st.costPerMin} onChange={e => s.setSettings({ costPerMin: +e.target.value })} /></L>
      <div className="sm:col-span-2 text-sm"><div className="text-xs text-white/50 mb-1">Office hours</div>{v.hours.label}</div></div>
    <div className="card p-4 space-y-2"><L t="Engine"><select className="w-full" value={st.engine} onChange={e => s.setSettings({ engine: e.target.value as 'demo' | 'live' })}><option value="demo">Demo (scripted, no API key)</option><option value="live">Live (LLM via /api/riya)</option></select></L><div className="text-xs flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${st.engine === 'live' ? 'bg-amber' : 'bg-ok'}`} />{st.engine === 'live' ? 'API not configured in this build — each turn falls back to ScriptedEngine' : 'ScriptedEngine ready'}</div></div></div>
}
