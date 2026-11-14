import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useCall } from '../services/session'
import { amp, micRms } from '../services/voice'
import { useStore } from '../store'

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;} vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`
const vert = `${NOISE}
uniform float uTime; uniform float uAmplitude; uniform float uStateMix; varying vec3 vN; varying vec3 vView; varying float vD;
void main(){ float speed=0.35+uStateMix*0.0; float n=snoise(normal*1.6+uTime*speed)*0.5+snoise(normal*3.2-uTime*speed*1.6)*0.25;
 float d=n*(0.12+uAmplitude*0.55); vD=d; vec3 p=position+normal*d; vec4 mv=modelViewMatrix*vec4(p,1.0); vN=normalize(normalMatrix*normal); vView=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`
const frag = `uniform vec3 uColorA; uniform vec3 uColorB; uniform float uTime; varying vec3 vN; varying vec3 vView; varying float vD;
void main(){ float f=pow(1.0-max(dot(normalize(vN),normalize(vView)),0.0),2.2); vec3 irid=0.5+0.5*cos(6.2831*(vec3(0.0,0.33,0.67)+f*0.9+uTime*0.08+vD*2.0));
 vec3 base=mix(uColorA,uColorB,0.5+0.5*sin(vD*8.0+uTime)); vec3 col=base*0.55+irid*0.18*f+uColorA*f*1.6; gl_FragColor=vec4(col,1.0); }`

const COL: Record<string, THREE.Color[]> = { idle: [new THREE.Color('#2EE6C5'), new THREE.Color('#1c5a6e')], listening: [new THREE.Color('#2EE6C5'), new THREE.Color('#1aa6c9')], thinking: [new THREE.Color('#8B7CFF'), new THREE.Color('#d36bff')], speaking: [new THREE.Color('#FFB547'), new THREE.Color('#ff7a59')] }

export function OrbMesh({ lite, detail = 48 }: { lite: boolean; detail?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null!); const group = useRef<THREE.Group>(null!); const ring = useRef<THREE.Points>(null!); const wave = useRef<THREE.Mesh>(null!); const dots = useRef<THREE.Group>(null!)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAmplitude: { value: 0 }, uColorA: { value: new THREE.Color('#2EE6C5') }, uColorB: { value: new THREE.Color('#1c5a6e') }, uStateMix: { value: 0 } }), [])
  const count = lite ? 1200 : 2500
  const pos = useMemo(() => { const a = new Float32Array(count * 3); for (let i = 0; i < count; i++) { const t = Math.random() * 6.283, r = 1.7 + (Math.random() - 0.5) * 0.45; a[i * 3] = Math.cos(t) * r; a[i * 3 + 1] = (Math.random() - 0.5) * 0.25; a[i * 3 + 2] = Math.sin(t) * r } return a }, [count])
  const lastShock = useRef(0); const waveT = useRef(-1); const smooth = useRef(0); const mix = useRef(0)
  useFrame((st, dt) => {
    const c = useCall.getState(); const t = st.clock.elapsedTime
    const target = c.orb === 'speaking' ? amp.v : c.orb === 'listening' ? Math.max(micRms.v, amp.v) : c.orb === 'thinking' ? 0.3 : 0.06 + 0.04 * Math.sin(t * 1.2)
    smooth.current += (target - smooth.current) * Math.min(1, dt * 8)
    const [a, b] = COL[c.orb]; uniforms.uColorA.value.lerp(a, Math.min(1, dt * 6)); uniforms.uColorB.value.lerp(b, Math.min(1, dt * 6))
    uniforms.uTime.value = t * (c.orb === 'thinking' ? 2.6 : 1); uniforms.uAmplitude.value = smooth.current
    group.current.rotation.y += dt * (c.orb === 'thinking' ? 1.1 : 0.15); ring.current.rotation.y -= dt * (0.15 + smooth.current * 1.2); ring.current.scale.setScalar(1 + smooth.current * 0.25)
    dots.current.visible = c.orb === 'thinking'; dots.current.rotation.y += dt * 3; dots.current.rotation.z = Math.sin(t) * 0.3
    group.current.position.y = Math.sin(t * 0.8) * 0.06
    group.current.position.x += (st.pointer.x * 0.25 - group.current.position.x) * 0.05
    if (c.shock !== lastShock.current) { lastShock.current = c.shock; waveT.current = 0 }
    if (waveT.current >= 0) { waveT.current += dt; const k = waveT.current / 0.9; wave.current.scale.setScalar(1 + k * 2.2); (wave.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - k)); if (k >= 1) waveT.current = -1 } else (wave.current.material as THREE.MeshBasicMaterial).opacity = 0
    void mix
  })
  return <group ref={group}>
    <mesh><icosahedronGeometry args={[1, detail]} /><shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} /></mesh>
    <points ref={ring}><bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={count} itemSize={3} /></bufferGeometry><pointsMaterial size={0.018} color="#9ff" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
    <group ref={dots}>{[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[Math.cos(i * 1.256) * 1.45, 0, Math.sin(i * 1.256) * 1.45]}><sphereGeometry args={[0.05, 12, 12]} /><meshBasicMaterial color="#c7b8ff" /></mesh>)}</group>
    <mesh ref={wave} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[1.2, 1.25, 96]} /><meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} /></mesh>
  </group>
}

export function Rig() { useFrame(st => { st.camera.position.x += (st.pointer.x * 0.5 - st.camera.position.x) * 0.04; st.camera.position.y += (st.pointer.y * 0.3 - st.camera.position.y) * 0.04; st.camera.lookAt(0, 0, 0) }); return null }

export function useVisible() { const [v, setV] = useState(true); useEffect(() => { const f = () => setV(!document.hidden); document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f) }, []); return v }

export default function Orb({ className = '', cam = 4.6 }: { className?: string; cam?: number }) {
  const lite = useStore(s => s.presenter.lite); const [dpr, setDpr] = useState<[number, number]>([1, 1.75]); const visible = useVisible()
  return <div id="orb-box" className={className}>
    <Canvas dpr={dpr} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 0, cam], fov: 45 }} gl={{ antialias: !lite, alpha: true }}>
      <PerformanceMonitor onDecline={() => setDpr([0.8, 1.2])} />
      <OrbMesh lite={lite} detail={lite ? 24 : 48} /><Rig />
      {!lite && <EffectComposer><Bloom intensity={0.9} luminanceThreshold={0.35} mipmapBlur /><Vignette darkness={0.5} offset={0.3} /></EffectComposer>}
    </Canvas>
  </div>
}
