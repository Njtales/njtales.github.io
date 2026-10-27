import { Outlines } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

const outline = { color: '#493b30', thickness: 0.012, screenspace: true, transparent: true, opacity: 0.58 }

function makeArch(width: number, height: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, 0)
  shape.lineTo(width / 2, 0)
  shape.lineTo(width / 2, height * 0.68)
  shape.quadraticCurveTo(width / 2, height, 0, height)
  shape.quadraticCurveTo(-width / 2, height, -width / 2, height * 0.68)
  shape.closePath()
  return new THREE.ShapeGeometry(shape, 8)
}

function Door({ position, width = 0.54, height = 1.05, color = '#684630', trim = '#d2ae70' }: {
  position: [number, number, number]
  width?: number
  height?: number
  color?: string
  trim?: string
}) {
  const arch = useMemo(() => makeArch(width + 0.16, height + 0.13), [width, height])
  const panel = useMemo(() => makeArch(width, height), [width, height])
  return (
    <group position={position}>
      <mesh geometry={arch} position={[0, 0, -0.035]}>
        <meshStandardMaterial color={trim} roughness={0.94} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={panel} position={[0, 0.04, 0.015]}>
        <meshStandardMaterial color={color} roughness={0.92} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[width * 0.3, height * 0.43, 0.045]}>
        <sphereGeometry args={[0.045, 7, 5]} />
        <meshStandardMaterial color="#f0ca75" roughness={0.62} />
      </mesh>
    </group>
  )
}

