import type { Lang } from '../types'
import type { Variant } from '../data'
import { GRIEF } from '../data'
import { buildChunks, search, unknownTerms, type Hit } from './kb'
import { rupee, lakh, istParts, istDate, fmtDayLong, fmtTime, fmtDay } from '../lib/format'
import type { Pkg } from '../types'

export interface ToolEvt { name: string; args: unknown; result: unknown; ms: number }
export interface EngineState { slots: Record<string, string>; budgetInr: number; travellers: number; stage: 'collect' | 'brochure' | 'more' | 'done'; leadId?: string; booked: boolean; sent: boolean; asked?: string; pkgId?: string; callbackAt?: number; agent?: string; score?: number; turns: number }
export interface EngineReply { reply: string; lang: Lang; tools: ToolEvt[]; hits: Hit[]; guardrail?: string; newFields: string[]; end?: boolean; transfer?: boolean; intent: string }
export interface Ctx { v: Variant; pkgs: Pkg[]; now: number; callSecs: number; persona: string; afterHours: boolean }

export const newState = (): EngineState => ({ slots: {}, budgetInr: 0, travellers: 0, stage: 'collect', booked: false, sent: false, turns: 0 })

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const NUM: Record<string, number> = { ek: 1, एक: 1, one: 1, do: 2, दो: 2, two: 2, teen: 3, तीन: 3, three: 3, chaar: 4, char: 4, चार: 4, four: 4, paanch: 5, panch: 5, पांच: 5, five: 5, chhe: 6, che: 6, chah: 6, छह: 6, six: 6, saat: 7, सात: 7, seven: 7, aath: 8, आठ: 8, eight: 8, nau: 9, नौ: 9, nine: 9, das: 10, दस: 10, ten: 10, gyarah: 11, barah: 12, eleven: 11, twelve: 12 }
const MON: [RegExp, string][] = [[/\b(jan|january|janvari)\b|जनवरी/, 'January'], [/\b(feb|february|farvari)\b|फरवरी/, 'February'], [/\b(mar|march)\b|मार्च/, 'March'], [/\b(apr|april)\b|अप्रैल/, 'April'], [/\b(may)\b|\bmai\b|मई/, 'May'], [/\b(jun|june)\b|जून/, 'June'], [/\b(jul|july)\b|जुलाई/, 'July'], [/\b(aug|august)\b|अगस्त/, 'August'], [/\b(sep|sept|september)\b|सितंबर/, 'September'], [/\b(oct|october)\b|अक्टूबर/, 'October'], [/\b(nov|november)\b|नवंबर/, 'November'], [/\b(dec|december|disambar)\b|दिसंबर|दिसम्बर/, 'December'], [/diwali|दिवाली/, 'November']]
const DEVA = /[ऀ-ॿ]/
const HI_WORDS = /\b(hai|hain|kya|mein|me|kitna|kitne|chahiye|hum|log|ka|ki|ke|nahi|haan|karo|kal|abhi|bhej|dijiye|batao|aapka|mera|naam|baje|subah|shaam|theek|accha|lakh|hazaar|dedh|dhai)\b/i

export function detectLang(t: string): Lang {
  const hi = DEVA.test(t) || HI_WORDS.test(t)
  const en = /\b(the|is|what|how|price|trip|please|hi|hello|thanks|thank|book|yes|no|budget|and|for|with|i|we|am)\b/i.test(t)
  if (hi && en) return 'MIX'; if (hi) return 'HI'; return 'EN'
}

