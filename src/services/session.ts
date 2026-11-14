import { create } from 'zustand'
import type { Call, Lang, Lead, Turn } from '../types'
import { VARIANTS } from '../data'
import { useStore, nowOf } from '../store'
import { newState, respond, scoreWith, detectLang, type EngineState } from './engine'
import { buildChunks, search, type Hit } from './kb'
import { speak, cancelSpeech, openMic, closeMic, makeRecognizer, sttSupported, amp, micRms, type Recog } from './voice'
import { rupee, lakh, istParts } from '../lib/format'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'
export interface ToolChip { id: number; name: string; args: unknown; result: unknown; ms: number; at: number }
export interface Flight { id: number; name: string; target: string }
interface S {
  status: 'idle' | 'active' | 'ended'; mode: 'live' | 'typed' | 'auto'; orb: OrbState; turns: Turn[]; items: ({ k: 'turn'; t: Turn } | { k: 'tool'; c: ToolChip })[]
  tools: ToolChip[]; fields: Record<string, string>; score: number; reasons: { label: string; pts: number }[]; rag: { title: string; score: number }[]; guards: string[]
  caption: string; capIdx: number; capWho: 'riya' | 'caller'; latency: number; secs: number; lang: Lang; muted: boolean; shock: number; flights: Flight[]; phone: string; interim: string
  transferring: boolean; sttOk: boolean; banner: string
  start: (m: 'live' | 'typed' | 'auto') => Promise<void>; typed: (t: string) => void; end: () => string | null; mute: () => void; ptt: (down: boolean) => void
}
let token = 0, eng: EngineState = newState(), recog: Recog | null = null, timer = 0, startTs = 0, tid = 0, listening = false, pttHeld = false
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const rndPhone = () => `+91 98XXX XX${String(100 + Math.floor(Math.random() * 899))}`
const cfg = () => { const s = useStore.getState(); const v = VARIANTS[s.variant]; return { s, v, persona: s.settings.persona[s.variant] } }
const TARGET: Record<string, string> = { search_knowledge_base: 'panel-rag', create_lead: 'panel-lead', book_callback: 'panel-lead', send_whatsapp_brochure: 'panel-lead', transfer_to_human: 'panel-lead' }