function RoundWindow({ position, radius = 0.22, color = '#82c8c0', frame = '#6c5138' }: {
  position: [number, number, number]
  radius?: number
  color?: string
  frame?: string
}) {
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[radius, 12]} />
        <meshStandardMaterial color={color} roughness={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <torusGeometry args={[radius, 0.045, 5, 12]} />
        <meshStandardMaterial color={frame} roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

function GableRoof({ width, height, depth, color, position }: {
  width: number
  height: number
  depth: number
  color: string
  position: [number, number, number]
}) {
  const roof = useMemo(() => {
    const profile = new THREE.Shape()
    profile.moveTo(-width / 2, 0)
    profile.lineTo(width / 2, 0)
    profile.lineTo(width / 2, height * 0.48)
    profile.lineTo(0, height)
    profile.lineTo(-width / 2, height * 0.48)
    profile.closePath()
    return new THREE.ExtrudeGeometry(profile, { depth, bevelEnabled: false, curveSegments: 1 })
  }, [width, height, depth])
  return (
    <mesh geometry={roof} position={[position[0], position[1], position[2] - depth / 2]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
      <Outlines {...outline} />
    </mesh>
  )
}

function Clocktower() {
  return (
    <group position={[-4.8, 0.34, -6.7]}>
      <mesh position={[0, 0.64, 0]} scale={[0.94, 1, 0.9]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 1.02, 1.28, 7]} />
        <meshStandardMaterial color="#8d7554" roughness={0.98} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 2.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.42, 2.48, 1.22]} />
        <meshStandardMaterial color="#d7bd8b" roughness={0.95} flatShading />
        <Outlines {...outline} />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <mesh key={'clock-post-' + x} position={[x, 2.48, 0.64]} castShadow>
          <boxGeometry args={[0.13, 2.5, 0.1]} />
          <meshStandardMaterial color="#835b3d" roughness={1} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 3.98, 0]} castShadow>
        <boxGeometry args={[1.72, 0.13, 1.46]} />
        <meshStandardMaterial color="#9c7048" roughness={1} />
      </mesh>
      <GableRoof width={2.02} height={1.38} depth={1.76} color="#b84f3d" position={[0, 4.04, 0]} />
      <mesh position={[0, 3.15, 0.63]}>
        <circleGeometry args={[0.57, 16]} />
        <meshStandardMaterial color="#f4dfa9" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.15, 0.67]}>
        <torusGeometry args={[0.61, 0.085, 6, 16]} />
        <meshStandardMaterial color="#704a32" roughness={0.95} flatShading />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const angle = i * Math.PI / 2
        return (
          <mesh key={'clock-tick-' + i} position={[Math.sin(angle) * 0.44, 3.15 + Math.cos(angle) * 0.44, 0.705]} rotation={[0, 0, -angle]}>
            <boxGeometry args={[0.045, 0.105, 0.025]} />
            <meshStandardMaterial color="#684b35" roughness={1} />
          </mesh>
        )
      })}
      <mesh position={[0.03, 3.2, 0.735]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.055, 0.32, 0.035]} />
        <meshStandardMaterial color="#573b2d" roughness={1} />
      </mesh>
      <mesh position={[-0.09, 3.07, 0.735]} rotation={[0, 0, 0.72]}>
        <boxGeometry args={[0.045, 0.23, 0.03]} />
        <meshStandardMaterial color="#573b2d" roughness={1} />
      </mesh>
      <Door position={[0, 0.14, 0.62]} width={0.52} height={0.98} />
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.98, 1.05, 0.24, 7]} />
        <meshStandardMaterial color="#66523d" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function CloudForge() {
  const roof = useMemo(() => {
    const profile = new THREE.Shape()
    profile.moveTo(-2.25, 0.05)
    profile.lineTo(-2.52, 0.66)
    profile.lineTo(-1.7, 0.55)
    profile.lineTo(-0.75, 0.79)
    profile.lineTo(0.22, 0.58)
    profile.lineTo(1.44, 0.36)
    profile.lineTo(2.25, 0.15)
    profile.lineTo(2.04, -0.16)
    profile.lineTo(-2.16, -0.16)
    profile.closePath()
    return new THREE.ExtrudeGeometry(profile, { depth: 2.8, bevelEnabled: false, curveSegments: 1 })
  }, [])
  const arch = useMemo(() => makeArch(1.12, 1.18), [])
  return (
    <group position={[-9.6, 0.34, -1.5]}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.7, 2.05, 2.62]} />
        <meshStandardMaterial color="#d6bd8d" roughness={0.96} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh geometry={roof} position={[0, 2.4, -1.4]} castShadow receiveShadow>
        <meshStandardMaterial color="#34474a" roughness={0.94} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0.52, 2.88, 0.1]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[1.7, 0.12, 2.45]} />
        <meshStandardMaterial color="#318b8b" roughness={0.85} flatShading />
      </mesh>
      <mesh geometry={arch} position={[-0.62, 1.1, 1.33]}>
        <meshStandardMaterial color="#e6a148" emissive="#a74d21" emissiveIntensity={0.22} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={arch} position={[-0.62, 1.16, 1.37]} scale={[0.76, 0.78, 1]}>
        <meshStandardMaterial color="#ffcf68" emissive="#d67a2c" emissiveIntensity={0.3} roughness={0.68} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.28, 1.92, -0.56]} rotation={[0, 0, 0.04]} castShadow>
        <cylinderGeometry args={[0.26, 0.36, 1.42, 7]} />
        <meshStandardMaterial color="#765343" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.15, 0.12, 0]}>
        <boxGeometry args={[4.0, 0.2, 2.9]} />
        <meshStandardMaterial color="#755942" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.56, 0.92, 1.36]}>
        <boxGeometry args={[0.42, 0.66, 0.05]} />
        <meshStandardMaterial color="#614632" roughness={0.95} />
      </mesh>
      <mesh position={[0.56, 0.97, 1.39]}>
        <boxGeometry args={[0.22, 0.16, 0.03]} />
        <meshStandardMaterial color="#f5c160" emissive="#d98430" emissiveIntensity={0.22} />
      </mesh>
    </group>
  )
}

