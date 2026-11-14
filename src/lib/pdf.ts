import { jsPDF } from 'jspdf'
import type { Pkg } from '../types'
import type { Variant } from '../data'

const rs = (n: number) => 'Rs. ' + new Intl.NumberFormat('en-IN').format(n)
export function brochureName(p?: Pkg) { return (p?.name ?? 'Brochure').replace(/[^A-Za-z0-9]+/g, '_') }
export function makeBrochure(v: Variant, p: Pkg): jsPDF {
  const d = new jsPDF({ unit: 'pt', format: 'a4' }); const W = 595
  const header = () => { d.setFillColor(7, 11, 20); d.rect(0, 0, W, 90, 'F'); d.setTextColor(46, 230, 197); d.setFont('helvetica', 'bold'); d.setFontSize(22); d.text(v.name, 40, 52); d.setFontSize(10); d.setTextColor(180, 190, 210); d.text(`${v.city} - ${v.hours.label}`, 40, 72) }
  const footer = (n: number) => { d.setFontSize(9); d.setTextColor(130); d.text(`Fictional demo data - Built by Neovia AI - Page ${n}/2`, 40, 815) }
  header(); d.setTextColor(20); d.setFontSize(26); d.text(p.name, 40, 140)
  d.setFontSize(12); d.setFont('helvetica', 'normal'); d.setTextColor(80); d.text(`${p.duration || ''}${p.best && p.best !== 'Any' ? '  |  Best months: ' + p.best : ''}`, 40, 162)
  d.setFillColor(230, 250, 246); d.roundedRect(40, 180, 515, 60, 8, 8, 'F'); d.setTextColor(10, 90, 78); d.setFontSize(11); d.text('Starting price', 56, 202); d.setFontSize(24); d.setFont('helvetica', 'bold'); d.text(`${rs(p.price)}${v.id === 'travel' ? ' per person' : ''}`, 56, 228)
  d.setFont('helvetica', 'normal'); d.setFontSize(9); d.setTextColor(110); d.text(v.id === 'travel' ? 'Twin sharing. Prices are indicative and fictional.' : 'Final price confirmed by our team.', 330, 228)
  d.setTextColor(20); d.setFont('helvetica', 'bold'); d.setFontSize(15); d.text(v.id === 'travel' ? 'Day-by-day itinerary' : 'Overview', 40, 280)
  const parts = p.highlights.split(';').map(s => s.trim()).filter(Boolean); const days = Math.max(1, parseInt(p.duration.split('/')[1] ?? '3') || 3)
  d.setFont('helvetica', 'normal'); d.setFontSize(11); d.setTextColor(50); let y = 304
  if (v.id === 'travel') for (let i = 1; i <= Math.min(days, 7); i++) { const t = i === 1 ? 'Arrival, hotel check-in and welcome. ' + (parts[0] ?? '') : i === days ? 'Leisure morning, departure transfer.' : parts[Math.min(i - 1, parts.length - 1)] ?? 'Sightseeing and leisure.'; d.setFont('helvetica', 'bold'); d.text(`Day ${i}`, 40, y); d.setFont('helvetica', 'normal'); d.text(d.splitTextToSize(t, 440), 95, y); y += 38 }
  else { d.text(d.splitTextToSize(p.highlights, 500), 40, y) }
  footer(1); d.addPage(); header()
  d.setTextColor(20); d.setFont('helvetica', 'bold'); d.setFontSize(15); d.text('Inclusions', 40, 140); d.setFont('helvetica', 'normal'); d.setFontSize(11); d.setTextColor(50); y = 164
  for (const s of parts) { d.text('+  ' + s, 46, y); y += 20 }
  y += 14; d.setFont('helvetica', 'bold'); d.setFontSize(15); d.setTextColor(20); d.text('Exclusions', 40, y); y += 24; d.setFont('helvetica', 'normal'); d.setFontSize(11); d.setTextColor(50)
  for (const s of v.id === 'travel' ? ['Personal expenses and tips', 'Items not mentioned in inclusions', 'Anything outside the itinerary', 'Domestic flights unless stated'] : ['Items not mentioned', 'Taxes unless stated']) { d.text('-  ' + s, 46, y); y += 20 }
  y += 20; d.setFontSize(11); d.setTextColor(20); d.text('Next step: our expert will confirm availability and the final quote on the callback.', 40, y)
  footer(2); return d
}
export function downloadBrochure(v: Variant, p: Pkg) { makeBrochure(v, p).save(`${brochureName(p)}.pdf`) }
