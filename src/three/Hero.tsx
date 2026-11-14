import { Canvas, useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbMesh, useVisible } from './Orb'
import { useStore } from '../store'

const LABELS = ['Sun 9:47 PM', 'Lunch 1:15 PM', 'Missed', 'Sat 11:20 PM', 'Missed', 'Tue 8:05 PM']
function CallIcon({ seed, onCatch }: { seed: number; onCatch: () => void }) {
  const g = useRef<THREE.Group>(null!); const m = useRef<THREE.MeshBasicMaterial>(null!); const t = useRef(-seed * 1.3); const state = useRef<'fly' | 'caught'>('fly'); const start = useRef(new THREE.Vector3()); const [label, setLabel] = useState(LABELS[seed % LABELS.length]); const [ok, setOk] = useState(false)
  const reset = () => { const a = Math.random() * Math.PI * 2; start.current.set(Math.cos(a) * 5.5, (Math.random() - 0.3) * 2.5, Math.sin(a) * 2 - 1); t.current = 0; state.current = 'fly'; setOk(false); setLabel(LABELS[Math.floor(Math.random() * LABELS.length)]); m.current?.color.set('#FF5A5F') }
  useFrame((_, dt) => {
    t.current += dt; if (t.current < 0) { g.current.visible = false; return } g.current.visible = true; if (start.current.lengthSq() === 0) reset()
    const k = Math.min(1, t.current / 5)
    if (state.current === 'fly') { g.current.position.lerpVectors(start.current, new THREE.Vector3(0, 1.2, 0), k * k * (3 - 2 * k)); if (k >= 1) { state.current = 'caught'; t.current = 0; setOk(true); setLabel('Caught ✓'); m.current.color.set('#22C55E'); onCatch() } }
    else { g.current.position.y += dt * 0.9; g.current.scale.setScalar(Math.max(0.01, 1.4 - t.current * 1.2)); if (t.current > 1.1) { g.current.scale.setScalar(1); reset() } }
  })
  return <group ref={g}><mesh><circleGeometry args={[0.2, 24]} /><meshBasicMaterial ref={m} color="#FF5A5F" toneMapped={false} /></mesh><Text position={[0, 0.38, 0]} fontSize={0.14} color={ok ? '#9bf5b8' : '#ffb0b3'}>{label}</Text></group>
}
function Phone() { const r = useRef<THREE.Group>(null!); useFrame(s => { r.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.4) * 0.3; r.current.position.y = -1.6 + Math.sin(s.clock.elapsedTime) * 0.05 })
  const ring = useRef<THREE.Mesh>(null!); useFrame(s => { const k = (s.clock.elapsedTime % 1.6) / 1.6; ring.current.scale.setScalar(1 + k * 1.6); (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.5 })
  return <group ref={r}><RoundedBox args={[0.9, 1.7, 0.12]} radius={0.1} smoothness={4}><meshStandardMaterial color="#10151f" metalness={0.8} roughness={0.3} /></RoundedBox><mesh position={[0, 0, 0.065]}><planeGeometry args={[0.8, 1.6]} /><meshBasicMaterial color="#2EE6C5" toneMapped={false} /></mesh><mesh ref={ring} position={[0, 0.2, -0.1]}><ringGeometry args={[0.8, 0.83, 48]} /><meshBasicMaterial color="#2EE6C5" transparent /></mesh></group> }
function Drift() { useFrame(st => { st.camera.position.x = Math.sin(st.clock.elapsedTime * 0.2) * 0.6 + st.pointer.x * 0.4; st.camera.position.y = 0.4 + st.pointer.y * 0.2; st.camera.lookAt(0, 0, 0) }); return null }
export default function Hero({ onCatch }: { onCatch: () => void }) {
  const lite = useStore(s => s.presenter.lite); const visible = useVisible()
  return <Canvas dpr={[1, 1.5]} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 0.4, 7], fov: 50 }}><fog attach="fog" args={['#070B14', 6, 14]} /><ambientLight intensity={0.5} /><pointLight position={[2, 3, 3]} intensity={30} color="#2EE6C5" />
    <group position={[0, 1.2, 0]} scale={0.9}><OrbMesh lite={lite} detail={lite ? 24 : 40} /></group><Phone />
    {Array.from({ length: lite ? 4 : 7 }, (_, i) => <CallIcon key={i} seed={i} onCatch={onCatch} />)}<Drift />
    {!lite && <EffectComposer><Bloom intensity={1} luminanceThreshold={0.3} mipmapBlur /><Vignette darkness={0.6} offset={0.25} /></EffectComposer>}</Canvas>
}