function DataTower() {
  return (
    <group position={[5.4, 0.35, -4.4]}>
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 1.06, 2.38, 9]} />
        <meshStandardMaterial color="#cdb78a" roughness={0.98} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[1.08, 1.18, 0.48, 9]} />
        <meshStandardMaterial color="#8d7554" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 2.58, 0]} castShadow>
        <cylinderGeometry args={[1.06, 0.84, 0.4, 10]} />
        <meshStandardMaterial color="#7c5037" roughness={0.93} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 2.82, 0]}>
        <cylinderGeometry args={[0.88, 0.95, 0.08, 10]} />
        <meshStandardMaterial color="#55b9b5" roughness={0.5} metalness={0.08} flatShading />
      </mesh>
      <mesh position={[0, 2.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.92, 0.065, 5, 12]} />
        <meshStandardMaterial color="#dfb765" roughness={0.82} flatShading />
      </mesh>
      <mesh position={[0, 3.12, 0]}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color="#f1c85e" roughness={0.72} />
      </mesh>
      <Door position={[0, 0.16, 0.86]} width={0.48} height={0.96} />
      <RoundWindow position={[-0.52, 1.25, 0.79]} radius={0.15} color="#8fcfc4" />
      <RoundWindow position={[0.52, 1.25, 0.79]} radius={0.15} color="#8fcfc4" />
      <mesh position={[1.18, 0.26, 0.45]} rotation={[0, 0, 0.16]}>
        <octahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#4bbdc4" roughness={0.4} />
      </mesh>
    </group>
  )
}

