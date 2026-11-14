import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Float, Html, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { useRef, useState, useEffect, type ReactNode } from 'react'
import * as THREE from 'three'
import { useVisible } from './Orb'

export interface PhoneSpec { x: number; label: string; node: ReactNode; red?: boolean; ring?: boolean }
function Phone({ spec, w, h }: { spec: PhoneSpec; w: number; h: number }) {
  const g = useRef<THREE.Group>(null!); const ringRef = useRef<THREE.Mesh>(null!)
  useFrame((st, dt) => { g.current.rotation.y += ((st.pointer.x * 0.35 + (spec.x > 0 ? -0.18 : spec.x < 0 ? 0.18 : 0)) - g.current.rotation.y) * Math.min(1, dt * 3); g.current.rotation.x += ((-st.pointer.y * 0.15) - g.current.rotation.x) * Math.min(1, dt * 3)
    if (ringRef.current) { const k = (st.clock.elapsedTime % 1.4) / 1.4; ringRef.current.scale.setScalar(1 + k * 1.2); (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.5 } })
  const bw = 1.75, bh = 3.5
  return <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5} position={[spec.x, 0, 0]}>
    <group ref={g}>
      <RoundedBox args={[bw, bh, 0.16]} radius={0.16} smoothness={6}><meshStandardMaterial color={spec.red ? '#5a1218' : '#10151f'} metalness={0.8} roughness={0.25} /></RoundedBox>
      <mesh position={[0, 0, 0.082]}><planeGeometry args={[bw - 0.1, bh - 0.1]} /><meshBasicMaterial color="#000" /></mesh>
      <mesh position={[0, bh / 2 - 0.12, 0.09]}><circleGeometry args={[0.05, 16]} /><meshBasicMaterial color="#222" /></mesh>
      {spec.ring && <mesh ref={ringRef} position={[0, 0, -0.1]}><ringGeometry args={[1.1, 1.14, 64]} /><meshBasicMaterial color={spec.red ? '#FF5A5F' : '#2EE6C5'} transparent /></mesh>}
      <Html transform position={[0, 0, 0.09]} scale={(bw - 0.12) / (w * 0.02445)} style={{ width: w, height: h }} zIndexRange={[10, 0]}><div style={{ width: w, height: h, borderRadius: 18, overflow: 'hidden' }}>{spec.node}</div></Html>
    </group>
  </Float>
}
function FitCam({ ext }: { ext: number }) { const { size, camera } = useThree(); useFrame(() => { const aspect = size.width / size.height; const fov = (camera as THREE.PerspectiveCamera).fov; const need = (ext / aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2))); const base = ext > 4 ? 8 : 5.6; camera.position.z += (Math.max(base, need * 1.05) - camera.position.z) * 0.2 }); return null }
export default function Phones({ phones, w = 330, h = 640, className = '' }: { phones: PhoneSpec[]; w?: number; h?: number; className?: string }) {
  const [mobile, setMobile] = useState(window.innerWidth < 768); const visible = useVisible()
  useEffect(() => { const f = () => setMobile(window.innerWidth < 768); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  if (mobile) return <div className="space-y-6">{phones.map((p, i) => <div key={i}><div className="text-center text-xs text-white/50 mb-2">{p.label}</div><div className="mx-auto w-fit rounded-[28px] border-4 border-[#1a2234] p-1 bg-black">{p.node}</div></div>)}</div>
  const span = phones.length > 1 ? 8.5 : 5.6
  return <div className={className}><Canvas dpr={[1, 1.75]} frameloop={visible ? 'always' : 'demand'} camera={{ position: [0, 0, span], fov: 45 }}>
    <ambientLight intensity={0.4} /><Environment resolution={64}><Lightformer intensity={2} position={[0, 4, 2]} scale={[8, 2, 1]} /><Lightformer intensity={1} position={[-4, 0, 3]} scale={[2, 6, 1]} color="#2EE6C5" /></Environment>
    <FitCam ext={Math.max(...phones.map(p => Math.abs(p.x))) * 2 + 2.2} />{phones.map((p, i) => <Phone key={i} spec={p} w={w} h={h} />)}
    <ContactShadows position={[0, -2.2, 0]} opacity={0.5} blur={2.5} scale={12} />
  </Canvas></div>
}