export const useCall = create<S>((set, get) => {
  const addTurn = (who: 'riya' | 'caller', text: string, lang: Lang) => { const t: Turn = { who, text, lang, at: Date.now() }; set(s => ({ turns: [...s.turns, t], items: [...s.items, { k: 'turn', t }], lang })) }
  const addTool = (name: string, args: unknown, result: unknown, ms: number) => {
    const c: ToolChip = { id: ++tid, name, args, result, ms, at: Date.now() }
    set(s => ({ tools: [...s.tools, c], items: [...s.items, { k: 'tool', c }], shock: s.shock + 1, flights: [...s.flights, { id: c.id, name, target: TARGET[name] ?? 'panel-lead' }] }))
    useStore.getState().log(`tool ${name} ${ms}ms ${JSON.stringify(args)}`)
    setTimeout(() => set(s => ({ flights: s.flights.filter(f => f.id !== c.id) })), 1300)
  }
  const say = async (text: string, role: 'riya' | 'caller', my: number) => {
    const { s } = cfg()
    set({ orb: role === 'riya' ? 'speaking' : 'listening', caption: text, capIdx: 0, capWho: role })
    await speak(text, { role, voiceURI: s.settings.voiceURI, rate: s.settings.rate * (get().mode === 'auto' ? 1.3 : 1), onWord: i => { if (token === my) set({ capIdx: i }) } })
    if (token !== my) return
    set({ capIdx: text.length })
  }
  const setFields = (f: Record<string, string>) => set(s => ({ fields: { ...s.fields, ...f } }))
  const rescore = () => { const { s, v, persona } = cfg(); const r = scoreWith(eng, { v, pkgs: s.data[s.variant].pkgs, now: nowOf(), callSecs: get().secs, persona, afterHours: isAfter() }); set({ score: r.total, reasons: r.reasons }) }
  const isAfter = () => { const { v } = cfg(); const p = istParts(nowOf()); return !(v.hours.days.includes(p.dow) && v.hours.ranges.some(([a, b]) => p.h >= a && p.h < b)) }

  const listen = () => {
    const my = token; if (get().status !== 'active' || get().mode !== 'live' || get().muted || listening) return
    const { s } = cfg(); set({ orb: 'listening', interim: '' })
    recog = makeRecognizer(s.settings.sttLang, (t, fin) => { if (token !== my) return; set({ interim: t }); if (fin) { listening = false; set({ interim: '' }); handle(t) } }, () => {
      if (token !== my) return; const wasListening = listening; listening = false
      if (wasListening && get().status === 'active' && get().orb === 'listening') setTimeout(listen, 250)
    })
    if (recog) { listening = true; try { recog.start() } catch { listening = false } }
  }
  const handle = async (text: string) => {
    const my = token; const { s, v, persona } = cfg(); const sl = s.data[s.variant]
    cancelSpeech(); listening = false; try { recog?.abort() } catch {}
    addTurn('caller', text, detectLang(text)); set({ orb: 'thinking', caption: '' }); s.log(`stt "${text}"`)
    const t0 = performance.now(); await sleep(500 + Math.random() * 400); if (token !== my) return
    const r = respond(eng, text, { v, pkgs: sl.pkgs, now: nowOf(), callSecs: get().secs, persona, afterHours: isAfter() })
    const lat = (performance.now() - t0) / 1000; set({ latency: +lat.toFixed(1) })
    const f: Record<string, string> = {}; for (const k of r.newFields) if (eng.slots[k]) f[k] = eng.slots[k]; setFields(f)
    for (const t of r.tools) addTool(t.name, t.args, t.result, t.ms)
    if (r.hits[0] && r.hits[0].score > 0) set({ rag: r.hits.map(h => ({ title: h.chunk.title, score: h.score })) })
    if (r.guardrail) set(s => ({ guards: [...s.guards, r.guardrail!] }))
    rescore(); addTurn('riya', r.reply, 'MIX'); await say(r.reply, 'riya', my); if (token !== my) return
    if (r.transfer) { set({ transferring: true }); await sleep(2200); if (token !== my) return }
    if (r.end) { set({ orb: 'idle' }); await sleep(600); if (token === my) window.dispatchEvent(new CustomEvent('callcatch-ended')); return }
    set({ orb: 'idle' }); if (get().mode === 'live') listen()
  }

  const fill = (t: string) => { const { s } = cfg(); const sl = s.data[s.variant]
    return t.replace(/\{price:([\w-]+)\}/g, (_, id) => rupee(sl.pkgs.find(p => p.id === id)?.price ?? 0)).replace(/\{total:([\w-]+):(\d+)\}/g, (_, id, n) => lakh((sl.pkgs.find(p => p.id === id)?.price ?? 0) * +n)) }
  const autoplay = async (my: number) => {
    const { v } = cfg(); const sl = cfg().s.data[cfg().s.variant]; void sl
    for (const step of v.script) {
      if (token !== my) return
      const text = fill(step.text)
      if (step.who === 'riya') { set({ orb: 'speaking' }); addTurn('riya', text, 'MIX'); await say(text, 'riya', my) }
      else {
        set({ orb: 'listening' }); await sleep(250); addTurn('caller', text, step.lang ?? detectLang(text)); await say(text, 'caller', my); if (token !== my) return
        set({ orb: 'thinking', caption: '' }); const lat = 0.6 + Math.random() * 0.3; await sleep(lat * 900); if (token !== my) return; set({ latency: +lat.toFixed(1) })
        if (step.fields) { setFields(step.fields); for (const [k, val] of Object.entries(step.fields)) { eng.slots[k] = val; if (k === 'travellers') eng.travellers = +val; if (k === 'budget') eng.budgetInr = +val.replace(/\D/g, '') } }
        if (step.fields?.callback) eng.callbackAt = nowOf() + 86400000
        if (step.tool) addTool(step.tool.name, step.tool.args, step.tool.result, step.tool.ms)
        if (step.kb) { const kb = step.kb; set({ rag: [kb] }) }
        if (step.guardrail) set(s => ({ guards: [...s.guards, step.guardrail!] }))
        rescore()
      }
      await sleep(250)
    }
    if (token === my) { set({ orb: 'idle' }); await sleep(700); window.dispatchEvent(new CustomEvent('callcatch-ended')) }
  }

  return {
    status: 'idle', mode: 'typed', orb: 'idle', turns: [], items: [], tools: [], fields: {}, score: 0, reasons: [], rag: [], guards: [], caption: '', capIdx: 0, capWho: 'riya', latency: 0, secs: 0, lang: 'MIX', muted: false, shock: 0, flights: [], phone: '', interim: '', transferring: false, sttOk: true, banner: '',
    start: async mode => {
      token++; const my = token; cancelSpeech(); eng = newState(); listening = false
      const { s, v, persona } = cfg(); let m = mode; let banner = ''
      if (m === 'live') { const ok = await openMic(); if (!sttSupported()) { m = 'typed'; banner = 'Speech recognition is not available in this browser (try Chrome). Switched to typed input.' } else if (!ok) { m = 'typed'; banner = 'Microphone permission was denied. Switched to typed input.' } }
      const phone = m === 'auto' ? (v.script.find(x => x.tool?.name === 'create_lead')?.tool?.args as any)?.phone ?? rndPhone() : rndPhone()
      set({ status: 'active', mode: m, orb: 'speaking', turns: [], items: [], tools: [], fields: { phone }, score: 0, reasons: [], rag: [], guards: [], caption: '', capIdx: 0, latency: 0, secs: 0, muted: false, phone, transferring: false, banner, interim: '', flights: [] })
      startTs = Date.now(); clearInterval(timer); timer = window.setInterval(() => set({ secs: Math.floor((Date.now() - startTs) / 1000) }), 500)
      s.log(`call start mode=${m} variant=${v.id} engine=${s.settings.engine}${s.settings.engine === 'live' ? ' (no API key → ScriptedEngine fallback)' : ''}`)
      if (m === 'auto') return autoplay(my)
      const g = v.greeting.replace(/Riya|Asha|Neha/, persona); addTurn('riya', g, 'MIX'); await say(g, 'riya', my); if (token !== my) return
      set({ orb: 'idle' }); if (m === 'live') listen()
    },
    typed: t => { if (get().status === 'active' && t.trim()) handle(t.trim()) },
    mute: () => { const m = !get().muted; set({ muted: m }); if (m) { try { recog?.abort() } catch {} ; listening = false; if (get().orb === 'listening') set({ orb: 'idle' }) } else listen() },
    ptt: down => { if (get().mode !== 'live') return; if (down && !pttHeld) { pttHeld = true; cancelSpeech(); listening = false; try { recog?.abort() } catch {} ; set({ muted: false }); setTimeout(listen, 120) } else if (!down) { pttHeld = false; try { recog?.stop() } catch {} } },
    end: () => {
      if (get().status !== 'active') return null
      const my = token; token++; cancelSpeech(); try { recog?.abort() } catch {}; closeMic(); clearInterval(timer); void my
      const g = get(); const { s, v, persona } = cfg(); const secs = Math.max(g.secs, 5); const f = { ...g.fields }
      const transferred = g.tools.some(t => t.name === 'transfer_to_human')
      const captured = !!(f.name && f.destination)
      const outcome: Call['outcome'] = transferred ? 'Transferred' : captured ? 'Lead captured' : 'FAQ only'
      const id = 'C-' + (3000 + Math.floor(Math.random() * 6000)); const now = Date.now()
      const pkg = s.data[s.variant].pkgs.find(p => p.id === (eng.pkgId ?? (g.tools.find(t => t.name === 'send_whatsapp_brochure')?.args as any)?.package_id)) ?? s.data[s.variant].pkgs.find(p => p.dest === f.destination)
      const summary = captured ? `${f.name} enquired about ${pkg?.name ?? f.destination}${f.month ? ' for ' + f.month : ''}${f.travellers ? ', ' + f.travellers + ' travellers' : ''}${f.budget ? ', budget ~' + f.budget : ''}. ${f.callback ? v.callbackWord[0].toUpperCase() + v.callbackWord.slice(1) + ' booked for ' + f.callback + '.' : ''}` : transferred ? 'Caller asked to speak to a human and was transferred.' : 'General enquiry answered from the knowledge base.'
      const call: Call = { id, businessId: v.id, direction: 'inbound', callerPhone: g.phone, startedAt: now - secs * 1000, durationSec: secs, outcome, recordingUrl: `rec/${id}.wav`, transcript: g.turns, summary, cost: +(secs / 60 * s.settings.costPerMin).toFixed(2), fields: { ...f, _pkg: pkg?.id ?? '', _agent: eng.agent ?? 'Priya' }, tools: g.tools.map(t => ({ name: t.name, args: t.args, result: t.result, ms: t.ms, at: t.at })), sentiment: 'positive', afterHours: isAfter(), lang: g.lang, isNew: true, score: g.score }
      s.addCall(call); s.markNew(id)
      if (captured) { const lead: Lead = { id: ((g.tools.find(t => t.name === 'create_lead')?.result as any)?.lead_id) ?? 'L-' + Math.floor(Math.random() * 9000), callId: id, businessId: v.id, name: f.name, phone: g.phone, need: f, budget: eng.budgetInr || pkg?.price || 0, score: g.score, stage: 'New', source: 'AI call', callbackAt: eng.callbackAt, createdAt: now }; s.addLead(lead) }
      set({ status: 'ended', orb: 'idle', flights: [] }); void persona
      return id
    },
  }
})
void amp; void micRms; void search; void buildChunks; void (null as unknown as Hit)
