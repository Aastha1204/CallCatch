const inr = new Intl.NumberFormat('en-IN')
export const rupee = (n: number) => '₹' + inr.format(Math.round(n))
export const lakh = (n: number) => n >= 100000 ? '₹' + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 2).replace(/0$/, '') + ' lakh' : rupee(n)
const tz = 'Asia/Kolkata'
export const fmtTime = (t: number) => new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz }).format(t).toUpperCase()
export const fmtDay = (t: number) => new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }).format(t)
export const fmtDayLong = (t: number) => new Intl.DateTimeFormat('en-IN', { weekday: 'long', timeZone: tz }).format(t)
export const fmtDT = (t: number) => `${fmtDay(t)}, ${fmtTime(t)}`
export const istParts = (t: number) => { const d = new Date(t + 19800000); return { dow: d.getUTCDay(), h: d.getUTCHours(), m: d.getUTCMinutes(), y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate() } }
export const istDate = (y: number, mo: number, d: number, h: number, m = 0) => Date.UTC(y, mo, d, h, m) - 19800000
export const maskPhone = (p: string) => p
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
export function nearestSunday2130(now = Date.now()) {
  const p = istParts(now); const add = (7 - p.dow) % 7
  let t = istDate(p.y, p.mo, p.d + add, 21, 30)
  if (t < now - 3600_000 * 3) t += 7 * 86400000
  return t
}
export function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