export function parseTravellers(t: string): number | 0 {
  const s = t.toLowerCase()
  let m = s.match(/(\d+)\s*(?:adults?)\s*(?:and|\+|&|aur)?\s*(\d+)\s*(?:kids?|child(?:ren)?|bachche)/); if (m) return +m[1] + +m[2]
  m = s.match(/(?:family of|group of)\s*(\d+)/); if (m) return +m[1]
  m = s.match(/(\d+)\s*(?:log|people|persons?|pax|members?|travellers?|travelers?|adults?)/); if (m) return +m[1]
  if (/\bhum do\b|\bwe are two\b|couple|honeymoon|हम दो/.test(s)) return 2
  for (const [w, n] of Object.entries(NUM)) if (new RegExp(`(^|\\s)${w}\\s*(log|people|persons?|members?|adults?|जन)`, 'i').test(s)) return n
  m = s.match(/^\s*(\d{1,2})\s*$/); if (m) return +m[1]
  return 0
}
export function parseMonth(t: string): string { const s = t.toLowerCase(); for (const [re, n] of MON) if (re.test(s)) return n; return '' }
export function parseBudget(t: string, travellers: number): number {
  const s = t.toLowerCase().replace(/,/g, '')
  let val = 0
  if (/dedh lakh|डेढ़ लाख|डेढ लाख/.test(s)) val = 150000
  else if (/dhai lakh|ढाई लाख/.test(s)) val = 250000
  else { let m = s.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|लाख)/); if (m) val = +m[1] * 100000
    else if ((m = s.match(/(\d+(?:\.\d+)?)\s*(?:hazaar|hazar|hajar|k\b|thousand|हज़ार|हजार)/))) val = +m[1] * 1000
    else if ((m = s.match(/(?:₹|rs\.?|inr)\s*(\d{4,8})/))) val = +m[1]
    else if ((m = s.match(/budget[^\d]{0,15}(\d{4,8})/))) val = +m[1] }
  if (val && /per person|per head|pp\b|har ek|प्रति/.test(s)) val *= Math.max(1, travellers)
  return val
}
export function parseName(t: string, asked: boolean): string {
  const cap = (x: string) => x.trim().split(/\s+/).slice(0, 3).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
  let m = t.match(/(?:mera naam|my name is|naam|name is|this is|i am|i'm|main)\s+([A-Za-zऀ-ॿ]+(?:\s+[A-Za-zऀ-ॿ]+)?)\s*(?:hai|hoon|hun|bol raha|bol rahi|here|speaking)?/i)
  if (m && !/^(interested|looking|calling|want|chahta|chahti|ek|do|teen|char|chaar|kashmir|goa|dubai|bali)/i.test(m[1])) return cap(m[1].replace(/\s+(hai|hoon|hun|bol|here)$/i, ''))
  if (asked && /^[A-Za-zऀ-ॿ]+(\s+[A-Za-zऀ-ॿ]+)?\.?$/.test(t.trim()) && !/^(yes|no|haan|nahi|ok|okay|thanks|theek)/i.test(t.trim())) return cap(t.replace('.', ''))
  return ''
}
const DOW: [RegExp, number][] = [[/sunday|ravivar|ravivaar|रविवार/i, 0], [/monday|somvar|somvaar|सोमवार/i, 1], [/tuesday|mangalvar|mangalvaar|मंगलवार/i, 2], [/wednesday|budhvar|budhvaar|बुधवार/i, 3], [/thursday|guruvar|guruvaar|brihaspati|गुरुवार/i, 4], [/friday|shukravar|shukravaar|शुक्रवार/i, 5], [/saturday|shanivar|shanivaar|shaniwar|शनिवार/i, 6]]

export function parseCallback(t: string, now: number, v: Variant): { at: number; adjusted: boolean } | null {
  const s = t.toLowerCase(); const p = istParts(now)
  let off = -1
  if (/\bparso\b|day after|परसों/.test(s)) off = 2; else if (/\bkal\b|tomorrow|कल/.test(s)) off = 1; else if (/\baaj\b|today|आज/.test(s)) off = 0
  if (off < 0) for (const [re, d] of DOW) if (re.test(s)) { off = (d - p.dow + 7) % 7; if (off === 0) off = 7; break }
  let hour = -1
  const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|bje|vajta|वाजता|बजे)?/)
  const pm = /pm|shaam|sandhya|sandhyakali|evening|raat|dopahar|afternoon|शाम/.test(s); const am = /am|subah|morning|सुबह/.test(s)
  if (m && (m[3] || off >= 0 || am || pm) && +m[1] <= 12 && +m[1] >= 1) { hour = +m[1]; if (pm && hour < 12) hour += 12; if (!pm && hour < 7 && !am) hour += 12 }
  if (hour < 0 && (pm || am)) hour = pm ? 17 : 11
  if (hour < 0 && off < 0) return null
  if (off < 0) off = 1; if (hour < 0) hour = 11
  let at = istDate(p.y, p.mo, p.d + off, hour, 0); let adjusted = false
  for (let i = 0; i < 400; i++) { const q = istParts(at); const okDay = v.hours.days.includes(q.dow); const okH = v.hours.ranges.some(([a, b]) => q.h >= a && q.h < b)
    if (okDay && okH) break; adjusted = true; at += 3600_000 }
  return { at, adjusted }
}
export function matchDest(t: string, v: Variant): string { const s = t.toLowerCase(); for (const d of v.destinations) if (d.aliases.some(a => s.includes(a))) return d.name; return '' }

