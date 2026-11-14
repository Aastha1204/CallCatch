import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { animate } from 'framer-motion'
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import { useStore, useSlice, useV, nowOf } from '../store'
import { rupee, fmtDT, istParts, istDate, mmss } from '../lib/format'
const Globe3D = lazy(() => import('../three/Globe3D')); const Bars3D = lazy(() => import('../three/Bars3D'))

function Count({ to, fmt = (n: number) => String(Math.round(n)) }: { to: number; fmt?: (n: number) => string }) {
  const [v, setV] = useState(0); useEffect(() => { const a = animate(0, to, { duration: 1, onUpdate: setV }); return () => a.stop() }, [to]); return <>{fmt(v)}</>
}
export const dayKey = (t: number) => { const p = istParts(t); return p.y * 10000 + p.mo * 100 + p.d }
export default function Dashboard() {
  const sl = useSlice(); const v = useV(); const nav = useNavigate(); const newId = useStore(s => s.newCallId); const cpm = useStore(s => s.settings.costPerMin)
  const wrap = useRef<HTMLDivElement>(null); const [w, setW] = useState(520)
  useEffect(() => { const f = () => wrap.current && setW(wrap.current.clientWidth); f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  const m = useMemo(() => {
    const calls = sl.calls; const now = nowOf(); const p = istParts(now)
    const days = Array.from({ length: 14 }, (_, i) => istDate(p.y, p.mo, p.d - (13 - i), 12)); const byDay = days.map(d => ({ d: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(d), n: calls.filter(c => dayKey(c.startedAt) === dayKey(d)).length, leads: calls.filter(c => dayKey(c.startedAt) === dayKey(d) && c.outcome === 'Lead captured').length }))
    const spark = byDay.slice(-7); const hours = Array.from({ length: 24 }, (_, h) => ({ h, n: calls.filter(c => istParts(c.startedAt).h === h).length }))
    const after = calls.filter(c => c.afterHours).length; const leads = calls.filter(c => c.outcome === 'Lead captured').length; const totalCost = calls.reduce((a, c) => a + c.cost, 0)
    const outcomes = ['Lead captured', 'FAQ only', 'Transferred', 'Spam'].map(o => ({ name: o, value: calls.filter(c => c.outcome === o).length }))
    return { spark, byDay, hours, after, leads, outcomes, avg: calls.reduce((a, c) => a + c.durationSec, 0) / (calls.length || 1), cost: totalCost / (calls.length || 1), cpl: totalCost / (leads || 1), recovered: sl.missed.filter(x => x.replied).length }
  }, [sl.calls, sl.missed, cpm])
  const dest = useMemo(() => v.destinations.map(d => { const ls = sl.leads.filter(l => l.need.destination === d.name); return { ...d, count: ls.length, value: ls.reduce((a, l) => a + l.budget, 0) } }).filter(d => d.count), [sl.leads, v])
  const pipeline = sl.leads.reduce((a, l) => a + l.budget, 0); const maxH = Math.max(1, ...m.hours.map(h => h.n))
  const kpis: [string, number, (n: number) => string, number[]][] = [['Calls answered', sl.calls.length, n => String(Math.round(n)), m.spark.map(s => s.n)], ['Avg duration', m.avg, n => mmss(n), m.spark.map(s => s.n)], ['Leads captured', m.leads, n => String(Math.round(n)), m.spark.map(s => s.leads)], ['After-hours calls', m.after / (sl.calls.length || 1) * 100, n => Math.round(n) + '%', m.spark.map(s => s.n)], ['Missed calls recovered', m.recovered, n => String(Math.round(n)), m.spark.map(s => s.n)], ['Cost per call', m.cost, n => '₹' + n.toFixed(1), m.spark.map(s => s.n)], ['Cost per lead', m.cpl, n => '₹' + n.toFixed(1), m.spark.map(s => s.leads)]]
  const COL = ['#2EE6C5', '#8B7CFF', '#FFB547', '#FF5A5F']
  return <div className="p-6 space-y-5 max-w-[1500px] mx-auto">
    <div className="flex justify-between items-end flex-wrap gap-2"><h1 className="font-head text-2xl font-semibold">Dashboard · {v.name}</h1><span className="text-sm text-white/50">Pipeline value <b className="text-white">{rupee(pipeline)}</b></span></div>
    <div className="card p-4 border-teal/30 bg-teal/5 text-sm">💡 <b>{m.after} of {sl.calls.length}</b> calls came after 7 p.m. or on Sunday — times your team was offline. CallCatch answered every one.</div>
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">{kpis.map(([l, n, f, sp]) => <div key={l} className="card p-3"><div className="text-[11px] text-white/45">{l}</div><div className="font-head text-2xl mt-1"><Count to={n} fmt={f} /></div><div className="h-8 mt-1"><ResponsiveContainer><AreaChart data={sp.map(y => ({ y }))}><Area dataKey="y" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={1.5} /></AreaChart></ResponsiveContainer></div></div>)}</div>
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="card p-4"><div className="text-sm font-semibold mb-2">Outcomes</div><div className="h-52"><ResponsiveContainer><PieChart><Pie data={m.outcomes} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">{m.outcomes.map((_, i) => <Cell key={i} fill={COL[i]} />)}</Pie><Tooltip contentStyle={{ background: '#0E1422', border: '1px solid #223' }} /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap gap-2 text-[11px]">{m.outcomes.map((o, i) => <span key={o.name} className="chip"><i className="w-2 h-2 rounded-full" style={{ background: COL[i] }} />{o.name} {o.value}</span>)}</div></div>
      <div className="card p-4"><div className="text-sm font-semibold mb-2">Calls by hour of day</div><div className="grid grid-cols-12 gap-1.5 mt-4">{m.hours.map(h => <div key={h.h} className="text-center"><div className="aspect-square rounded-md grid place-items-center text-[10px]" style={{ background: `rgba(46,230,197,${0.06 + (h.n / maxH) * 0.9})`, color: h.n / maxH > 0.5 ? '#04201b' : '#8fa' }} title={`${h.h}:00 — ${h.n} calls`}>{h.n}</div><div className="text-[9px] text-white/35 mt-0.5">{h.h}</div></div>)}</div><p className="text-xs text-white/45 mt-3">The evening spike (7–11 p.m.) is when walk-in demand lands and the office is closed.</p></div>
      <div className="card p-4"><div className="text-sm font-semibold mb-2">Calls over 14 days</div><div className="h-52"><ResponsiveContainer><LineChart data={m.byDay}><XAxis dataKey="d" tick={{ fontSize: 10, fill: '#7a88a3' }} interval={2} /><YAxis tick={{ fontSize: 10, fill: '#7a88a3' }} width={24} /><Tooltip contentStyle={{ background: '#0E1422', border: '1px solid #223' }} /><Line dataKey="n" stroke="var(--accent)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div>
    </div>
    <div className="card p-4"><div className="text-sm font-semibold mb-2">{v.chartTitle}</div><div ref={wrap} className="h-[420px] overflow-hidden grid place-items-center">
      <Suspense fallback={<div className="text-white/30">Loading 3D…</div>}>{v.id === 'travel' ? <Globe3D data={dest} size={[w, 420]} /> : <Bars3D data={v.packages.map(p => ({ name: p.name, n: sl.leads.filter(l => l.need.destination === p.dest).length + sl.calls.filter(c => c.fields.destination === p.dest).length }))} />}</Suspense></div></div>
    <div className="card p-4 overflow-auto"><div className="text-sm font-semibold mb-3">Recent calls</div><table className="w-full text-sm"><thead className="text-left text-white/40 text-xs"><tr><th className="pb-2">When</th><th>Caller</th><th>Outcome</th><th>Duration</th><th>Summary</th></tr></thead><tbody>
      {sl.calls.slice(0, 8).map(c => <tr key={c.id} onClick={() => nav('/calls/' + c.id)} className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${c.id === newId ? 'new-glow' : ''}`}><td className="py-2 whitespace-nowrap">{fmtDT(c.startedAt)} {c.id === newId && <span className="chip !text-teal ml-1">NEW</span>}</td><td className="font-mono text-xs">{c.callerPhone}</td><td>{c.outcome}</td><td>{mmss(c.durationSec)}</td><td className="text-white/55 max-w-[420px] truncate">{c.summary}</td></tr>)}</tbody></table></div>
  </div>
}
void Bar; void BarChart
