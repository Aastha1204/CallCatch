import { useEffect, useRef } from 'react'
import { FileText, Check, CheckCheck, MessageCircle } from 'lucide-react'

export interface WaMsg { id: string; from: 'them' | 'me'; text: string; time: string; ticks?: 'sent' | 'delivered' | 'read'; file?: { name: string; sub: string; onOpen: () => void }; buttons?: { label: string; onClick: () => void }[]; action?: { label: string; onClick: () => void } }
export function WhatsAppPhoneUI({ title, sub, msgs, typing, w = 330, h = 600, input }: { title: string; sub: string; msgs: WaMsg[]; typing?: boolean; w?: number; h?: number; input?: { placeholder: string; onSend: (t: string) => void } }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs.length, typing])
  return <div style={{ width: w, height: h }} className="flex flex-col rounded-[22px] overflow-hidden bg-[#0B141A] text-[13px] text-[#e9edef] select-none">
    <div className="bg-[#075E54] px-3 py-2.5 flex items-center gap-2.5"><span className="w-8 h-8 rounded-full bg-[#25D366] grid place-items-center text-[#063]"><MessageCircle size={16} /></span><div><div className="font-semibold leading-4">{title}</div><div className="text-[11px] text-white/70">{typing ? 'typing…' : sub}</div></div></div>
    <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
      {msgs.map(m => <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}><div className="max-w-[86%]">
        <div className={`rounded-lg px-2.5 py-1.5 whitespace-pre-wrap leading-[1.35] ${m.from === 'me' ? 'bg-[#005C4B]' : 'bg-[#202C33]'}`}>
          {m.text}
          {m.file && <button onClick={m.file.onOpen} className="mt-1.5 w-full flex items-center gap-2 rounded-md bg-black/25 p-2 text-left hover:bg-black/40"><span className="w-8 h-9 rounded bg-[#FF5A5F] grid place-items-center"><FileText size={16} /></span><span><b className="block text-[12px] break-all">{m.file.name}</b><span className="text-[11px] text-white/60">{m.file.sub} · tap to download</span></span></button>}
          <div className="text-[10px] text-white/50 text-right mt-0.5 flex justify-end items-center gap-1">{m.time}{m.from === 'me' && (m.ticks === 'sent' ? <Check size={12} /> : <CheckCheck size={13} className={m.ticks === 'read' ? 'text-[#53bdeb]' : 'text-white/50'} />)}</div>
        </div>
        {m.buttons && <div className="mt-1 space-y-1">{m.buttons.map(b => <button key={b.label} onClick={b.onClick} className="w-full rounded-lg bg-[#202C33] py-2 text-[#53bdeb] font-medium hover:bg-[#2a3942]">{b.label}</button>)}</div>}
        {m.action && <button onClick={m.action.onClick} className="mt-1 w-full rounded-lg bg-[#202C33] py-2 text-[#53bdeb] font-medium hover:bg-[#2a3942]">{m.action.label}</button>}
      </div></div>)}
      {typing && <div className="flex"><div className="bg-[#202C33] rounded-lg px-3 py-2 flex gap-1">{[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: i * 0.15 + 's' }} />)}</div></div>}
      <div ref={end} />
    </div>
    {input ? <form className="bg-[#1f2c34] p-2 flex gap-2" onSubmit={e => { e.preventDefault(); const f = e.currentTarget.elements.namedItem("m") as HTMLInputElement; if (f.value.trim()) { input.onSend(f.value.trim()); f.value = "" } }}><input name="m" autoComplete="off" placeholder={input.placeholder} className="flex-1 !rounded-full !bg-[#2a3942] !border-0 text-[13px]" /><button className="w-9 h-9 rounded-full bg-[#25D366] text-[#063] font-bold">➤</button></form> : <div className="bg-[#1f2c34] px-3 py-2 text-white/40 text-[12px]">Message</div>}
  </div>
}