/** deterministic mock calendar: ~30% of slots pre-booked */
export function bookSlot(at: number) {
  let t = at; const agents = ['Priya', 'Rohit']
  for (let i = 0; i < 60; i++) { const h = Math.floor(t / 3600000); const busy = ((h * 2654435761) >>> 0) % 100 < 30
    if (!busy) return { at: t, agent: agents[h % 2], moved: t !== at }; t += 3600_000 }
  return { at, agent: 'Priya', moved: false }
}

const INTENTS: [string, RegExp][] = [
  ['spam', /\b(loan offer|credit card offer|insurance policy|lottery|click the link)\b/i],
  ['talk_to_human', /\b(human|insaan|agent se|manager|real person|talk to someone|transfer)\b|baat karni|किसी से बात/i],
  ['complaint', /\b(complaint|shikayat|worst|bad service|refund|cheated|dhokha)\b/i],
  ['goodbye', /\b(bye|goodbye|that's all|thats all|nothing else|nahi, thank|nahi thank|no thanks|no thank|nahi dhanyavaad|dhanyavaad|thank you|thanks)\b|^(nahi|no)\b/i],
  ['visa', /\b(visa|vija)\b|वीज़ा/i],
  ['payment_options', /\b(payment|pay|upi|emi|card|installment)\b/i],
  ['office_timings', /\b(timing|timings|office hours|kab khulta|kab tak|open|band)\b/i],
  ['location', /\b(address|location|kahan|kaha|where)\b|पता/i],
  ['inclusions', /\b(include|included|inclusions|includes|kya kya|shamil|milega|milegi|covered)\b/i],
  ['package_price_or_info', /\b(price|rate|cost|kitna|kitne|kimat|daam|charge|package|plan|starting|starts|info|details)\b|कीमत|कितना/i],
  ['callback_request', /\b(callback|call back|call me|phone karo|baad mein call)\b/i],
]
export function intentOf(t: string): string { for (const [k, re] of INTENTS) if (re.test(t)) return k; return 'unknown' }

function need(st: EngineState, v: Variant) { return v.slots.find(k => !st.slots[k]) }

function askFor(slot: string, v: Variant, st: EngineState, ctx: Ctx): string {
  const nm = st.slots.name ? st.slots.name.split(' ')[0] + ' ji' : ''
  if (v.id === 'clinic') { if (slot === 'destination') return 'Kaunsa treatment chahiye — cleaning, filling, root canal ya braces?'; if (slot === 'callback') return 'Appointment kab chahiye? Din aur time bata dijiye.'; if (slot === 'name') return 'Aapka naam bata dijiye?' }
  if (v.id === 'realestate') { if (slot === 'destination') return 'Aap 1 BHK dekh rahe hain ya 2 BHK?'; if (slot === 'callback') return 'Site visit kab karna chahenge? Din aur time bata dijiye.'; if (slot === 'name') return 'Aapka naam bata dijiye?' }
  switch (slot) {
    case 'destination': return pick(['Aap kahan jaana chahte hain — Kashmir, Kerala, Goa, Dubai, Thailand ya Bali?', 'Kaunsi destination soch rahe hain aap?'])
    case 'month': return pick(['Kis mahine mein travel karna hai?', 'Travel kab plan kar rahe hain — kaunsa month?'])
    case 'travellers': return pick(['Kitne log travel kar rahe hain?', 'Total kitne travellers honge?'])
    case 'budget': return pick(['Total budget kitna soch rahe hain aap?', 'Approximate budget kya rahega?'])
    case 'name': return pick(['Aapka naam bata dijiye?', 'Aapka shubh naam kya hai?'])
    case 'callback': void nm; return `${ctx.afterHours ? 'Abhi office band hai — ' : ''}hamari agent aapko call kare? Kaunsa din aur time theek rahega?`
  }
  return 'Aur kuch bataiye.'
}

export function respond(st: EngineState, text: string, ctx: Ctx): EngineReply {
  const { v } = ctx; const lang = detectLang(text); const tools: ToolEvt[] = []; const newFields: string[] = []
  const chunks = buildChunks(v, ctx.pkgs); const t = text.trim(); st.turns++
  const intent = intentOf(t); const asked = st.asked === 'name'
  // slot filling (multi-slot per utterance)
  const dest = matchDest(t, v); if (dest && st.slots.destination !== dest) { st.slots.destination = dest; newFields.push('destination') }
  if (v.slots.includes('month')) { const mo = parseMonth(t); if (mo && !st.slots.month) { st.slots.month = mo; newFields.push('month') } }
  if (v.slots.includes('travellers')) { const n = parseTravellers(asked ? '' : st.asked === 'travellers' ? t : t); if (n && n <= 30 && !st.slots.travellers) { st.travellers = n; st.slots.travellers = String(n); newFields.push('travellers') } }
  if (v.slots.includes('budget')) { const b = parseBudget(t, st.travellers); if (b && !st.slots.budget) { st.budgetInr = b; st.slots.budget = rupee(b); newFields.push('budget') } }
  const nm = parseName(t, asked); if (nm && !st.slots.name) { st.slots.name = nm; newFields.push('name') }
  const cb = parseCallback(t, ctx.now, v)
  let cbNote = ''
  if (cb && !st.slots.callback && (st.asked === 'callback' || intent === 'callback_request' || /baje|am|pm|kal|parso|subah|shaam|sandhya|sunday|monday|saturday/i.test(t)) && v.slots.includes('callback')) {
    const b = bookSlot(cb.at); st.callbackAt = b.at; st.agent = b.agent; st.slots.callback = `${fmtDay(b.at)} ${fmtTime(b.at)}`; newFields.push('callback')
    if (cb.adjusted || b.moved) cbNote = `Wo slot available nahi tha, nearest ${fmtDayLong(b.at)} ${fmtTime(b.at)} ka slot book kiya hai. `
  }
  const pkgFor = (): Pkg | undefined => {
    const d = st.slots.destination; if (!d) return
    const c = ctx.pkgs.filter(p => p.dest === d); if (!c.length) return
    const mo = st.slots.month?.slice(0, 3)
    return (mo && c.find(p => p.best.includes(mo) || bestRange(p.best, mo))) || c[0]
  }
  const total = (p: Pkg) => st.travellers && v.id === 'travel' ? ` yaani ${st.travellers} logon ke liye lagbhag ${lakh(p.price * st.travellers)}` : ''
  let reply = ''; let guardrail: string | undefined; let hits = search(t + ' ' + (st.slots.destination || ''), chunks)
  let end = false; let transfer = false

  const pushTool = (name: string, args: unknown, result: unknown) => tools.push({ name, args, result, ms: 120 + Math.round(Math.random() * 260) })
  if (intent === 'goodbye' && st.stage !== 'collect') { end = true; st.stage = 'done'; reply = `Thank you${st.slots.name ? ' ' + st.slots.name.split(' ')[0] + ' ji' : ''}, aapka din shubh rahe. Bye!` }
  else if (intent === 'spam') { end = true; reply = 'Maaf kijiye, humein yeh service chahiye nahi. Dhanyavaad, bye.' }
  else if (intent === 'talk_to_human') {
    if (ctx.afterHours) { reply = 'Abhi office band hai, isliye transfer nahi kar sakti — main aapka callback book kar deti hoon.'; if (!st.slots.callback) st.asked = 'callback' }
    else { transfer = true; end = true; reply = 'Zaroor, main aapko Priya se connect kar rahi hoon. Ek minute…'; pushTool('transfer_to_human', { reason: 'caller_request' }, { status: 'ringing', agent: 'Priya' }) }
  } else if (intent === 'complaint') { reply = 'Mujhe sunke afsos hua. Main aapko hamare manager se connect karwati hoon, woh jald call karenge.'; if (!ctx.afterHours) { transfer = true; end = true; pushTool('transfer_to_human', { reason: 'complaint' }, { status: 'ringing' }) } }
  else if (st.stage === 'brochure' && /haan|yes|ha\b|bhej|send|sure|ok|please|zaroor/i.test(t)) {
    const p = pkgFor(); st.sent = true; st.stage = 'more'
    pushTool('send_whatsapp_brochure', { lead_id: st.leadId, package_id: p?.id }, { message_id: 'wamid.' + Math.random().toString(36).slice(2, 10), status: 'sent' })
    reply = 'Bhej diya! Aur kuch madad chahiye?'
  } else if (st.stage === 'brochure') { st.stage = 'more'; reply = 'Theek hai. Aur kuch madad chahiye?' }
  else if (st.stage === 'more' && !['package_price_or_info', 'inclusions'].includes(intent)) { end = true; reply = `Thank you${st.slots.name ? ' ' + st.slots.name.split(' ')[0] + ' ji' : ''}, aapka din shubh rahe. Bye!` }
  else {
    const unknown = unknownTerms(t, chunks); const top = hits[0]
    const asksFact = ['inclusions', 'package_price_or_info', 'unknown', 'visa', 'payment_options'].includes(intent)
    if (asksFact && (unknown.length > 0 && !newFields.length || (top && top.score < 0.35 && intent !== 'unknown' && !newFields.length))) {
      guardrail = `Unverified: ${unknown.slice(0, 2).join(' / ') || 'requested fact'} → deferred to expert ✓`; reply = GRIEF
    } else if (intent === 'inclusions' && pkgFor()) { const p = pkgFor()!; reply = `${p.name} mein ${p.highlights.replace(/;/g, ',')} included hai.` }
    else if (intent === 'package_price_or_info' || (newFields.includes('destination') && st.slots.destination)) {
      const p = pkgFor()
      if (p) { st.pkgId = p.id; hits = search(`${p.name} price`, chunks)
        pushTool('search_knowledge_base', { query: `${(st.slots.destination || '').toLowerCase()} ${(st.slots.month || '').toLowerCase()} price`.trim() }, { top: hits.map(h => ({ doc: h.chunk.title, score: h.score })) })
        reply = v.id === 'travel' ? `${st.slots.month ? st.slots.month + ' ke liye ' : ''}${p.name} best rahega — ${p.duration.replace(/(\d+)N\/(\d+)D/, '$1 raatein, $2 din')}. Starting ${rupee(p.price)} per person, twin sharing,${total(p)}.`
          : v.id === 'clinic' ? `${p.name} ${p.price ? (p.id === 'filling' || p.id === 'rct' ? rupee(p.price) + ' se start' : rupee(p.price)) : 'free'} hai.` : `${p.name} ${rupee(p.price).replace(/₹[\d,]+/, lakh(p.price))} se start hota hai; final all-inclusive price hamari sales team confirm karegi.` }
    } else if (intent === 'payment_options') reply = chunks.find(c => c.title === 'Payment options')?.text.replace(/^Payment options /, '') ?? GRIEF
    else if (intent === 'visa') reply = v.id === 'travel' ? 'Dubai, Thailand aur Bali ke liye visa help milti hai. Exact documents hamara visa desk confirm karega.' : GRIEF
    else if (intent === 'office_timings') reply = `Hamari timing ${v.hours.label} hai.`
    else if (intent === 'location') reply = v.info.find(i => /Address|Site/.test(i.k))?.v ?? GRIEF
    else if (!newFields.length && st.turns > 0 && intent === 'unknown' && !need(st, v)) { guardrail = 'Unverified: out-of-scope question → deferred to expert ✓'; reply = GRIEF }
  }
  if (!end && !reply) reply = ''
  // tool: create_lead / book_callback
  if (!end) {
    if (!st.leadId && st.slots.name && st.slots.destination) {
      st.leadId = 'L-' + (2000 + Math.floor(Math.random() * 900)); st.score = score(st, ctx)
      pushTool('create_lead', { name: st.slots.name, need: { destination: st.slots.destination, month: st.slots.month, travellers: st.travellers, budget_inr: st.budgetInr }, source: 'AI call' }, { lead_id: st.leadId, score: st.score })
      newFields.push('lead')
    }
    if (st.leadId && st.callbackAt && !st.booked) { st.booked = true
      pushTool('book_callback', { lead_id: st.leadId, preferred_slot: `${fmtDay(st.callbackAt)} ${fmtTime(st.callbackAt)} IST` }, { status: 'confirmed', slot: st.slots.callback, assigned_to: st.agent }) }
    if (st.booked && st.stage === 'collect') {
      st.stage = 'brochure'
      reply = (reply ? reply + ' ' : '') + `${cbNote}Done! ${fmtDayLong(st.callbackAt!)} ${fmtTime(st.callbackAt!)} ${v.id === 'travel' ? (st.agent || 'Priya') + ' aapko call karengi' : v.id === 'clinic' ? 'aapka appointment confirm hai' : 'aapki site visit book ho gayi'}. ${v.id === 'travel' ? 'Brochure' : 'Details'} WhatsApp pe bhej doon?`
    } else if (st.stage === 'collect') {
      const n = need(st, v)
      if (n) { st.asked = n; reply = (reply ? reply + ' ' : (newFields.length ? ack(newFields, st) : '')) + askFor(n, v, st, ctx) }
      else if (!reply) reply = 'Samajh gayi. Kuch aur bataiye?'
    }
  }
  return { reply: reply.trim(), lang: lang === 'EN' && !/[a-z]/.test(reply) ? 'HI' : lang, tools, hits, guardrail, newFields, end, transfer, intent }
}
function ack(f: string[], st: EngineState) { if (f.includes('budget')) return 'Perfect, yeh budget note kar liya. '; if (f.includes('name')) return `Thank you ${st.slots.name.split(' ')[0]} ji. `; return pick(['Theek hai. ', 'Samajh gayi. ', 'Got it. ']) }
function bestRange(best: string, mo: string) { const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; const m = best.match(/([A-Z][a-z]{2})–([A-Z][a-z]{2})/); if (!m) return false
  let a = M.indexOf(m[1]); const b = M.indexOf(m[2]); const x = M.indexOf(mo); for (let i = 0; i < 12; i++) { if ((a + i) % 12 === x) return true; if ((a + i) % 12 === b) break } return false }
export function score(st: EngineState, ctx: Ctx) { return scoreWith(st, ctx).total }
export function scoreWith(st: EngineState, ctx: Ctx): { total: number; reasons: { label: string; pts: number }[] } {
  const r: { label: string; pts: number }[] = []; const pkg = ctx.pkgs.find(p => p.dest === st.slots.destination)
  if (st.travellers >= 4) r.push({ label: `${st.travellers} travellers`, pts: 20 })
  if (st.budgetInr >= 120000) r.push({ label: 'Budget ≥ ₹1.2L', pts: 25 })
  const mi = st.slots.month ? ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(st.slots.month) : -1
  if (mi >= 0) { const cur = istParts(ctx.now).mo; if (((mi - cur + 12) % 12) <= 2) r.push({ label: 'Travel within 60 days', pts: 15 }) }
  if (st.callbackAt) r.push({ label: 'Asked for callback', pts: 15 })
  if (pkg?.intl) r.push({ label: 'International destination', pts: 10 })
  if (ctx.callSecs > 90) r.push({ label: 'Engaged > 90s', pts: 10 })
  if (ctx.v.id !== 'travel' && st.slots.destination) r.push({ label: 'Clear intent', pts: 30 }), (st.callbackAt && r.push({ label: 'Booked slot', pts: 25 }))
  return { total: Math.min(100, r.reduce((a, x) => a + x.pts, 0)), reasons: r }
}
