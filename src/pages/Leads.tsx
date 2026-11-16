import { useEffect, useState } from 'react'
import { LayoutGrid, Table2 } from 'lucide-react'
import { useStore, useSlice, nowOf } from '../store'
import type { Stage, Lead } from '../types'
import { rupee } from '../lib/format'
const STAGES: Stage[] = ['New', 'Contacted', 'Quoted', 'Booked', 'Lost']
function countdown(t?: number) { if (!t) return '—'; const d = t - nowOf(); const a = Math.abs(d); const h = Math.floor(a / 3600000), m = Math.floor(a % 3600000 / 60000); return (d < 0 ? 'overdue ' : 'in ') + (h ? h + 'h ' : '') + m + 'm' }
export default function Leads() {
  const sl = useSlice(); const move = useStore(s => s.moveLead); const [view, setView] = useState<'kanban' | 'table'>('kanban'); const [, tick] = useState(0)
  useEffect(() => { const i = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(i) }, [])
  const total = sl.leads.filter(l => l.stage !== 'Lost').reduce((a, l) => a + l.budget, 0)
  const card = (l: Lead) => <div key={l.id} draggable onDragStart={e => e.dataTransfer.setData('id', l.id)} className="card p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition">
    <div className="flex justify-between"><b className="text-sm">{l.name}</b><span className={`chip !text-[10px] ${l.score >= 70 ? 'text-alert' : ''}`}>{l.score >= 70 ? '🔥 ' : ''}{l.score}</span></div>
    <div className="text-xs text-white/50 mt-1">{[l.need.destination, l.need.month, l.need.travellers && l.need.travellers + ' pax'].filter(Boolean).join(' · ')}</div><div className="text-xs mt-1">{l.budget ? rupee(l.budget) : '—'}</div>
    <div className="flex justify-between text-[11px] text-white/40 mt-2"><span className="chip !text-[10px]">{l.source}</span><span>📞 {countdown(l.callbackAt)}</span></div></div>
  return <div className="p-3 md:p-6 max-w-[1500px] mx-auto"><div className="flex justify-between items-end mb-4 flex-wrap gap-2"><div><h1 className="font-head text-2xl font-semibold">Leads</h1><div className="text-sm text-white/50">Total pipeline value <b className="text-white">{rupee(total)}</b> · {sl.leads.length} leads</div></div>
    <div className="flex gap-1 p-1 rounded-xl bg-white/5"><button className={`btn !border-0 ${view === 'kanban' ? '!bg-white/15' : ''}`} onClick={() => setView('kanban')}><LayoutGrid size={14} />Kanban</button><button className={`btn !border-0 ${view === 'table' ? '!bg-white/15' : ''}`} onClick={() => setView('table')}><Table2 size={14} />Table</button></div></div>
    {view === 'kanban' ? <div className="overflow-x-auto -mx-3 px-3"><div className="grid grid-cols-5 gap-3 min-w-[1000px]">{STAGES.map(st => <div key={st} onDragOver={e => e.preventDefault()} onDrop={e => move(e.dataTransfer.getData('id'), st)} className="rounded-2xl bg-white/[.03] p-2 min-h-[400px]"><div className="text-xs font-semibold text-white/60 px-1 py-2 flex justify-between">{st}<span>{sl.leads.filter(l => l.stage === st).length}</span></div><div className="space-y-2">{sl.leads.filter(l => l.stage === st).map(card)}</div></div>)}</div></div>
      : <div className="card overflow-auto"><table className="w-full text-sm"><thead className="text-xs text-left text-white/40"><tr><th className="p-3">Name</th><th>Need</th><th>Budget</th><th>Score</th><th>Source</th><th>Stage</th><th>Callback</th></tr></thead><tbody>{sl.leads.map(l => <tr key={l.id} className="border-t border-white/5"><td className="p-3">{l.name}</td><td>{l.need.destination ?? '—'}</td><td>{l.budget ? rupee(l.budget) : '—'}</td><td>{l.score}</td><td>{l.source}</td><td><select value={l.stage} onChange={e => move(l.id, e.target.value as Stage)}>{STAGES.map(s => <option key={s}>{s}</option>)}</select></td><td>{countdown(l.callbackAt)}</td></tr>)}</tbody></table></div>}
  </div>
}
