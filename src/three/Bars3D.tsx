import { Canvas, useFrame } from '@react-three/fiber'
import { Text, OrbitControls, Environment, Lightformer } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'
function Bar({ x, h, label, n }: { x: number; h: number; label: string; n: number }) {
  const m = useRef<THREE.Mesh>(null!); const [hov, setHov] = useState(false)
  useFrame((_, dt) => { m.current.scale.y += (h - m.current.scale.y) * Math.min(1, dt * 4); m.current.position.y = m.current.scale.y / 2 })
  return <group position={[x, 0, 0]}><mesh ref={m} onPointerOver={() => setHov(true)} onPointerOut={() => setHov(false)}><boxGeometry args={[0.8, 1, 0.8]} /><meshStandardMaterial color={hov ? '#FFB547' : '#2EE6C5'} emissive={hov ? '#FFB547' : '#2EE6C5'} emissiveIntensity={0.35} metalness={0.4} roughness={0.3} /></mesh>
    <Text position={[0, h + 0.35, 0]} fontSize={0.32} color="white">{String(n)}</Text><Text position={[0, -0.3, 0.5]} fontSize={0.2} color="#9fb0c8" maxWidth={1.4}>{label}</Text></group>
}
export default function Bars3D({ data }: { data: { name: string; n: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.n))
  return <Canvas camera={{ position: [0, 3, 8], fov: 45 }}><ambientLight intensity={0.5} /><directionalLight position={[3, 5, 3]} intensity={1.2} /><Environment resolution={64}><Lightformer intensity={2} position={[0, 4, 2]} scale={[8, 2, 1]} /></Environment>
    <group position={[-(data.length - 1) * 0.6, 0, 0]}>{data.map((d, i) => <Bar key={d.name} x={i * 1.2} h={(d.n / max) * 3.5 + 0.1} label={d.name} n={d.n} />)}</group><OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} maxPolarAngle={1.5} /></Canvas>
}
