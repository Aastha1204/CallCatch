export type VariantId = 'travel' | 'clinic' | 'realestate'
export type Lang = 'HI' | 'EN' | 'MIX'
export type Outcome = 'Lead captured' | 'FAQ only' | 'Transferred' | 'Spam'
export interface Pkg { id: string; name: string; duration: string; price: number; highlights: string; best: string; dest: string; intl?: boolean }
export interface Turn { who: 'riya' | 'caller'; text: string; lang: Lang; at: number }
export interface ToolCall { name: string; args: unknown; result: unknown; ms: number; at: number }
export interface Call {
  id: string; businessId: VariantId; direction: 'inbound'; callerPhone: string; startedAt: number; durationSec: number
  outcome: Outcome; recordingUrl: string; transcript: Turn[]; summary: string; cost: number
  fields: Record<string, string>; tools: ToolCall[]; sentiment: 'positive' | 'neutral' | 'unhappy'; afterHours: boolean
  lang: Lang; isNew?: boolean; score?: number
}
export type Stage = 'New' | 'Contacted' | 'Quoted' | 'Booked' | 'Lost'
export interface Lead {
  id: string; callId?: string; businessId: VariantId; name: string; phone: string; need: Record<string, string>; budget: number
  score: number; stage: Stage; source: 'AI call' | 'Missed call'; callbackAt?: number; createdAt: number
}
export interface MissedCall { id: string; businessId: VariantId; callerPhone: string; at: number; whatsappSent: boolean; replied: boolean }
export interface Settings {
  persona: Record<VariantId, string>; languages: Record<string, boolean>; voiceURI: string; rate: number; transferNumber: string
  afterHours: 'callback' | 'voicemail'; retentionDays: number; costPerMin: number; engine: 'demo' | 'live'; sttLang: 'hi-IN' | 'en-IN'
}
export interface Presenter { prospectName: string; prospectBusiness: string; prospectPhone: string; whiteLabel: boolean; hidePrices: boolean; lite: boolean }