function LearningLab() {
  const dome = useMemo(() => new THREE.SphereGeometry(1.22, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), [])
  return (
    <group position={[-14.2, 0.38, 2.8]}>
      <mesh position={[0, 0.96, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.18, 1.38, 1.78, 10]} />
        <meshStandardMaterial color="#e2c995" roughness={0.96} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 1.82, 0]} castShadow receiveShadow geometry={dome}>
        <meshStandardMaterial color="#a8553d" roughness={0.92} flatShading side={THREE.DoubleSide} />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 1.84, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.075, 5, 12]} />
        <meshStandardMaterial color="#d69b54" roughness={0.86} flatShading />
      </mesh>
      <mesh position={[0.38, 2.78, 0.08]} rotation={[0, 0, -0.72]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.16, 8]} />
        <meshStandardMaterial color="#765037" roughness={0.82} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0.75, 3.25, 0.08]} rotation={[0, 0, -0.72]}>
        <cylinderGeometry args={[0.14, 0.14, 0.18, 8]} />
        <meshStandardMaterial color="#d3ae64" roughness={0.74} flatShading />
      </mesh>
      <Door position={[0, 0.12, 1.17]} width={0.52} height={0.94} />
      <RoundWindow position={[-0.74, 1.1, 0.98]} radius={0.18} color="#65babc" />
      <RoundWindow position={[0.74, 1.1, 0.98]} radius={0.18} color="#65babc" />
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[1.34, 1.42, 0.24, 10]} />
        <meshStandardMaterial color="#7e6345" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function AboutCottage() {
  const roof = useMemo(() => new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), [])
  return (
    <group position={[9.2, 0.34, 4.1]}>
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.3, 1.42, 10]} />
        <meshStandardMaterial color="#dfc38b" roughness={0.98} flatShading />
        <Outlines {...outline} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={'cottage-wing-' + side} position={[side * 1.04, 0.02, 0.05]}>
          <mesh position={[0, 0.47, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.63, 0.74, 0.94, 8]} />
            <meshStandardMaterial color="#d8bb83" roughness={0.98} flatShading />
            <Outlines {...outline} />
          </mesh>
          <mesh position={[0, 0.95, 0]} scale={[0.77, 0.55, 0.83]} geometry={roof} castShadow>
            <meshStandardMaterial color={side < 0 ? '#b96243' : '#c16a48'} roughness={0.96} flatShading side={THREE.DoubleSide} />
          </mesh>
          <RoundWindow position={[0, 0.55, 0.64]} radius={0.14} color="#f3d17c" frame="#287477" />
        </group>
      ))}
      <mesh position={[0, 1.47, 0]} scale={[1.4, 1.02, 1.34]} castShadow receiveShadow geometry={roof}>
        <meshStandardMaterial color="#bd6748" roughness={0.95} flatShading side={THREE.DoubleSide} />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[-0.55, 2.48, -0.36]} castShadow>
        <cylinderGeometry args={[0.24, 0.32, 1.3, 7]} />
        <meshStandardMaterial color="#a7593e" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-0.55, 3.15, -0.36]}>
        <cylinderGeometry args={[0.29, 0.29, 0.12, 7]} />
        <meshStandardMaterial color="#e5bd76" roughness={0.95} flatShading />
      </mesh>
      <Door position={[0.05, 0.08, 1.14]} width={0.62} height={1.02} color="#237d7c" trim="#ecd39f" />
      <RoundWindow position={[-0.76, 1.0, 0.91]} radius={0.22} color="#f4d37c" frame="#287477" />
      <RoundWindow position={[0.84, 1.0, 0.91]} radius={0.22} color="#f4d37c" frame="#287477" />
      <mesh position={[0.05, 0.08, 0.95]}>
        <boxGeometry args={[0.98, 0.12, 0.42]} />
        <meshStandardMaterial color="#926542" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.26, 1.35, 0.24, 10]} />
        <meshStandardMaterial color="#776043" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function HobbiesHut() {
  const waveRoof = useMemo(() => {
    const profile = new THREE.Shape()
    profile.moveTo(-1.46, 0.05)
    profile.quadraticCurveTo(-1.5, 0.78, -0.7, 0.98)
    profile.quadraticCurveTo(-0.12, 1.56, 0.45, 1.16)
    profile.quadraticCurveTo(0.96, 0.77, 1.5, 0.94)
    profile.lineTo(1.45, 0.58)
    profile.quadraticCurveTo(0.78, 0.52, 0.31, 0.84)
    profile.quadraticCurveTo(-0.25, 1.13, -0.72, 0.67)
    profile.quadraticCurveTo(-1.08, 0.3, -1.46, 0.43)
    profile.closePath()
    return new THREE.ExtrudeGeometry(profile, { depth: 2.36, bevelEnabled: false, curveSegments: 4 })
  }, [])
  return (
    <group position={[14.4, 0.34, -2.9]}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.72, 1.62, 2.02]} />
        <meshStandardMaterial color="#a76642" roughness={0.97} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 1.42, -1.18]} geometry={waveRoof} castShadow receiveShadow>
        <meshStandardMaterial color="#ce8045" roughness={0.96} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0.12, 0.91, 1.04]}>
        <circleGeometry args={[0.34, 12]} />
        <meshStandardMaterial color="#69b8bb" roughness={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.12, 0.91, 1.08]}>
        <torusGeometry args={[0.38, 0.075, 5, 12]} />
        <meshStandardMaterial color="#604b38" roughness={0.96} flatShading />
      </mesh>
      <Door position={[-0.6, 0.12, 1.03]} width={0.5} height={0.94} color="#68422f" trim="#d7a96b" />
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[2.98, 0.24, 2.28]} />
        <meshStandardMaterial color="#654b35" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function SignalTower() {
  return (
    <group position={[0.3, 0.35, 0.2]}>
      <mesh position={[0, 1.91, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.58, 0.86, 3.55, 9]} />
        <meshStandardMaterial color="#d7c08f" roughness={0.98} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 3.77, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.98, 0.92, 0.88, 10]} />
        <meshStandardMaterial color="#b37b4a" roughness={0.94} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 3.42, 0]}>
        <cylinderGeometry args={[1.07, 1.07, 0.18, 10]} />
        <meshStandardMaterial color="#75503a" roughness={0.96} flatShading />
      </mesh>
      <mesh position={[0, 4.3, 0]} castShadow>
        <coneGeometry args={[1.12, 0.62, 9]} />
        <meshStandardMaterial color="#b7543e" roughness={0.93} flatShading />
        <Outlines {...outline} />
      </mesh>
      <mesh position={[0, 4.59, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.1, 8]} />
        <meshStandardMaterial color="#e4bb69" roughness={0.74} flatShading />
      </mesh>
      <mesh position={[0, 5.03, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 0.84, 7]} />
        <meshStandardMaterial color="#815a3c" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 5.48, 0]}>
        <sphereGeometry args={[0.17, 8, 6]} />
        <meshStandardMaterial color="#f1ca62" emissive="#d88b32" emissiveIntensity={0.48} roughness={0.65} />
      </mesh>
      {[-0.47, 0, 0.47].map((x) => (
        <mesh key={'beacon-window-' + x} position={[x, 3.79, 0.88]}>
          <boxGeometry args={[0.2, 0.42, 0.04]} />
          <meshStandardMaterial color="#64c5c1" roughness={0.46} />
        </mesh>
      ))}
      <Door position={[0, 0.12, 0.76]} width={0.46} height={0.92} />
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.92, 1.03, 0.24, 9]} />
        <meshStandardMaterial color="#796143" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

