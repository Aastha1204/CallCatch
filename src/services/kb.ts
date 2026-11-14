import type { Pkg } from '../types'
import type { Variant } from '../data'
import { rupee } from '../lib/format'

export interface Chunk { id: string; title: string; text: string; kind: 'pkg' | 'faq' | 'info'; pkg?: Pkg }
export interface Hit { chunk: Chunk; score: number }

export function buildChunks(v: Variant, pkgs: Pkg[], faqs = v.faqs, info = v.info): Chunk[] {
  return [
    ...pkgs.map((p): Chunk => ({ id: p.id, title: p.name, kind: 'pkg', pkg: p, text: `${p.name} ${p.dest} ${p.duration} price ${rupee(p.price)} ${p.highlights} best months ${p.best}` })),
    ...faqs.map((f, i): Chunk => ({ id: 'faq' + i, title: f.q, kind: 'faq', text: `${f.q} ${f.a}` })),
    ...info.map((f, i): Chunk => ({ id: 'info' + i, title: f.k, kind: 'info', text: `${f.k} ${f.v}` })),
  ]
}

export const SYN: Record<string, string[]> = {
  kashmir: ['कश्मीर', 'srinagar', 'gulmarg', 'pahalgam'], price: ['rate', 'kitna', 'kitne', 'kimat', 'कीमत', 'daam', 'cost', 'package', 'charge', 'fees', 'kharcha'],
  visa: ['वीज़ा', 'vija'], timing: ['time', 'timings', 'khulta', 'hours', 'open', 'baje'], location: ['address', 'kahan', 'kaha', 'where'],
  payment: ['pay', 'upi', 'card', 'emi', 'paisa'], cleaning: ['scaling', 'safai'], included: ['inclusions', 'include', 'included', 'shamil', 'milega', 'kya kya'],
}
export const STOP = new Set('a an the is are of to in on at for and or ka ki ke ko hai hain hi bhi kya kyu mein me se hum hamare aap aapka mera main mujhe chahiye chahie karna karni kar karo do de dena dijiye bata batao bataiye batana ho hoga hogi tha the log logo yeh ye woh wo is us isme usme kuch koi kaun kaise kab kitna kitne kitni milegi milega milta ticket abhi aur ya toh to hu hun hoon raha rahi rahe nahi nahin haan ok theek please sir ji mala aahe karaychi tumhala tumcha pahije kadhi saath ek bhi me wala wali liye lagbhag around about trip tour per person price rate cost package packages free of'.split(' '))
const MONTHS = 'january february march april may june july august september october november december jan feb mar apr jun jul aug sep sept oct nov dec disambar janvari farvari'.split(' ')

const tok = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
function expand(tokens: string[]) {
  const out = [...tokens]
  for (const t of tokens) for (const [k, vs] of Object.entries(SYN)) if (k === t || vs.includes(t)) { out.push(k, ...vs.filter(x => !x.includes(' '))) }
  return out
}

export function search(query: string, chunks: Chunk[]): Hit[] {
  const q = expand(tok(query)).filter(t => !STOP.has(t))
  const docs = chunks.map(c => tok(c.text + ' ' + c.title))
  const avg = docs.reduce((a, d) => a + d.length, 0) / (docs.length || 1)
  const N = docs.length
  const raw = chunks.map((chunk, i) => {
    const d = docs[i]; let s = 0
    const uniq = Array.from(new Set(q))
    for (const t of uniq) {
      const f = d.filter(x => x === t).length; if (!f) continue
      const n = docs.filter(dd => dd.includes(t)).length
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
      const w = (SYN[t] ? 1.4 : 1) * (tok(chunk.title).includes(t) ? 1.5 : 1)
      s += w * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * d.length / avg))
    }
    return { chunk, s }
  })
  return raw.map(r => ({ chunk: r.chunk, score: +(1 - Math.exp(-r.s / 3.2)).toFixed(2) })).sort((a, b) => b.score - a.score).slice(0, 3)
}

/** Query words that appear nowhere in the KB: signals a fact we can't verify */
export function unknownTerms(query: string, chunks: Chunk[]): string[] {
  const known = new Set<string>([...MONTHS, ...Object.keys(SYN), ...Object.values(SYN).flat()])
  chunks.forEach(c => tok(c.text + ' ' + c.title).forEach(t => known.add(t)))
  return tok(query).filter(t => t.length > 3 && !STOP.has(t) && !known.has(t) && !/^\d+$/.test(t) && !/^(kal|parso|subah|shaam|baje|monday|sunday|tuesday|saturday|friday|thursday|wednesday|lakh|hazaar|dedh|dhai|naam|name|budget|total|thank|thanks|namaste|hello|please|bhej|sunday)$/.test(t))
}
