import Globe from 'react-globe.gl'
import { useMemo, useRef, useEffect } from 'react'
import { rupee } from '../lib/format'

const THANE = { lat: 19.2183, lng: 72.9781 }
function texture() { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d')!; x.fillStyle = '#0a1226'; x.fillRect(0, 0, 1024, 512); x.fillStyle = 'rgba(46,230,197,.10)'
  for (let i = 0; i < 1024; i += 8) for (let j = 0; j < 512; j += 8) if (Math.sin(i * 0.021) * Math.cos(j * 0.034) + Math.sin((i + j) * 0.013) > 0.55) { x.beginPath(); x.arc(i, j, 1.6, 0, 6.3); x.fill() }
  return c.toDataURL() }
export default function Globe3D({ data, size }: { data: { name: string; lat: number; lng: number; count: number; value: number }[]; size: [number, number] }) {
  const ref = useRef<any>(null); const tex = useMemo(texture, [])
  useEffect(() => { const g = ref.current; if (!g) return; g.controls().autoRotate = true; g.controls().autoRotateSpeed = 0.5; g.pointOfView({ lat: 20, lng: 80, altitude: 1.55 }) }, [])
  return <div onMouseEnter={() => { if (ref.current) ref.current.controls().autoRotate = false }} onMouseLeave={() => { if (ref.current) ref.current.controls().autoRotate = true }}>
    <Globe ref={ref} width={size[0]} height={size[1]} backgroundColor="rgba(0,0,0,0)" globeImageUrl={tex} atmosphereColor="#2EE6C5" atmosphereAltitude={0.18}
      arcsData={data} arcStartLat={THANE.lat} arcStartLng={THANE.lng} arcEndLat={(d: any) => d.lat} arcEndLng={(d: any) => d.lng} arcColor={() => ['#2EE6C5', '#FFB547']} arcStroke={(d: any) => 0.3 + d.count * 0.25} arcDashLength={0.45} arcDashGap={0.2} arcDashAnimateTime={2200} arcAltitudeAutoScale={0.4}
      arcLabel={(d: any) => `<div style="background:#0E1422;padding:6px 10px;border-radius:8px;border:1px solid #2EE6C555;font:12px Inter">${d.name}: <b>${d.count}</b> leads · ${rupee(d.value)}</div>`}
      pointsData={data} pointLat="lat" pointLng="lng" pointColor={() => '#FFB547'} pointAltitude={0.02} pointRadius={0.4} />
  </div>
}