export function VillageLandmarks() {
  return (
    <group>
      <LearningLab />
      <Clocktower />
      <CloudForge />
      <DataTower />
      <AboutCottage />
      <HobbiesHut />
      <SignalTower />
    </group>
  )
}

let canopyPaint: THREE.CanvasTexture | undefined

function getCanopyPaint() {
  if (canopyPaint) return canopyPaint
  const canvas = document.createElement('canvas')
  canvas.width = 192
  canvas.height = 192
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  context.fillStyle = '#f5f2dc'
  context.fillRect(0, 0, canvas.width, canvas.height)
  let seed = 821
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const brushColors = [
    'rgba(28,72,38,0.3)', 'rgba(46,100,44,0.23)', 'rgba(116,157,64,0.24)',
    'rgba(238,218,132,0.28)', 'rgba(255,241,181,0.21)',
  ]
  for (let i = 0; i < 42; i += 1) {
    const x = random() * canvas.width
    const y = random() * canvas.height
    context.fillStyle = brushColors[i % brushColors.length]
    context.beginPath()
    context.ellipse(x, y, 8 + random() * 18, 4 + random() * 11, (random() - 0.5) * 1.4, 0, Math.PI * 2)
    context.fill()
  }
  for (let i = 0; i < 14; i += 1) {
    const x = random() * canvas.width
    const y = random() * canvas.height
    context.strokeStyle = i % 3 === 0 ? 'rgba(255,238,155,0.28)' : 'rgba(34,80,38,0.22)'
    context.lineWidth = 3 + random() * 4
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(x, y)
    context.quadraticCurveTo(x + 8 + random() * 14, y - 4 + random() * 10, x + 18 + random() * 20, y + random() * 12)
    context.stroke()
  }
  canopyPaint = new THREE.CanvasTexture(canvas)
  canopyPaint.colorSpace = THREE.SRGBColorSpace
  canopyPaint.anisotropy = 4
  return canopyPaint
}

const leafBaseGeometry = (() => {
  const geometry = new THREE.IcosahedronGeometry(1, 2).toNonIndexed()
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const irregularity = 1 + Math.sin(x * 5.6 + z * 3.3) * 0.075 + Math.sin(y * 6.1 - x * 3.9) * 0.055
    positions.setXYZ(i, x * irregularity, y * irregularity, z * irregularity)
  }
  geometry.computeVertexNormals()
  return geometry
})()

const treeCrown = [
  { position: [0, 2.02, 0] as [number, number, number], scale: [0.88, 0.67, 0.76] as [number, number, number], color: '#38733d' },
  { position: [-0.63, 1.95, 0.02] as [number, number, number], scale: [0.64, 0.53, 0.61] as [number, number, number], color: '#2c6638' },
  { position: [0.66, 1.91, -0.05] as [number, number, number], scale: [0.68, 0.54, 0.62] as [number, number, number], color: '#478540' },
  { position: [-0.36, 2.43, -0.16] as [number, number, number], scale: [0.59, 0.5, 0.58] as [number, number, number], color: '#6c9e48' },
  { position: [0.36, 2.4, -0.16] as [number, number, number], scale: [0.58, 0.49, 0.57] as [number, number, number], color: '#578e41' },
  { position: [0.02, 1.8, 0.44] as [number, number, number], scale: [0.61, 0.46, 0.42] as [number, number, number], color: '#4b8240' },
  { position: [-1.02, 1.76, -0.04] as [number, number, number], scale: [0.41, 0.4, 0.46] as [number, number, number], color: '#3b7740' },
  { position: [1.0, 1.78, -0.08] as [number, number, number], scale: [0.43, 0.41, 0.46] as [number, number, number], color: '#528b41' },
  { position: [-0.02, 1.82, -0.42] as [number, number, number], scale: [0.57, 0.45, 0.44] as [number, number, number], color: '#356d3b' },
]

