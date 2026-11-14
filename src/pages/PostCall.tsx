import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ExternalLink, LayoutDashboard } from 'lucide-react'
import { useStore, useV } from '../store'
import { WhatsAppPhoneUI, type WaMsg } from '../components/WhatsApp'
import { downloadBrochure, brochureName } from '../lib/pdf'
import { fmtTime, fmtDayLong, rupee } from '../lib/format'
import { VARIANTS } from '../data'
const Phones = lazy(() => import('../three/Phones'))

export default function PostCall() {
  const { id } = useParams(); const nav = useNavigate(); const v = useV(); const s = useStore()
  const call = s.data[s.variant].calls.find(c => c.id === id); const [step, setStep] = useState(0)
  useEffect(() => { const t = [300, 1100, 1700, 2300, 2900].map((ms, i) => setTimeout(() => setStep(i + 1), ms)); return () => t.forEach(clearTimeout) }, [id])
  const pkg = s.data[s.variant].pkgs.find(p => p.id === call?.fields._pkg) ?? s.data[s.variant].pkgs.find(p => p.dest === call?.fields.destination)
  const f = call?.fields ?? {}; const first = (f.name ?? 'there').split(' ')[0]; const agent = f._agent || 'Priya'
  const lead = s.data[s.variant].leads.find(l => l.callId === id); const score = call?.score ?? 0
  const now = call ? call.startedAt + call.durationSec * 1000 : Date.now()
  const summary = useMemo(() => v.id === 'travel'
    ? `Namaste ${first} ji 🙏 Wanderlust Holidays se ${s.settings.persona.travel}. Aapki call ka summary:\n• Trip: ${pkg?.name ?? f.destination} (${pkg?.duration ?? ''}), ${f.month ?? '—'}\n• Travellers: ${f.travellers ?? '—'} · Budget: ~${f.budget ?? '—'}\n• Callback: ${f.callback ?? '—'} — ${agent} aapko call karengi\n📎 ${brochureName(pkg)}.pdf\nKoi sawal ho toh yahin reply karein.`
    : `Namaste ${first} ji 🙏 ${v.name} se ${s.settings.persona[v.id]}.\n• ${v.labels.destination}: ${pkg?.name ?? f.destination}\n• ${v.labels.callback}: ${f.callback ?? '—'}\nDetails ke liye yahin reply karein.`, [call?.id, pkg?.id])
  const owner = `🔥 ${v.ownerWord} — ${f.destination ?? 'Enquiry'}${f.month ? ', ' + f.month : ''}\n${f.name ?? 'Caller'} · ${call?.callerPhone}\n${f.travellers ? f.travellers + ' travellers · ' : ''}${f.budget ? 'Budget ~' + f.budget + ' total · ' : ''}Score ${score}\nCallback: ${f.callback ?? '—'} → ${agent}\nSummary: ${call?.summary.slice(0, 90)}`
  const t = fmtTime(now + 3000)
  const caller: WaMsg[] = []; const ownerM: WaMsg[] = []
  if (step >= 2) caller.push({ id: 'a', from: 'them', text: summary, time: t, file: pkg ? { name: brochureName(pkg) + '.pdf', sub: '2 pages', onOpen: () => downloadBrochure(v, pkg) } : undefined })
  if (step >= 4) ownerM.push({ id: 'o', from: 'them', text: owner, time: t, action: { label: 'View transcript', onClick: () => nav('/calls/' + id) } })
  if (!call) return <div className="p-10 text-white/60">Call not found. <button className="btn ml-2" onClick={() => nav('/dashboard')}>Dashboard</button></div>
  const wa = s.presenter.prospectPhone.replace(/\D/g, '')
  const sendReal = () => { if (!wa) { s.say('Add the prospect WhatsApp number in Presenter (Ctrl + .) first'); return } window.open(`https://wa.me/${wa}?text=${encodeURIComponent(summary)}`, '_blank') }
  const strip = [['Saved to CRM', '2s'], ['Callback booked', '3s'], ['Brochure sent', '3s'], ['Owner alerted', '4s']]
  return <div className="p-6 max-w-6xl mx-auto">
    <h1 className="font-head text-2xl font-semibold mb-1">Call ended · everything sent in seconds</h1><p className="text-white/50 text-sm mb-4">{call.fields.name ?? 'Caller'} · {call.callerPhone} · {call.durationSec}s · {call.outcome}</p>
    <div className="h-[640px]"><Suspense fallback={<div className="h-full grid place-items-center text-white/30">Loading 3D phones…</div>}>
      <Phones w={330} h={640} className="w-full h-full" phones={[{ x: -2.1, label: "Caller's WhatsApp", node: <WhatsAppPhoneUI title={f.name ?? 'Caller'} sub="online" typing={step === 1} msgs={caller.map(m => ({ ...m, from: 'them' }))} h={640} /> }, { x: 2.1, label: "Owner's WhatsApp", node: <WhatsAppPhoneUI title="CallCatch Alerts" sub="business account" typing={step === 3} msgs={ownerM} h={640} /> }]} /></Suspense></div>
    <div className="flex flex-wrap gap-3 my-5 justify-center">{strip.map(([l, tm], i) => <div key={l} className={`chip transition ${step > i ? 'border-ok/40 text-ok' : 'opacity-40'}`}>{step > i && <Check size={13} />}{l} · {tm}</div>)}</div>
    <div className="flex flex-wrap gap-3 justify-center"><button className="btn btn-primary" onClick={sendReal}><ExternalLink size={16} />Send this summary to my real WhatsApp</button><button className="btn" onClick={() => nav('/dashboard')}><LayoutDashboard size={16} />Open dashboard</button>{pkg && <button className="btn" onClick={() => downloadBrochure(v, pkg)}>Download brochure PDF</button>}</div>
    {lead && <p className="text-center text-xs text-white/35 mt-4">Lead {lead.id} saved · {rupee(lead.budget)} pipeline · {VARIANTS[v.id].name}</p>}
    <p className="sr-only">{fmtDayLong(now)}</p>
  </div>
}
