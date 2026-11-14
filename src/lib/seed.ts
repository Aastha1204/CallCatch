import type { Call, Lead, MissedCall, Outcome, Turn, Stage, VariantId, Pkg } from '../types'
import { VARIANTS, FIRST_NAMES, LAST_NAMES } from '../data'
import { rng, istParts, istDate, rupee } from './format'

const MONTHS = ['December', 'January', 'October', 'November', 'May', 'June', 'April']
export function seedFor(id: VariantId, now: number, costPerMin = 6.5, pkgs?: Pkg[]) {
  const v = VARIANTS[id]; const R = rng(id === 'travel' ? 11 : id === 'clinic' ? 22 : 33); const P = pkgs ?? v.packages
  const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)]
  const outcomes: Outcome[] = [...Array(16).fill('Lead captured'), ...Array(7).fill('FAQ only'), ...Array(4).fill('Transferred'), ...Array(3).fill('Spam')]
  for (let i = outcomes.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [outcomes[i], outcomes[j]] = [outcomes[j], outcomes[i]] }
  const calls: Call[] = []; const leads: Lead[] = []; const sp = istParts(now)
  const stages: Stage[] = ['New', 'New', 'New', 'Contacted', 'Contacted', 'Quoted', 'Quoted', 'Booked', 'Lost']
  for (let i = 0; i < 30; i++) {
    const day = Math.floor(R() * 14); const after = R() < 0.6
    let hour = after ? 19 + Math.floor(R() * 4) : 10 + Math.floor(R() * 8)
    const base = istDate(sp.y, sp.mo, sp.d - day, hour, Math.floor(R() * 60))
    const startedAt = Math.min(base, now - 600000); const q = istParts(startedAt)
    const afterHours = q.h >= 19 || q.dow === 0 || q.h < 10
    const outcome = outcomes[i]; const dur = 45 + Math.floor(R() * 215)
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; const phone = `+91 ${pick(['98', '99', '97', '70', '88'])}XXX XX${String(100 + Math.floor(R() * 899))}`
    const p = pick(P); const n = pick([2, 2, 3, 4, 4, 5, 6]); const mo = pick(MONTHS)
    const budget = id === 'travel' ? Math.round((p.price * n * (1 + R() * 0.3)) / 5000) * 5000 : id === 'clinic' ? p.price : p.price
    const fields: Record<string, string> = {}; const T: Turn[] = []; let t = startedAt
    const add = (who: 'riya' | 'caller', text: string) => { t += 4000 + Math.floor(R() * 6000); T.push({ who, text, lang: who === 'riya' ? 'MIX' : pick(['HI', 'MIX', 'EN'] as const), at: t }) }
    add('riya', v.greeting)
    let summary = ''
    if (outcome === 'Spam') { add('caller', 'Hello, aapko loan offer chahiye kya?'); add('riya', 'Maaf kijiye, humein yeh service chahiye nahi. Dhanyavaad.'); add('caller', 'Sir ek minute suniye...'); add('riya', 'Dhanyavaad, bye.'); summary = 'Spam / sales call. Ended politely.' }
    else if (outcome === 'FAQ only') { add('caller', pick(['Aapka office kahan hai?', 'Timing kya hai?', 'Payment kaise karna hota hai?'])); add('riya', id === 'travel' ? 'Office 12, Sai Darshan Complex, Gokhale Road, Thane West. Hamari timing 10 se 7, Monday se Saturday hai.' : `Hamari timing ${v.hours.label} hai.`); add('caller', 'Theek hai, thank you.'); add('riya', 'Aur kuch madad chahiye?'); add('caller', 'Nahi, bas itna hi.'); add('riya', 'Dhanyavaad, aapka din shubh rahe!'); summary = 'Caller asked a general question (address / timing / payment). Answered from KB.' }
    else if (outcome === 'Transferred') { add('caller', 'Mujhe kisi insaan se baat karni hai.'); add('riya', 'Zaroor, main aapko ' + 'Priya' + ' se connect kar rahi hoon.'); add('caller', 'Okay.'); add('riya', 'Connecting you to Priya…'); summary = 'Caller asked for a human. Transferred during office hours.'; Object.assign(fields, { name }) }
    else {
      add('caller', id === 'travel' ? `${p.dest} ka ${mo} mein kya price hai? ${n} log hain.` : `${p.name} ka price kya hai?`)
      add('riya', id === 'travel' ? `${p.name} best rahega — ${p.duration}. Starting ${rupee(p.price)} per person, twin sharing.` : `${p.name} ${rupee(p.price)} hai.`)
      add('caller', 'Usme kya included hai?'); add('riya', p.highlights.split(';').slice(0, 3).join(', ') + ' included hai.')
      add('caller', id === 'travel' ? `Budget around ${rupee(budget)} hai.` : 'Theek hai, book karna hai.'); add('riya', 'Perfect! Aapka naam bata dijiye?')
      add('caller', name); add('riya', `Thank you ${name.split(' ')[0]} ji. Aapko kab call karein?`)
      add('caller', pick(['Kal subah 11 baje.', 'Monday 11 am.', 'Shaam 5 baje.', 'Parso dopahar 2 baje.'])); add('riya', 'Done! Aapka callback book ho gaya. Details WhatsApp pe bhej doon?')
      add('caller', 'Haan, bhej do.'); add('riya', 'Bhej diya! Thank you, bye!')
      Object.assign(fields, { destination: p.dest, name, ...(id === 'travel' ? { month: mo, travellers: String(n), budget: rupee(budget) } : {}), callback: 'Booked' })
      summary = `${name} wants ${p.name}${id === 'travel' ? ` in ${mo} for ${n} travellers, budget ~${rupee(budget)}` : ''}. Callback booked, details sent on WhatsApp.`
    }
    const id_ = `C-${1000 + i}`; const score = outcome === 'Lead captured' ? 45 + Math.floor(R() * 50) : 0
    const call: Call = { id: id_, businessId: id, direction: 'inbound', callerPhone: phone, startedAt, durationSec: dur, outcome, recordingUrl: `rec/${id_}.wav`, transcript: T, summary, cost: +(dur / 60 * costPerMin).toFixed(2), fields, tools: [], sentiment: outcome === 'Spam' ? 'neutral' : R() < 0.8 ? 'positive' : 'neutral', afterHours, lang: pick(['HI', 'MIX', 'MIX', 'EN'] as const), score }
    calls.push(call)
    if (outcome === 'Lead captured') leads.push({ id: 'L-' + (1900 + i), callId: id_, businessId: id, name, phone, need: fields, budget: id === 'travel' ? budget : p.price, score, stage: stages[leads.length % stages.length], source: 'AI call', callbackAt: now + (leads.length % 5 - 1) * 3600_000 * 5 + 3600_000, createdAt: startedAt })
  }
  calls.sort((a, b) => b.startedAt - a.startedAt)
  const missed: MissedCall[] = Array.from({ length: 20 }, (_, i) => ({ id: 'M-' + i, businessId: id, callerPhone: `+91 9${Math.floor(R() * 9)}XXX XX${100 + Math.floor(R() * 899)}`, at: istDate(sp.y, sp.mo, sp.d - Math.floor(R() * 7), 12 + Math.floor(R() * 11), 15), whatsappSent: true, replied: i < 11 }))
  return { calls, leads, missed }
}
