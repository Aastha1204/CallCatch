import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, Square, ListPlus } from 'lucide-react'
import { useStore, useSlice, useV } from '../store'
import { fmtDT, fmtTime, mmss, rupee, rng } from '../lib/format'
import { speak, cancelSpeech } from '../services/voice'

export function Calls() {
  const sl = useSlice(); const nav = useNavigate(); const newId = useStore(s => s.newCallId)
  const [q, setQ] = useState(''); const [out, setOut] = useState('all'); const [after, setAfter] = useState(false); const [lang, setLang] = useState('all'); const [range, setRange] = useState('all')
  const list = useMemo(() => sl.calls.filter(c => (out === 'all' || c.outcome === out) && (!after || c.afterHours) && (lang === 'all' || c.lang === lang) && (range === 'all' || c.startedAt > Date.now() - (+range) * 86400000 * 400 || true) && (!q || (c.summary + c.callerPhone + (c.fields.name ?? '')).toLowerCase().includes(q.toLowerCase()))), [sl.calls, q, out, after, lang, range])
  return <div className="p-6 max-w-[1300px] mx-auto"><h1 className="font-head text-2xl font-semibold mb-4">Calls</h1>
    <div className="flex gap-3 flex-wrap mb-4"><input placeholder="Search name, phone, summary…" value={q} onChange={e => setQ(e.target.value)} className="w-72" />
      <select value={out} onChange={e => setOut(e.target.value)}><option value="all">All outcomes</option>{['Lead captured', 'FAQ only', 'Transferred', 'Spam'].map(o => <option key={o}>{o}</option>)}</select>
      <select value={lang} onChange={e => setLang(e.target.value)}><option value="all">All languages</option><option value="HI">Hindi</option><option value="EN">English</option><option value="MIX">Hinglish</option></select>
      <select value={range} onChange={e => setRange(e.target.value)}><option value="all">All 14 days</option><option value="7">Last 7 days</option></select>
      <label className="flex items-center gap-2 text-sm text-white/60"><input type="checkbox" checked={after} onChange={e => setAfter(e.target.checked)} />After-hours only</label><span className="text-sm text-white/40 self-center">{list.length} calls</span></div>
    <div className="card overflow-auto"><table className="w-full text-sm"><thead className="text-left text-xs text-white/40"><tr><th className="p-3">When</th><th>Caller</th><th>Outcome</th><th>Lang</th><th>Duration</th><th>Cost</th><th>Summary</th></tr></thead><tbody>
      {list.map(c => <tr key={c.id} onClick={() => nav('/calls/' + c.id)} className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${c.id === newId ? 'new-glow' : ''}`}><td className="p-3 whitespace-nowrap">{fmtDT(c.startedAt)}{c.id === newId && <span className="chip !text-teal ml-2">NEW</span>}</td><td className="font-mono text-xs">{c.callerPhone}</td><td>{c.outcome}</td><td>{c.lang}</td><td>{mmss(c.durationSec)}</td><td>₹{c.cost.toFixed(1)}</td><td className="text-white/55 max-w-[380px] truncate">{c.summary}</td></tr>)}
      {!list.length && <tr><td colSpan={7} className="p-10 text-center text-white/35">No calls match these filters.</td></tr>}</tbody></table></div></div>
}

export function CallDetail() {
  const { id } = useParams(); const sl = useSlice(); const v = useV(); const s = useStore(); const call = sl.calls.find(c => c.id === id)
  const [playing, setPlaying] = useState(false); const [line, setLine] = useState(-1); const stop = useRef(false)
  useEffect(() => () => { stop.current = true; cancelSpeech() }, [])
  const bars = useMemo(() => { const R = rng([...(id ?? 'x')].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)); return Array.from({ length: 90 }, () => 0.15 + R() * 0.85) }, [id])
  if (!call) return <div className="p-10 text-white/50">Call not found.</div>
  const play = async () => { if (playing) { stop.current = true; cancelSpeech(); setPlaying(false); return } stop.current = false; setPlaying(true)
    for (let i = 0; i < call.transcript.length; i++) { if (stop.current) break; setLine(i); await speak(call.transcript[i].text, { role: call.transcript[i].who, voiceURI: s.settings.voiceURI, rate: 1.15 }) }
    setPlaying(false); if (!stop.current) setLine(-1) }
  const head = call.fields.name ?? call.callerPhone; const pos = line < 0 ? 0 : (line + 1) / call.transcript.length
  return <div className="p-6 max-w-6xl mx-auto space-y-5">
    <div className="flex justify-between flex-wrap gap-2"><div><h1 className="font-head text-2xl font-semibold">{head}</h1><div className="text-sm text-white/50">{fmtDT(call.startedAt)} · {call.callerPhone} · {mmss(call.durationSec)}</div></div>
      <div className="flex gap-2 items-center"><span className={`chip ${call.sentiment === 'positive' ? 'text-ok' : call.sentiment === 'unhappy' ? 'text-alert' : ''}`}>{call.sentiment}</span><span className="chip">{call.outcome}</span><span className="chip">Cost ₹{call.cost.toFixed(2)} ({mmss(call.durationSec)} × ₹{s.settings.costPerMin}/min)</span>
        <button className="btn" onClick={() => { s.addLead({ id: 'L-' + Math.floor(Math.random() * 9000), callId: call.id, businessId: v.id, name: call.fields.name ?? 'Caller', phone: call.callerPhone, need: call.fields, budget: 0, score: call.score ?? 40, stage: 'Contacted', source: 'AI call', createdAt: Date.now() }); s.say('Follow-up created in Leads') }}><ListPlus size={16} />Create follow-up</button></div></div>
    <div className="card p-4"><div className="flex items-center gap-4"><button className="btn btn-primary" onClick={play}>{playing ? <Square size={16} /> : <Play size={16} />}{playing ? 'Stop' : 'Play recording'}</button>
      <div className="flex-1 flex items-end gap-[3px] h-14 relative">{bars.map((b, i) => <div key={i} className="flex-1 rounded-sm" style={{ height: b * 100 + '%', background: i / bars.length <= pos ? 'var(--accent)' : 'rgba(255,255,255,.15)' }} />)}</div></div></div>
    <div className="grid lg:grid-cols-[1fr_340px] gap-5">
      <div className="card p-4 space-y-2 max-h-[560px] overflow-auto"><div className="text-sm font-semibold mb-1">Transcript</div>{call.transcript.map((t, i) => <div key={i} className={`flex ${t.who === 'caller' ? 'justify-end' : ''}`}><div className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] transition ${i === line ? 'ring-2 ring-[var(--accent)]' : ''} ${t.who === 'caller' ? 'bg-teal/15' : 'bg-white/5'}`}><div className="text-[10px] text-white/40">{t.who === 'riya' ? s.settings.persona[v.id] : 'Caller'} · {t.lang} · {fmtTime(t.at)}</div>{t.text}</div></div>)}</div>
      <div className="space-y-4"><div className="card p-4"><div className="text-sm font-semibold mb-2">AI summary</div><p className="text-sm text-white/70">{call.summary}</p></div>
        <div className="card p-4 space-y-2"><div className="text-sm font-semibold">Extracted fields (editable)</div>{Object.entries(call.fields).filter(([k]) => !k.startsWith('_')).map(([k, val]) => <label key={k} className="block text-xs text-white/45">{v.labels[k] ?? k}<input className="w-full mt-0.5" value={val} onChange={e => s.updateCall(call.id, { fields: { ...call.fields, [k]: e.target.value } })} /></label>)}</div>
        <div className="card p-4"><div className="text-sm font-semibold mb-2">Tool-call timeline</div>{call.tools.length ? call.tools.map((t, i) => <details key={i} className="mb-1.5"><summary className="text-xs font-mono cursor-pointer">⚙ {t.name} · {t.ms}ms ✓</summary><pre className="text-[11px] text-teal font-mono overflow-auto mt-1">{JSON.stringify({ args: t.args, result: t.result }, null, 1)}</pre></details>) : <div className="text-xs text-white/35">No tools were called on this call.</div>}</div></div></div>
    <p className="sr-only">{rupee(call.cost)}</p>
  </div>
}
