import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Call, Lead, MissedCall, Presenter, Settings, Stage, VariantId, Pkg } from './types'
import { VARIANTS } from './data'
import { seedFor } from './lib/seed'
import { nearestSunday2130 } from './lib/format'

interface Slice { calls: Call[]; leads: Lead[]; missed: MissedCall[]; pkgs: Pkg[]; faqs: { q: string; a: string }[]; info: { k: string; v: string }[] }
interface State {
  variant: VariantId; data: Record<VariantId, Slice>; settings: Settings; presenter: Presenter
  clock: number | null; clockLive: boolean; logs: string[]; toast: string; reduceMotion: boolean; kbVersion: number
  setVariant: (v: VariantId) => void; addCall: (c: Call) => void; addLead: (l: Lead) => void; addMissed: (m: MissedCall) => void
  moveLead: (id: string, s: Stage) => void; updateCall: (id: string, patch: Partial<Call>) => void
  setPkgs: (p: Pkg[]) => void; setFaqs: (f: { q: string; a: string }[]) => void; setSettings: (s: Partial<Settings>) => void; setPresenter: (p: Partial<Presenter>) => void
  setClock: (t: number | null) => void; setClockLive: (b: boolean) => void; log: (s: string) => void; say: (s: string) => void; reset: () => void; markNew: (id: string | null) => void; newCallId: string | null
}
const mk = (id: VariantId, now: number): Slice => { const s = seedFor(id, now); const v = VARIANTS[id]; return { ...s, pkgs: v.packages.map(p => ({ ...p })), faqs: v.faqs.map(f => ({ ...f })), info: v.info.map(i => ({ ...i })) } }
const seedAll = (now: number) => ({ travel: mk('travel', now), clinic: mk('clinic', now), realestate: mk('realestate', now) })
const defSettings = (): Settings => ({ persona: { travel: 'Riya', clinic: 'Asha', realestate: 'Neha' }, languages: { Hindi: true, English: true, Hinglish: true, Marathi: false }, voiceURI: '', rate: 1, transferNumber: '+91 98XXX XX000', afterHours: 'callback', retentionDays: 90, costPerMin: 6.5, engine: 'demo', sttLang: 'hi-IN' })
const defPresenter = (): Presenter => ({ prospectName: '', prospectBusiness: '', prospectPhone: '', whiteLabel: false, hidePrices: false, lite: false })
export const SEED_NOW = nearestSunday2130()

export const useStore = create<State>()(persist((set, get) => ({
  variant: 'travel', data: seedAll(SEED_NOW), settings: defSettings(), presenter: defPresenter(), clock: SEED_NOW, clockLive: false, logs: [], toast: '', reduceMotion: false, kbVersion: 0, newCallId: null,
  setVariant: variant => { set({ variant, toast: `Switched to ${VARIANTS[variant].name}` }); setTimeout(() => get().say(''), 2500) },
  addCall: c => set(s => ({ data: { ...s.data, [s.variant]: { ...s.data[s.variant], calls: [c, ...s.data[s.variant].calls] } } })),
  addLead: l => set(s => ({ data: { ...s.data, [s.variant]: { ...s.data[s.variant], leads: [l, ...s.data[s.variant].leads] } } })),
  addMissed: m => set(s => ({ data: { ...s.data, [s.variant]: { ...s.data[s.variant], missed: [m, ...s.data[s.variant].missed] } } })),
  moveLead: (id, stage) => set(s => ({ data: { ...s.data, [s.variant]: { ...s.data[s.variant], leads: s.data[s.variant].leads.map(l => l.id === id ? { ...l, stage } : l) } } })),
  updateCall: (id, patch) => set(s => ({ data: { ...s.data, [s.variant]: { ...s.data[s.variant], calls: s.data[s.variant].calls.map(c => c.id === id ? { ...c, ...patch } : c) } } })),
  setPkgs: pkgs => set(s => ({ kbVersion: s.kbVersion + 1, data: { ...s.data, [s.variant]: { ...s.data[s.variant], pkgs } } })),
  setFaqs: faqs => set(s => ({ data: { ...s.data, [s.variant]: { ...s.data[s.variant], faqs } } })),
  setSettings: p => set(s => ({ settings: { ...s.settings, ...p } })), setPresenter: p => set(s => ({ presenter: { ...s.presenter, ...p } })),
  setClock: clock => set({ clock }), setClockLive: clockLive => set({ clockLive }),
  log: x => set(s => ({ logs: [...s.logs.slice(-199), `${new Date().toLocaleTimeString('en-IN')}  ${x}`] })),
  say: toast => set({ toast }), markNew: newCallId => set({ newCallId }),
  reset: () => set({ data: seedAll(SEED_NOW), settings: defSettings(), presenter: defPresenter(), clock: SEED_NOW, clockLive: false, logs: [], toast: 'Demo reset', newCallId: null }),
}), { name: 'callcatch-v1', partialize: s => ({ variant: s.variant, data: s.data, settings: s.settings, presenter: s.presenter, clock: s.clock, clockLive: s.clockLive }) }))

export const useSlice = () => useStore(s => s.data[s.variant])
export const useV = () => VARIANTS[useStore(s => s.variant)]
export const nowOf = () => { const s = useStore.getState(); return s.clockLive || s.clock == null ? Date.now() : s.clock }