function createTreeCrownGeometry(tint?: string, variant = 0) {
  const positions: number[] = []
  const colors: number[] = []
  const uvs: number[] = []
  const forms: [number, number, number][] = [[1, 1, 1], [0.88, 1.12, 0.94], [1.14, 0.9, 1.08], [0.94, 0.96, 1.16]]
  const form = forms[Math.abs(variant) % forms.length]
  const palette = treeCrown.map((blob, index) => new THREE.Color(index === 0 && tint ? tint : blob.color))
  treeCrown.forEach((blob, blobIndex) => {
    const rotation = new THREE.Euler(0.04 * (blobIndex % 2), blobIndex * 0.31 + variant * 0.21, 0.02 * (variant % 3))
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rotation)
    const color = palette[blobIndex]
    const blobScale = new THREE.Vector3(blob.scale[0] * form[0], blob.scale[1] * form[1], blob.scale[2] * form[2])
    const blobOffset = new THREE.Vector3(blob.position[0] * form[0], blob.position[1] * form[1], blob.position[2] * form[2])
    const sourcePositions = leafBaseGeometry.attributes.position
    const sourceUvs = leafBaseGeometry.attributes.uv
    for (let i = 0; i < sourcePositions.count; i += 1) {
      const point = new THREE.Vector3(sourcePositions.getX(i), sourcePositions.getY(i), sourcePositions.getZ(i))
      point.multiply(blobScale).applyMatrix4(rotationMatrix).add(blobOffset)
      positions.push(point.x, point.y, point.z)
      const normal = new THREE.Vector3(sourcePositions.getX(i), sourcePositions.getY(i), sourcePositions.getZ(i)).normalize()
      const shade = THREE.MathUtils.clamp(0.72 + Math.max(0, normal.y) * 0.27 + Math.max(0, -normal.x * 0.23 + normal.z * 0.16) * 0.14, 0.68, 1.06)
      colors.push(color.r * shade, color.g * shade, color.b * shade)
      uvs.push(sourceUvs.getX(i), sourceUvs.getY(i))
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  return geometry
}

export function StylizedTree({ position, scale = 1, tint, variant = 0 }: {
  position: [number, number, number]
  scale?: number
  tint?: string
  variant?: number
}) {
  const group = useRef<THREE.Group>(null)
  const { scene } = useThree()
  const crownGeometry = useMemo(() => createTreeCrownGeometry(tint, variant), [tint, variant])
  useLayoutEffect(() => {
    if (!group.current) return
    group.current.position.y = position[1]
    const terrain: THREE.Object3D[] = []
    scene.traverse((object) => { if (object.userData.walkableTerrain) terrain.push(object) })
    if (!terrain.length) return
    scene.updateMatrixWorld(true)
    const base = group.current.getWorldPosition(new THREE.Vector3())
    const ray = new THREE.Raycaster(new THREE.Vector3(base.x, 12, base.z), new THREE.Vector3(0, -1, 0), 0, 24)
    const surface = ray.intersectObjects(terrain, true)[0]
    if (surface) group.current.position.y = Math.max(position[1], surface.point.y + 0.012)
  }, [scene, position[0], position[1], position[2]])

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh position={[-0.03, 0.72, 0]} rotation={[0, 0, -0.035]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 1.42, 7]} />
        <meshStandardMaterial color="#795236" roughness={1} flatShading />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={'tree-limb-' + side} position={[side * 0.21, 1.22, 0]} rotation={[0, 0, side * -0.44]} castShadow>
          <cylinderGeometry args={[0.045, 0.09, 0.7, 6]} />
          <meshStandardMaterial color="#795236" roughness={1} flatShading />
        </mesh>
      ))}
      <mesh geometry={crownGeometry} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={getCanopyPaint()} vertexColors roughness={0.98} flatShading />
      </mesh>
    </group>
  )
}

const palmLeafGeometry = (() => {
  const leaf = new THREE.Shape()
  leaf.moveTo(0, 0)
  leaf.quadraticCurveTo(0.48, 0.28, 0.95, 0.16)
  leaf.lineTo(1.58, -0.42)
  leaf.quadraticCurveTo(1.1, -0.08, 0.68, -0.04)
  leaf.quadraticCurveTo(0.32, -0.12, 0, 0)
  leaf.closePath()
  return new THREE.ShapeGeometry(leaf, 5)
})()

