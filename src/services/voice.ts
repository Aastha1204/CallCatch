/** VoiceIO: WebSpeechVoiceIO (BolnaVoiceIO later) */
export const amp = { v: 0 }
let ctx: AudioContext | null = null, analyser: AnalyserNode | null = null, stream: MediaStream | null = null, raf = 0
export const sttSupported = () => typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

export async function openMic(): Promise<boolean> {
  try {
    if (stream) return true
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    ctx = new AudioContext(); const src = ctx.createMediaStreamSource(stream); analyser = ctx.createAnalyser(); analyser.fftSize = 512; src.connect(analyser)
    const buf = new Uint8Array(analyser.fftSize)
    const loop = () => { analyser!.getByteTimeDomainData(buf); let s = 0; for (const b of buf) { const x = (b - 128) / 128; s += x * x } micRms.v = Math.min(1, Math.sqrt(s / buf.length) * 4); raf = requestAnimationFrame(loop) }
    loop(); return true
  } catch { return false }
}
export const micRms = { v: 0 }
export function closeMic() { cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); ctx?.close().catch(() => {}); stream = null; ctx = null; analyser = null; micRms.v = 0 }

export function voices() { return typeof speechSynthesis === 'undefined' ? [] : speechSynthesis.getVoices() }
export function pickVoice(uri: string, role: 'riya' | 'caller'): SpeechSynthesisVoice | undefined {
  const vs = voices(); if (uri && role === 'riya') { const f = vs.find(v => v.voiceURI === uri); if (f) return f }
  const hi = vs.filter(v => v.lang === 'hi-IN'), en = vs.filter(v => v.lang === 'en-IN'), rest = vs.filter(v => v.lang.startsWith('en'))
  const pool = [...hi, ...en, ...rest]
  if (!pool.length) return undefined
  return role === 'riya' ? pool[0] : (pool.find(v => v !== pool[0] && /male|ravi|rishi|david|mark/i.test(v.name)) ?? pool[1] ?? pool[0])
}
export const splitSentences = (t: string) => t.match(/[^.!?—।]+[.!?—।]?/g)?.map(s => s.trim()).filter(Boolean) ?? [t]

let cancelled = false
export function cancelSpeech() { cancelled = true; try { speechSynthesis.cancel() } catch {} ; amp.v = 0 }

/** Speaks text; onWord(charIndex) fires from boundary events, or estimated from time when voice lacks them. */
export function speak(text: string, opts: { role: 'riya' | 'caller'; voiceURI?: string; rate?: number; onWord?: (i: number) => void }): Promise<void> {
  cancelled = false
  const rate = opts.rate ?? 1
  const estimate = (t: number) => new Promise<void>(res => { const total = Math.max(1200, t * 48 / rate); const start = performance.now(); let last = -1
    const tick = () => { if (cancelled) { amp.v = 0; return res() } const e = performance.now() - start
      if (e >= total) { amp.v = 0; return res() }
      amp.v = 0.35 + 0.35 * Math.abs(Math.sin(e / 95)) * (0.6 + 0.4 * Math.sin(e / 400)); const idx = Math.floor(e / total * t); if (idx !== last) { last = idx; opts.onWord?.(idx) }; requestAnimationFrame(tick) }
    tick() })
  if (typeof speechSynthesis === 'undefined' || !voices().length) return estimate(text.length)
  return new Promise<void>(async resolve => {
    let offset = 0
    for (const s of splitSentences(text)) {
      if (cancelled) break
      await new Promise<void>(res => {
        const u = new SpeechSynthesisUtterance(s); const v = pickVoice(opts.voiceURI ?? '', opts.role); if (v) { u.voice = v; u.lang = v.lang } else u.lang = 'hi-IN'
        u.rate = rate * (opts.role === 'caller' ? 1.05 : 1); u.pitch = opts.role === 'caller' ? 0.8 : 1.1
        let gotBoundary = false; let timer = 0; const st = performance.now(); const est = Math.max(900, s.length * 52 / u.rate)
        u.onboundary = e => { gotBoundary = true; opts.onWord?.(offset + e.charIndex); amp.v = 0.4 + Math.random() * 0.45 }
        u.onstart = () => { timer = window.setInterval(() => { if (!gotBoundary) { const e = performance.now() - st; amp.v = 0.35 + 0.35 * Math.abs(Math.sin(e / 95)); opts.onWord?.(offset + Math.min(s.length - 1, Math.floor(e / est * s.length))) } else amp.v *= 0.92 }, 60) }
        let fin = false; const done = () => { if (fin) return; fin = true; clearInterval(timer); clearTimeout(wd); amp.v = 0; res() }
        const wd = window.setTimeout(() => { try { speechSynthesis.cancel() } catch {} done() }, est * 2.2 + 2500)
        u.onend = done; u.onerror = done
        speechSynthesis.speak(u)
      })
      offset += s.length + 1
    }
    resolve()
  })
}

export interface Recog { start(): void; stop(): void; abort(): void }
export function makeRecognizer(lang: string, onResult: (t: string, final: boolean) => void, onEnd: () => void, onStart?: () => void): Recog | null {
  const C = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!C) return null
  const r = new C(); r.lang = lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1
  r.onresult = (e: any) => { const res = e.results[e.results.length - 1]; onResult(res[0].transcript, res.isFinal) }
  r.onend = onEnd; r.onerror = () => onEnd(); r.onspeechstart = () => onStart?.()
  return r
}