export function StylizedPalm({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const group = useRef<THREE.Group>(null)
  const { scene } = useThree()
  useLayoutEffect(() => {
    if (!group.current) return
    group.current.position.y = position[1]
    const terrain: THREE.Object3D[] = []
    scene.traverse((object) => { if (object.userData.walkableTerrain) terrain.push(object) })
    if (!terrain.length) return
    scene.updateMatrixWorld(true)
    const base = group.current.getWorldPosition(new THREE.Vector3())
    const ray = new THREE.Raycaster(new THREE.Vector3(base.x, 12, base.z), new THREE.Vector3(0, -1, 0), 0, 24)
    const surface = ray.intersectObjects(terrain, true)[0]
    if (surface) group.current.position.y = Math.max(position[1], surface.point.y + 0.01)
  }, [scene, position[0], position[1], position[2]])

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh position={[0, 1.22, 0.02]} rotation={[0, 0, -0.07]} castShadow>
        <cylinderGeometry args={[0.11, 0.2, 2.44, 7]} />
        <meshStandardMaterial color="#795437" roughness={1} flatShading />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={'palm-frond-' + i} position={[0, 2.42, 0]} rotation={[0, i * Math.PI / 3, (i % 2 ? -0.03 : 0.04)]}>
          <mesh geometry={palmLeafGeometry} castShadow={false}>
            <meshStandardMaterial color={['#31764a', '#4b9150', '#66a34e'][i % 3]} roughness={0.98} flatShading side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Planter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.33, 0.26, 8]} />
        <meshStandardMaterial color="#b66e47" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.07, 8]} />
        <meshStandardMaterial color="#e1b26c" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <coneGeometry args={[0.17, 0.42, 5]} />
        <meshStandardMaterial color="#57884a" roughness={0.98} flatShading />
      </mesh>
      <mesh position={[0.02, 0.68, 0]}>
        <sphereGeometry args={[0.09, 7, 5]} />
        <meshStandardMaterial color="#e7bd57" roughness={0.95} />
      </mesh>
    </group>
  )
}

export function VillageSetDressing() {
  const trees: [number, number, number, number, string?][] = [
    [-25.3, 0.32, -5.2, 0.92, '#367844'], [-23.5, 0.34, -10.4, 0.68], [-23.6, 0.34, 2.4, 0.74],
    [-19.9, 0.34, -0.1, 0.78], [-18.1, 0.34, -11.8, 0.72], [-14.5, 0.34, 10.5, 0.69],
    [-12.2, 0.34, -11.5, 0.7], [-7.1, 0.34, -11.5, 0.7], [-1.6, 0.34, -11.4, 0.66],
    [5.8, 0.34, -10.2, 0.7], [18.5, 0.34, -8.2, 0.72], [21.4, 0.34, -3.8, 0.88, '#367844'],
    [22.8, 0.34, -7, 0.7], [23.5, 0.34, 1.7, 0.98, '#367844'], [19, 0.34, 7.4, 0.72], [12.1, 0.34, 7.3, 0.68],
  ]
  return (
    <group>
      <StylizedPalm position={[-20.6, 0.32, -8.2]} scale={0.68} />
      <StylizedPalm position={[19.1, 0.32, -8.1]} scale={0.62} />
      {trees.map(([x, y, z, size, tint], i) => (
        <StylizedTree key={'village-tree-' + i} position={[x, y, z]} scale={size} tint={tint} variant={i} />
      ))}
      <Planter position={[7.7, 0.36, 6.4]} />
      <Planter position={[10.9, 0.36, 6.4]} />
      {[
        [-18.7, 0.36, 8.3, 0.35], [-9.4, 0.36, 10.2, 0.32], [6.8, 0.36, 9.6, 0.34],
        [19.8, 0.36, 8.7, 0.4], [-21.8, 0.36, 9.2, 0.34], [2.6, 0.36, 9.7, 0.31],
      ].map(([x, y, z, size], i) => (
        <mesh key={'coastal-stone-' + i} position={[x, y, z]} scale={[size, size * 0.67, size * 0.88]} rotation={[0.04, i * 0.49, -0.04]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? '#8e8c6c' : '#b19a72'} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}
