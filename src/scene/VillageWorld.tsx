import { useFrame, useThree } from '@react-three/fiber'
import { Html, Outlines, Text } from '@react-three/drei'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { portfolioSpots, type PortfolioSpot } from './portfolioData'

// The asymmetric footprint is shaped around the locked three-quarter gameplay camera.
const footprint = new THREE.Shape()
footprint.moveTo(-27, -1)
footprint.bezierCurveTo(-27, 3, -25, 8, -21, 10)
footprint.bezierCurveTo(-16, 13, -10, 11, -5, 12)
footprint.bezierCurveTo(1, 13, 6, 11, 11, 10)
footprint.bezierCurveTo(17, 9, 22, 10, 26, 7)
footprint.bezierCurveTo(28, 4, 26, 0, 24, -3)
footprint.bezierCurveTo(22, -7, 19, -8, 16, -10)
footprint.bezierCurveTo(12, -13, 8, -12, 3, -13)
footprint.bezierCurveTo(-3, -14, -6, -11, -11, -12)
footprint.bezierCurveTo(-16, -13, -20, -10, -24, -8)
footprint.bezierCurveTo(-27, -6, -29, -4, -27, -1)
footprint.closePath()

// Sand occupies the camera-facing coast. Its inland edge follows the irregular
// ground contour; the outer edge deliberately runs beyond the bottom of frame.
const beachShape = new THREE.Shape()
beachShape.moveTo(-25, -7.5)
beachShape.bezierCurveTo(-23, -9, -20, -11, -16, -12.7)
beachShape.bezierCurveTo(-12, -13.4, -8, -10.8, -5, -11.1)
beachShape.bezierCurveTo(-1, -14.1, 2, -13.5, 5, -12.8)
beachShape.bezierCurveTo(9, -12.1, 11, -13.1, 15, -10.5)
beachShape.bezierCurveTo(19, -8.1, 21, -7.4, 24.8, -3.2)
beachShape.lineTo(29, -25)
beachShape.lineTo(-29, -25)
beachShape.closePath()

const islandWalkPolygon = footprint.getPoints(48)
const beachWalkPolygon = beachShape.getPoints(48)

function pointInWorldShape(x: number, z: number, polygon: THREE.Vector2[]) {
  const localY = -z
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i]
    const b = polygon[j]
    const crosses = (a.y > localY) !== (b.y > localY)
      && x < ((b.x - a.x) * (localY - a.y)) / (b.y - a.y) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

const buildingFootprints: Record<string, [number, number]> = {
  'clocktower': [1.5, 1.45],
  'cloud-forge': [2.45, 1.65],
  'data-tower': [2.9, 1.95],
  'learning-lab': [1.55, 1.5],
  'about-cottage': [1.55, 1.3],
  'hobbies-hut': [1.55, 1.25],
  'signal-station': [0.72, 0.72],
}

function canWalkTo(x: number, z: number) {
  const onLand = pointInWorldShape(x, z, islandWalkPolygon) || pointInWorldShape(x, z, beachWalkPolygon)
  if (!onLand) return false
  for (const spot of portfolioSpots) {
    const [halfWidth, halfDepth] = buildingFootprints[spot.id]
    if (Math.abs(x - spot.position[0]) < halfWidth + 0.42 && Math.abs(z - spot.position[2]) < halfDepth + 0.42) return false
  }
  return true
}

const inletShape = new THREE.Shape()
inletShape.moveTo(-31, -9)
inletShape.bezierCurveTo(-28, -12, -25, -13, -22, -12)
inletShape.bezierCurveTo(-20, -11, -19, -9, -18, -7)
inletShape.bezierCurveTo(-22, -8, -25, -7, -28, -5)
inletShape.closePath()

function Island() {
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(footprint, {
    depth: 0.48,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.18,
    bevelThickness: 0.1,
    curveSegments: 12,
  }), [])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial color="#5aaa3c" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function Beach() {
  const sandGeometry = useMemo(() => new THREE.ShapeGeometry(beachShape, 32), [])
  const inletGeometry = useMemo(() => new THREE.ShapeGeometry(inletShape, 16), [])
  const coast = useMemo(() => new THREE.CatmullRomCurve3([
    [-25, 0.13, 7.5], [-22, 0.13, 9.2], [-18, 0.13, 12.3], [-13, 0.13, 13.1],
    [-8, 0.13, 11], [-3, 0.13, 14], [2, 0.13, 13.4], [7, 0.13, 12.2],
    [11, 0.13, 13.2], [16, 0.13, 10.7], [21, 0.13, 8], [25, 0.13, 3.2],
  ].map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.35), [])
  const foamGeometry = useMemo(() => new THREE.TubeGeometry(coast, 120, 0.13, 6, false), [coast])
  const wetSandGeometry = useMemo(() => {
    const line = new THREE.CatmullRomCurve3(coast.points.map((point) => new THREE.Vector3(point.x, 0.305, point.z + 0.58)), false, 'catmullrom', 0.35)
    return new THREE.TubeGeometry(line, 120, 0.43, 7, false)
  }, [coast])
  const outerFoamGeometry = useMemo(() => {
    const line = new THREE.CatmullRomCurve3(coast.points.map((point) => new THREE.Vector3(point.x, 0.105, point.z + 0.31)), false, 'catmullrom', 0.35)
    return new THREE.TubeGeometry(line, 120, 0.065, 6, false)
  }, [coast])

  return (
    <>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.29, 0]}>
        <mesh geometry={sandGeometry} receiveShadow>
          <meshStandardMaterial color="#d4b483" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.245, 0]}>
        <mesh geometry={inletGeometry}>
          <meshBasicMaterial color="#67cbc5" transparent opacity={0.86} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh geometry={wetSandGeometry}>
        <meshBasicMaterial color="#a88d6d" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh geometry={foamGeometry}>
        <meshBasicMaterial color="#e9f3d6" transparent opacity={0.9} />
      </mesh>
      <mesh geometry={outerFoamGeometry}>
        <meshBasicMaterial color="#d8efdf" transparent opacity={0.46} depthWrite={false} />
      </mesh>
      <BeachDetails />
      <SandRidges />
    </>
  )
}

function SandRidges() {
  const bands = useMemo(() => [
    [[-24, 0.305, 19.2], [-18, 0.305, 18.4], [-10, 0.305, 19.4], [-2, 0.305, 18.7], [7, 0.305, 19.8], [16, 0.305, 18.1], [24, 0.305, 15.5]],
    [[-22, 0.304, 22.3], [-14, 0.304, 21.4], [-5, 0.304, 22.5], [4, 0.304, 21.7], [14, 0.304, 21.9], [23, 0.304, 18.9]],
  ].map((points) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), false, 'catmullrom', 0.3)
    return new THREE.TubeGeometry(curve, 64, 0.055, 5, false)
  }), [])
  return (
    <group>
      {bands.map((geometry, i) => (
        <mesh key={`sand-ridge-${i}`} geometry={geometry}>
          <meshBasicMaterial color={i ? '#b39772' : '#e4c99a'} transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function BeachDetails() {
  return (
    <group>
      {/* Low tide rocks and coral accents sit on the near beach, not on the grass. */}
      <mesh position={[-10.5, 0.52, 17]} rotation={[0.15, 0.45, 0.2]} castShadow>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#aa8d6f" roughness={1} flatShading />
      </mesh>
      <mesh position={[-9.8, 0.46, 17.5]} scale={[0.62, 0.7, 0.55]} castShadow>
        <dodecahedronGeometry args={[0.43, 0]} />
        <meshStandardMaterial color="#c4a27c" roughness={1} flatShading />
      </mesh>
      <mesh position={[-3.4, 0.47, 20]} rotation={[0, 0.25, -0.04]} castShadow>
        <dodecahedronGeometry args={[0.48, 0]} />
        <meshStandardMaterial color="#dc806e" roughness={1} flatShading />
      </mesh>
      {/* Broken boat ribs: a few weathered boards rather than a full extra asset. */}
      <group position={[12.5, 0.48, 18]} rotation={[0, -0.25, 0.1]}>
        <mesh castShadow rotation={[0, 0, -0.12]}>
          <boxGeometry args={[3.4, 0.22, 0.38]} />
          <meshStandardMaterial color="#795536" roughness={1} />
        </mesh>
        <mesh castShadow position={[-1.1, 0.24, -0.38]} rotation={[0, 0, 0.17]}>
          <boxGeometry args={[0.24, 0.5, 1.15]} />
          <meshStandardMaterial color="#986a3f" roughness={1} />
        </mesh>
        <mesh castShadow position={[0.9, 0.16, 0.34]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.2, 0.36, 0.92]} />
          <meshStandardMaterial color="#694b31" roughness={1} />
        </mesh>
      </group>
      <Starfish position={[5.4, 0.33, 17.2]} />
      <TideLine />
      <Dock />
    </group>
  )
}

function TideLine() {
  const stones: [number, number, number, number, number, number][] = [
    [-21.2, 0.42, 11.4, 0.5, 0.28, 0.36], [-18.8, 0.39, 12.7, 0.37, 0.22, 0.3],
    [-14.8, 0.4, 13.2, 0.55, 0.26, 0.35], [-10.4, 0.39, 12.4, 0.38, 0.2, 0.28],
    [-5.7, 0.4, 13.2, 0.47, 0.24, 0.32], [0.4, 0.4, 13.6, 0.34, 0.2, 0.26],
    [7.9, 0.4, 12.4, 0.52, 0.26, 0.36], [13.5, 0.41, 11.4, 0.4, 0.24, 0.3],
    [19.2, 0.42, 8.8, 0.53, 0.3, 0.38], [22.6, 0.42, 6.6, 0.42, 0.25, 0.32],
  ]
  return (
    <group>
      {stones.map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={`tide-stone-${i}`} position={[x, y, z]} scale={[sx, sy, sz]} rotation={[0.08, i * 0.61, -0.08]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? '#c4a27c' : '#aa8d6f'} roughness={1} flatShading />
        </mesh>
      ))}
      {[-17, -7.8, 3.8, 16.2].map((x, i) => (
        <mesh key={`wet-sand-${i}`} position={[x, 0.308, 12 + Math.sin(i * 1.2) * 0.75]} rotation={[-Math.PI / 2, 0, i * 0.3]}>
          <circleGeometry args={[0.72 + (i % 2) * 0.28, 16]} />
          <meshBasicMaterial color="#9c8065" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Starfish({ position }: { position: [number, number, number] }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    for (let i = 0; i < 10; i += 1) {
      const angle = Math.PI / 2 + (i * Math.PI) / 5
      const radius = i % 2 === 0 ? 0.62 : 0.25
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()
    return new THREE.ShapeGeometry(shape, 1)
  }, [])
  return (
    <group position={position} rotation={[-Math.PI / 2, 0.18, 0]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#d56f5a" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <circleGeometry args={[0.12, 12]} />
        <meshStandardMaterial color="#f0b083" roughness={1} />
      </mesh>
    </group>
  )
}

function Dock() {
  return (
    <group position={[-23, 0.29, 7]} rotation={[0, -0.16, 0]}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-i * 0.52, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.18, 2.4]} />
          <meshStandardMaterial color={i % 2 ? '#87613f' : '#9a7048'} roughness={1} />
        </mesh>
      ))}
      {[-0.4, 1.6].map((z) => (
        <mesh key={z} position={[-1.5, -0.35, z]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 0.75, 7]} />
          <meshStandardMaterial color="#715237" roughness={1} />
        </mesh>
      ))}
      {[[-1, 0.48, 1.3], [-1.65, 0.45, 1.45]].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.28, 0.33, 0.58, 9]} />
            <meshStandardMaterial color="#b4834c" roughness={1} />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.07, 9]} />
            <meshStandardMaterial color="#e1c88e" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function MapEdgeFraming() {
  return (
    <group>
      {/* Low shore rocks finish both ends of the island silhouette without closing the beach. */}
      {[
        [-25.7, 0.28, 1.8, 1.15, 0.58, 0.82], [-26.4, 0.25, 3.1, 0.78, 0.42, 0.62],
        [25.2, 0.29, -0.2, 1.22, 0.63, 0.9], [26.1, 0.24, 1.2, 0.82, 0.45, 0.68],
      ].map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={`shore-rock-${i}`} position={[x, y, z]} scale={[sx, sy, sz]} rotation={[0.05, i * 0.4, 0.08]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? '#958269' : '#aa9272'} roughness={1} flatShading />
        </mesh>
      ))}
      <Tree position={[24.1, 0.32, -2.8]} scale={0.72} tint="#397f49" />
      <Shrub position={[-25.1, 0.34, 0.4]} scale={0.68} color="#4e9d46" />
      <Shrub position={[25.8, 0.34, 2.5]} scale={0.72} flowers color="#438843" />
    </group>
  )
}

function TerrainRise({ position, scale, color }: {
  position: [number, number, number]
  scale: [number, number, number]
  color: string
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </mesh>
  )
}

function GableRoof({ width, depth, ridge, eave, color }: {
  width: number
  depth: number
  ridge: number
  eave: number
  color: string
}) {
  const rise = ridge - eave
  const halfDepth = depth / 2
  const slope = Math.atan2(rise, halfDepth)
  const slopeLength = Math.hypot(rise, halfDepth)
  const roofCourse = new THREE.Color(color).multiplyScalar(0.78)
  const endGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const vertices = [
      -width / 2, eave, -halfDepth,  width / 2, eave, -halfDepth,  0, ridge, 0,
      -width / 2, eave, halfDepth,   0, ridge, 0,                 width / 2, eave, halfDepth,
    ]
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    return geometry
  }, [width, halfDepth, eave, ridge])

  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[0, (ridge + eave) / 2, side * depth / 4]} rotation={[side * slope, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, 0.16, slopeLength + 0.18]} />
            <meshStandardMaterial color={color} roughness={0.92} flatShading />
            <BuildingInk />
          </mesh>
          {[0.22, 0.48, 0.74].map((t, row) => (
            <mesh key={row} position={[0, 0.095, (t - 0.5) * slopeLength]}>
              <boxGeometry args={[width + 0.04, 0.055, 0.075]} />
              <meshStandardMaterial color={roofCourse} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh geometry={endGeometry} position={[0, 0, depth / 2 + 0.012]}>
        <meshStandardMaterial color="#b87b52" roughness={0.95} side={THREE.DoubleSide} />
        <BuildingInk />
      </mesh>
      <mesh geometry={endGeometry} scale={[1, 1, -1]} position={[0, 0, -depth / 2 - 0.012]}>
        <meshStandardMaterial color="#a96d4b" roughness={0.95} side={THREE.DoubleSide} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, ridge + 0.04, 0]}>
        <boxGeometry args={[width + 0.15, 0.12, 0.16]} />
        <meshStandardMaterial color="#714835" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function BuildingInk() {
  return <Outlines color="#3d1f0a" thickness={0.032} screenspace transparent opacity={0.82} angle={0} />
}

function Cottage({ position, scale = 1, wall = '#bd8655', roof = '#a84f39', playful = false }: {
  position: [number, number, number]
  scale?: number
  wall?: string
  roof?: string
  playful?: boolean
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={playful ? [2.4, 1.75, 1.9] : [2.8, 1.85, 2.1]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
        <BuildingInk />
      </mesh>
      <GableRoof width={playful ? 2.85 : 3.25} depth={playful ? 2.05 : 2.3} ridge={playful ? 2.72 : 3.12} eave={playful ? 1.7 : 1.8} color={roof} />
      <mesh position={[0, 0.61, 1.07]}>
        <boxGeometry args={[0.5, 1.15, 0.08]} />
        <meshStandardMaterial color="#55392c" roughness={1} />
      </mesh>
      {[-0.82, 0.82].map((x) => (
        <group key={x} position={[x, 1.1, 1.08]}>
          <mesh>
            <boxGeometry args={[0.42, 0.44, 0.09]} />
            <meshStandardMaterial color="#f0d080" emissive="#b98a42" emissiveIntensity={0.28} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <boxGeometry args={[0.08, 0.48, 0.025]} />
            <meshStandardMaterial color="#69472f" />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[1, 2.6, -0.35]}>
        <boxGeometry args={[0.38, 0.95, 0.42]} />
        <meshStandardMaterial color="#8b6240" roughness={1} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 0.39, 0]}>
        <boxGeometry args={[3.05, 0.16, 2.36]} />
        <meshStandardMaterial color="#725942" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function Clocktower() {
  return (
    <group position={[-14.7, 0.34, -2.4]}>
      <mesh castShadow receiveShadow position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.92, 1.2, 5.1, 7]} />
        <meshStandardMaterial color="#a7784b" roughness={0.95} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 5.33, 0]}>
        <coneGeometry args={[1.35, 1.45, 7]} />
        <meshStandardMaterial color="#a84b36" roughness={0.9} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 6.55, 0]}>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color="#f3ce58" emissive="#e6a52a" emissiveIntensity={0.65} />
      </mesh>
      <mesh position={[0, 3.75, 0.94]}>
        <boxGeometry args={[0.48, 0.68, 0.08]} />
        <meshStandardMaterial color="#f0d080" emissive="#ca8f38" emissiveIntensity={0.42} />
        <BuildingInk />
      </mesh>
      <group position={[0, 4.08, 1.02]}>
        <mesh>
          <circleGeometry args={[0.59, 16]} />
          <meshStandardMaterial color="#f0dfbb" roughness={1} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.61, 0.075, 6, 16]} />
          <meshStandardMaterial color="#705239" roughness={0.92} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={`clock-mark-${i}`} position={[Math.sin(i * Math.PI / 4) * 0.46, Math.cos(i * Math.PI / 4) * 0.46, 0.02]} rotation={[0, 0, -i * Math.PI / 4]}>
            <boxGeometry args={[0.055, 0.13, 0.035]} />
            <meshStandardMaterial color="#705239" roughness={1} />
          </mesh>
        ))}
        <mesh position={[0.09, 0.04, 0.045]} rotation={[0, 0, -0.78]}>
          <boxGeometry args={[0.045, 0.31, 0.04]} />
          <meshStandardMaterial color="#573b2e" roughness={1} />
          <BuildingInk />
        </mesh>
        <mesh position={[-0.09, -0.08, 0.05]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.04, 0.22, 0.04]} />
          <meshStandardMaterial color="#573b2e" roughness={1} />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <circleGeometry args={[0.075, 10]} />
          <meshStandardMaterial color="#a84b36" roughness={0.9} />
        </mesh>
      </group>
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.28, 1.38, 0.24, 8]} />
        <meshStandardMaterial color="#786344" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function LearningLab() {
  return (
    <group position={[-22.3, 0.38, -1.5]}>
      <mesh castShadow position={[0, 0.82, 0]}>
        <cylinderGeometry args={[1.3, 1.42, 1.65, 9]} />
        <meshStandardMaterial color="#644f9b" roughness={0.75} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 1.85, 0]}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#73dce2" emissive="#34a7d2" emissiveIntensity={1.1} roughness={0.25} />
        <BuildingInk />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.25, 1.35, 0.2, 7]} />
        <meshStandardMaterial color="#4d526e" roughness={0.9} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 0.52, 0]}>
        <cylinderGeometry args={[1.02, 1.18, 0.72, 7]} />
        <meshStandardMaterial color="#735e9d" roughness={0.86} flatShading />
      </mesh>
      {[-0.58, 0, 0.58].map((x, i) => (
        <mesh key={`lab-window-${i}`} position={[x, 0.7, 1.19]} rotation={[0, 0, i === 1 ? 0 : 0.08]}>
          <boxGeometry args={[0.22, 0.32, 0.08]} />
          <meshStandardMaterial color="#f0d080" emissive="#c78d3d" emissiveIntensity={0.36} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function CloudForge() {
  return (
    <group position={[-18, 0.34, 1.1]}>
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <boxGeometry args={[4.2, 1.9, 2.75]} />
        <meshStandardMaterial color="#bd7548" roughness={0.95} />
        <BuildingInk />
      </mesh>
      <GableRoof width={4.8} depth={3.1} ridge={3.55} eave={1.85} color="#b84932" />
      <mesh castShadow position={[1.45, 2.9, -0.5]}>
        <cylinderGeometry args={[0.37, 0.48, 1.7, 7]} />
        <meshStandardMaterial color="#7f4c39" roughness={1} />
        <BuildingInk />
      </mesh>
      <mesh position={[0.68, 1.1, 1.4]}>
        <boxGeometry args={[0.72, 1.4, 0.1]} />
        <meshStandardMaterial color="#573b2e" roughness={1} />
        <BuildingInk />
      </mesh>
      {[-1.3, 1.3].map((x) => (
        <mesh key={`forge-window-${x}`} position={[x, 1.18, 1.39]}>
          <boxGeometry args={[0.5, 0.46, 0.08]} />
          <meshStandardMaterial color="#f0d080" emissive="#c78d3d" emissiveIntensity={0.38} roughness={0.45} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[4.5, 0.2, 3]} />
        <meshStandardMaterial color="#73543c" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function DataTower() {
  return (
    <group position={[-8.8, 0.35, -1.2]}>
      <mesh castShadow receiveShadow position={[0, 1.3, 0]}>
        <boxGeometry args={[5.2, 2.5, 3.3]} />
        <meshStandardMaterial color="#c29a6b" roughness={0.93} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 2.85, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[3.5, 1.75, 4]} />
        <meshStandardMaterial color="#725344" roughness={0.9} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[1.4, 3.5, -0.72]}>
        <boxGeometry args={[1.65, 2, 1.55]} />
        <meshStandardMaterial color="#d4ad7a" roughness={0.92} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[1.4, 4.6, -0.72]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.22, 1.1, 4]} />
        <meshStandardMaterial color="#a9533d" roughness={0.9} flatShading />
        <BuildingInk />
      </mesh>
      <mesh position={[0, 1.03, 1.7]}>
        <boxGeometry args={[0.72, 1.45, 0.08]} />
        <meshStandardMaterial color="#593c2c" roughness={1} />
        <BuildingInk />
      </mesh>
      {[-1.8, -0.8, 0.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 1.75, 1.7]}>
          <boxGeometry args={[0.38, 0.42, 0.08]} />
          <meshStandardMaterial color="#f0d080" emissive="#c78d3d" emissiveIntensity={0.32} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[5.55, 0.2, 3.6]} />
        <meshStandardMaterial color="#766047" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function SignalStation() {
  const beacon = useRef<THREE.MeshStandardMaterial>(null)
  const glow = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.4)
    if (beacon.current) beacon.current.emissiveIntensity = 0.9 + pulse * 1.1
    if (glow.current) {
      const size = 1 + pulse * 0.16
      glow.current.scale.set(size, size, size)
    }
  })
  return (
    <group position={[-1.2, 0.35, 0.1]}>
      <mesh castShadow position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.1, 0.18, 2.7, 7]} />
        <meshStandardMaterial color="#ad8851" roughness={0.86} />
        <BuildingInk />
      </mesh>
      <mesh ref={glow} position={[0, 2.9, 0]}>
        <sphereGeometry args={[0.9, 14, 12]} />
        <meshBasicMaterial color="#ffdc52" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh castShadow position={[0, 2.9, 0]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial ref={beacon} color="#ffd950" emissive="#ffad16" emissiveIntensity={1.4} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0.22, 1.78, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.72, 0.08, 0.08]} />
        <meshStandardMaterial color="#ad8851" roughness={0.86} />
        <BuildingInk />
      </mesh>
      <mesh position={[0.49, 1.62, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.24, 0.48, 3]} />
        <meshStandardMaterial color="#d58a58" roughness={0.95} flatShading />
        <BuildingInk />
      </mesh>
      <group position={[-0.38, 2.2, 0.16]} rotation={[0, 0, -0.22]}>
        <mesh>
          <circleGeometry args={[0.62, 12]} />
          <meshStandardMaterial color="#c1a679" roughness={0.92} side={THREE.DoubleSide} flatShading />
          <BuildingInk />
        </mesh>
        <mesh>
          <torusGeometry args={[0.61, 0.07, 5, 12]} />
          <meshStandardMaterial color="#73563d" roughness={1} />
          <BuildingInk />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#ad8851" roughness={0.86} />
        </mesh>
      </group>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.48, 0.58, 0.16, 8]} />
        <meshStandardMaterial color="#73563d" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function VillageBlockout() {
  return (
    <group>
      <LearningLab />
      <Clocktower />
      <CloudForge />
      <DataTower />
      <Cottage position={[-3.75, 0.34, -2.2]} scale={0.9} wall="#d7b785" roof="#a9533d" />
      <group position={[0.6, 0.34, -3.3]}>
        <Cottage position={[0, 0, 0]} scale={0.76} wall="#c5a16d" roof="#76568c" playful />
        <mesh castShadow position={[0.78, 2.13, 0.82]} rotation={[0.08, 0, -0.22]}>
          <boxGeometry args={[1.35, 0.15, 0.9]} />
          <meshStandardMaterial color="#76568c" roughness={0.92} flatShading />
        </mesh>
        <mesh castShadow position={[0.96, 1.96, 1.16]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.12, 0.33, 0.12]} />
          <meshStandardMaterial color="#714835" roughness={1} />
        </mesh>
      </group>
      <SignalStation />
    </group>
  )
}

function StonePath({ points, radius = 0.24 }: { points: [number, number, number][]; radius?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)), false, 'catmullrom', 0.28,
  ), [points])
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 64, radius, 7, false), [curve, radius])
  return (
    <mesh geometry={geometry} receiveShadow position={[0, 0.015, 0]}>
      <meshStandardMaterial color="#c4b489" roughness={1} />
    </mesh>
  )
}

function FlagstoneApproach() {
  const stones = useMemo(() => {
    const route = new THREE.CatmullRomCurve3([
      [-22.6, 0.37, 7.6], [-18.4, 0.37, 6.5], [-13.2, 0.37, 6.25], [-9.5, 0.37, 5.2], [-7.2, 0.37, 4.7],
    ].map((point) => new THREE.Vector3(...point)), false, 'catmullrom', 0.25)
    const layout: { position: [number, number, number]; rotation: number; scale: [number, number, number]; shade: number }[] = []
    const shades = [0, 1, 2, 3, 4]
    for (let i = 0; i <= 30; i += 1) {
      const t = i / 30
      const point = route.getPoint(t)
      const tangent = route.getTangent(t)
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
      for (let row = -1; row <= 1; row += 1) {
        const jitter = Math.sin(i * 13.1 + row * 7.7) * 0.09
        const center = point.clone().addScaledVector(side, row * 0.52 + jitter)
        const along = (Math.cos(i * 9.2 + row * 3.3) * 0.12)
        center.addScaledVector(tangent, along)
        const scale = 0.86 + (Math.sin(i * 5.4 + row) + 1) * 0.08
        layout.push({
          position: [center.x, center.y + 0.02, center.z],
          rotation: Math.atan2(tangent.x, tangent.z) + jitter * 0.6,
          scale: [scale, 0.13 + (i % 3) * 0.015, 0.72 + (Math.cos(i * 3.4 + row) + 1) * 0.08],
          shade: shades[Math.abs(i * 3 + row) % shades.length],
        })
      }
    }
    return layout
  }, [])
  const colors = ['#968a72', '#a99b7c', '#847e6b', '#b0a07e', '#8c806c']
  return (
    <group>
      {stones.map((stone, i) => (
        <mesh key={`flagstone-${i}`} position={stone.position} rotation={[0, stone.rotation, 0]} scale={stone.scale} receiveShadow castShadow>
          <dodecahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial color={colors[stone.shade]} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function VillageResident({ position, coat, ear }: {
  position: [number, number, number]
  coat: string
  ear: string
}) {
  const tail = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.38, -0.13), new THREE.Vector3(0.42, 0.56, -0.24),
    new THREE.Vector3(0.54, 0.92, -0.26), new THREE.Vector3(0.43, 1.02, -0.26),
  ]), [])
  const tailGeometry = useMemo(() => new THREE.TubeGeometry(tail, 14, 0.09, 6, false), [tail])
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.48, 0]}>
        <capsuleGeometry args={[0.28, 0.44, 4, 8]} />
        <meshStandardMaterial color={coat} roughness={0.92} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 1.08, 0.04]}>
        <sphereGeometry args={[0.4, 12, 10]} />
        <meshStandardMaterial color={coat} roughness={0.9} flatShading />
        <BuildingInk />
      </mesh>
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={`resident-ear-${i}`} castShadow position={[x, 1.4, 0.01]} rotation={[0, 0, i ? -0.18 : 0.18]}>
          <coneGeometry args={[0.14, 0.38, 5]} />
          <meshStandardMaterial color={ear} roughness={0.95} flatShading />
          <BuildingInk />
        </mesh>
      ))}
      {[-0.13, 0.13].map((x, i) => (
        <mesh key={`resident-eye-${i}`} position={[x, 1.09, 0.39]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshBasicMaterial color="#35271f" />
        </mesh>
      ))}
      <mesh position={[0, 0.99, 0.405]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color="#f1d7b4" roughness={1} />
      </mesh>
      <mesh geometry={tailGeometry} castShadow>
        <meshStandardMaterial color={coat} roughness={0.92} />
      </mesh>
    </group>
  )
}

function PalmTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.55, 0]} rotation={[0, 0, -0.08]}>
        <cylinderGeometry args={[0.12, 0.24, 3.1, 7]} />
        <meshStandardMaterial color="#8a6240" roughness={1} flatShading />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const angle = i * Math.PI * 2 / 7
        return (
          <group key={`palm-leaf-${i}`} rotation={[0, angle, 0]}>
            <mesh castShadow position={[0.85, 3.1, 0]} rotation={[0, 0, -0.23]}>
              <boxGeometry args={[1.85, 0.1, 0.2]} />
              <meshStandardMaterial color={i % 2 ? '#438843' : '#4e9d46'} roughness={1} flatShading />
            </mesh>
            <mesh position={[1.52, 2.94, 0]} rotation={[0, 0, -0.08]}>
              <boxGeometry args={[0.6, 0.07, 0.16]} />
              <meshStandardMaterial color="#367d43" roughness={1} flatShading />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function Tree({ position, scale = 1, tint = '#3c8950' }: {
  position: [number, number, number]
  scale?: number
  tint?: string
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.16, 0.25, 1.6, 6]} />
        <meshStandardMaterial color="#8a6240" roughness={1} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 1.7, 0]}>
        <dodecahedronGeometry args={[0.95, 1]} />
        <meshStandardMaterial color={tint} roughness={1} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0.55, 1.45, 0.1]} scale={0.66}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#72b84d" roughness={1} flatShading />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function Shrub({ position, color = '#4e9d46', scale = 1, flowers = false }: {
  position: [number, number, number]
  color?: string
  scale?: number
  flowers?: boolean
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.28, 0]}>
        <dodecahedronGeometry args={[0.46, 1]} />
        <meshStandardMaterial color={color} roughness={1} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0.34, 0.2, 0.08]} scale={0.72}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#76bc4e" roughness={1} flatShading />
        <BuildingInk />
      </mesh>
      {flowers && [[-0.2, 0.57, 0.16], [0.18, 0.6, 0.2], [0.48, 0.48, 0.12]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.12, 8, 7]} />
          <meshStandardMaterial color={i === 1 ? '#ec9ac3' : '#c95b9d'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Barrel({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.34, 0.39, 0.72, 9]} />
        <meshStandardMaterial color="#a97842" roughness={1} />
      </mesh>
      {[0.12, 0.62].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.07, 9]} />
          <meshStandardMaterial color="#504033" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function Crate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.38, 0]}>
        <boxGeometry args={[0.76, 0.76, 0.76]} />
        <meshStandardMaterial color="#9a7046" roughness={1} />
      </mesh>
      <mesh position={[0, 0.38, 0.395]}>
        <boxGeometry args={[0.12, 0.72, 0.035]} />
        <meshStandardMaterial color="#d0a873" roughness={1} />
      </mesh>
    </group>
  )
}

function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.055, 0.09, 1.6, 6]} />
        <meshStandardMaterial color="#6e523a" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 1.62, 0]}>
        <boxGeometry args={[0.3, 0.38, 0.3]} />
        <meshStandardMaterial color="#f3d879" emissive="#f5b93a" emissiveIntensity={0.5} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <coneGeometry args={[0.24, 0.18, 4]} />
        <meshStandardMaterial color="#684b36" />
      </mesh>
    </group>
  )
}

function VillageDetails() {
  const trees: [number, number, number, number, string?][] = [
    [-25.5, 0.32, -5.3, 0.96, '#347e4b'], [-22, 0.34, -5.8, 0.82], [-17.5, 0.34, -5.7, 0.82],
    [-12.2, 0.34, -5.6, 1.02, '#367d43'], [-7.2, 0.34, -5.2, 0.78], [-2.7, 0.34, -6.5, 1.08],
    [10.2, 0.34, -6.5, 1.24, '#397f42'], [15.1, 0.34, -5.2, 1.35, '#347648'],
    [18.2, 0.34, -3.2, 0.96], [22.7, 0.34, -5.5, 1.12, '#347c4a'],
  ]
  const bushes: [number, number, number, number, boolean?][] = [
    [-23, 0.34, 1.8, 0.76, true], [-19.2, 0.34, 3.5, 0.78], [-15, 0.34, 4.4, 0.92, true],
    [-13.1, 0.34, 1.8, 0.68], [-12, 0.34, 0.3, 0.7, true], [-10.2, 0.34, 3.7, 0.9],
    [-8, 0.34, 1.7, 0.68, true], [-6.5, 0.34, 3.8, 0.82, true], [-4.7, 0.34, 0.5, 0.74],
    [-2.8, 0.34, 2.9, 0.8, true], [-0.4, 0.34, 0.5, 0.65], [1.6, 0.34, -1.5, 0.72, true],
    [-19.2, 0.34, -3.7, 0.68], [-17.1, 0.34, -3.7, 0.6, true], [-10, 0.34, -4.3, 0.6],
    [-5, 0.34, -4.5, 0.72, true], [0.8, 0.34, -5.2, 0.75], [4.4, 0.34, -3.2, 0.7, true],
    [6.2, 0.34, -1, 0.9], [7.8, 0.34, 1.8, 0.72, true], [11, 0.34, 3.1, 0.92],
    [14.5, 0.34, 2.5, 0.8, true], [18.1, 0.34, 1.1, 0.82], [20.5, 0.34, 3.4, 0.74, true],
  ]

  return (
    <group>
      {/* Worn stone routes: beach approach to the hub, then short branches. */}
      <FlagstoneApproach />
      <StonePath points={[[-8, 0.39, 10], [-9, 0.39, 7], [-7, 0.39, 5], [-6, 0.39, 3], [-8, 0.39, 1], [-8.8, 0.39, 0.8]]} radius={0.3} />
      <StonePath points={[[-7.1, 0.39, 4.7], [-11, 0.39, 4], [-15, 0.39, 3], [-19.5, 0.39, 2.4]]} radius={0.25} />
      <StonePath points={[[-10.7, 0.39, 3.9], [-15, 0.39, 2], [-19, 0.39, 0], [-21.5, 0.39, -0.4]]} radius={0.21} />
      <StonePath points={[[-7, 0.39, 2.7], [-5.5, 0.39, 1], [-4, 0.39, -0.1], [-3.9, 0.39, -1.5]]} radius={0.22} />
      <StonePath points={[[-3.1, 0.39, 1], [-2, 0.39, 0.5], [-1.1, 0.39, -0.1]]} radius={0.2} />
      <StonePath points={[[-6.9, 0.39, 4.8], [-4, 0.39, 5], [-1, 0.39, 4], [1.5, 0.39, 2.4], [1.2, 0.39, -1.7]]} radius={0.18} />
      {/* A subtle worn meeting patch, not a geometric building layout. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6.9, 0.345, 3.5]}>
        <circleGeometry args={[1.35, 32]} />
        <meshStandardMaterial color="#81b34b" roughness={1} transparent opacity={0.55} />
      </mesh>
      <Text position={[-3.7, 0.43, 6.35]} rotation={[-Math.PI / 2, 0, -0.12]} fontSize={0.48} color="#435837" anchorX="center" anchorY="middle" letterSpacing={0.04}>
        STAR CLIFF
      </Text>
      <Text position={[15.5, 0.43, 4.4]} rotation={[-Math.PI / 2, 0, -0.1]} fontSize={0.46} color="#435837" anchorX="center" anchorY="middle" letterSpacing={0.04}>
        DUSTY BEACH
      </Text>
      <VillageResident position={[-13.1, 0.38, 3.7]} coat="#8a6240" ear="#c78b62" />
      <VillageResident position={[-5.2, 0.38, 4.05]} coat="#d8c5a3" ear="#b9826b" />
      <VillageResident position={[1.05, 0.38, 2.7]} coat="#765b50" ear="#a47c6e" />
      <PalmTree position={[-18.4, 0.32, -7.1]} scale={0.94} />
      <PalmTree position={[11.8, 0.32, -7.7]} scale={0.82} />

      {trees.map(([x, y, z, scale, tint], i) => (
        <Tree key={`tree-${i}`} position={[x, y, z]} scale={scale} tint={tint} />
      ))}
      {bushes.map(([x, y, z, scale, flowers], i) => (
        <Shrub key={`shrub-${i}`} position={[x, y, z]} scale={scale} flowers={flowers} color={i % 5 === 0 ? '#438843' : '#4e9d46'} />
      ))}

      {/* Functional props cluster around the workshop; extras mark the hub approach. */}
      {[
        [-20.2, 0.34, 1.4], [-19.2, 0.34, 1.2], [-19.8, 0.34, 2.05], [-15, 0.34, 2.15],
        [-14.2, 0.34, 2.35], [-13.3, 0.34, 2.05], [-12.6, 0.34, 0.8],
      ].map((p, i) => <Barrel key={`barrel-${i}`} position={p as [number, number, number]} scale={i === 3 ? 0.86 : 1} />)}
      {[
        [-19.5, 0.34, 0.3], [-18.5, 0.34, 0.25], [-14, 0.34, 3.05], [-12.8, 0.34, 2.9],
        [-5.2, 0.34, 0.1], [-3.8, 0.34, 0.1], [1.5, 0.34, 0.4],
      ].map((p, i) => <Crate key={`crate-${i}`} position={p as [number, number, number]} />)}
      {[
        [-18.7, 0.34, 4.5], [-10.8, 0.34, 4.5], [-3.1, 0.34, 3.7], [2.5, 0.34, 1.7],
      ].map((p, i) => <Lantern key={`lantern-${i}`} position={p as [number, number, number]} />)}
    </group>
  )
}

function HeroCharacter({ onOpen }: { onOpen: (spot: PortfolioSpot) => void }) {
  const bob = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Mesh>(null)
  const rightLeg = useRef<THREE.Mesh>(null)
  const leftArm = useRef<THREE.Mesh>(null)
  const rightArm = useRef<THREE.Mesh>(null)
  const pressed = useRef<Record<string, boolean>>({})
  const nearestId = useRef<string | null>(null)
  const { camera } = useThree()
  const [nearby, setNearby] = useState<PortfolioSpot | null>(null)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const code = event.code
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'KeyE', 'Enter'].includes(code)) event.preventDefault()
      pressed.current[code] = true
      if ((code === 'KeyE' || code === 'Enter') && nearby) onOpen(nearby)
    }
    const up = (event: KeyboardEvent) => { pressed.current[event.code] = false }
    const pad = (event: Event) => {
      const { code, down: isDown } = (event as CustomEvent<{ code: string; down: boolean }>).detail
      pressed.current[code] = isDown
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('coastlight:move', pad)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('coastlight:move', pad)
    }
  }, [nearby, onOpen])

  useFrame(({ clock }, delta) => {
    if (bob.current) bob.current.position.y = Math.sin(clock.elapsedTime * 2.2) * 0.055
    if (!root.current) return
    const speed = 6.2 * delta
    const key = (...codes: string[]) => Number(codes.some((code) => pressed.current[code] === true))
    const direction = new THREE.Vector3(
      key('KeyD', 'ArrowRight') - key('KeyA', 'ArrowLeft'),
      0,
      key('KeyS', 'ArrowDown') - key('KeyW', 'ArrowUp'),
    )
    const moving = direction.lengthSq() > 0
    const gait = moving
      ? Math.sin(clock.elapsedTime * 12) * 0.5
      : 0
    if (bob.current) {
      if (moving) {
        const bounce = Math.sin(clock.elapsedTime * 9)
        const lift = Math.max(0, bounce)
        const landing = Math.max(0, -bounce)
        bob.current.position.y = lift * 0.19
        bob.current.scale.set(1 - lift * 0.055 + landing * 0.07, 1 + lift * 0.16 - landing * 0.12, 1 - lift * 0.055 + landing * 0.07)
      } else {
        bob.current.scale.set(1, 1, 1)
      }
    }
    if (leftLeg.current) leftLeg.current.rotation.x = gait
    if (rightLeg.current) rightLeg.current.rotation.x = -gait
    if (leftArm.current) leftArm.current.rotation.x = -gait * 0.75
    if (rightArm.current) rightArm.current.rotation.x = gait * 0.75
    if (direction.lengthSq() > 0) {
      direction.normalize()
      const position = root.current.position
      const dx = direction.x * speed
      const dz = direction.z * speed
      if (canWalkTo(position.x + dx, position.z + dz)) {
        position.x += dx
        position.z += dz
      } else {
        // Preserve responsive controls at walls: accept either clear axis independently.
        if (canWalkTo(position.x + dx, position.z)) position.x += dx
        if (canWalkTo(position.x, position.z + dz)) position.z += dz
      }
      if (bob.current) bob.current.rotation.y = Math.atan2(direction.x, direction.z)
    }

    // Camera follows the player by translation only; its angle and lens stay fixed.
    const player = root.current.position
    const target = new THREE.Vector3(player.x + 3, 0, player.z - 5.5)
    const cameraPosition = new THREE.Vector3(player.x + 3, 8.8, player.z + 27.5)
    camera.position.lerp(cameraPosition, 1 - Math.exp(-4 * delta))
    camera.lookAt(target)

    let closest: PortfolioSpot | null = null
    let closestDistance = 5.6
    for (const spot of portfolioSpots) {
      const distance = Math.hypot(player.x - spot.position[0], player.z - spot.position[2])
      if (distance < closestDistance) {
        closest = spot
        closestDistance = distance
      }
    }
    if (nearestId.current !== (closest?.id ?? null)) {
      nearestId.current = closest?.id ?? null
      setNearby(closest)
    }
  })

  return (
    <group ref={root} position={[-3, 0.34, 5.5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.58, 24]} />
        <meshBasicMaterial color="#294a32" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <group ref={bob}>
        {/* Short legs and rounded body keep the character chibi-proportioned. */}
        <mesh ref={leftLeg} castShadow position={[-0.17, 0.23, 0]}>
          <capsuleGeometry args={[0.12, 0.26, 3, 7]} />
          <meshStandardMaterial color="#8b573a" roughness={0.9} />
          <BuildingInk />
        </mesh>
        <mesh ref={rightLeg} castShadow position={[0.17, 0.23, 0]}>
          <capsuleGeometry args={[0.12, 0.26, 3, 7]} />
          <meshStandardMaterial color="#8b573a" roughness={0.9} />
          <BuildingInk />
        </mesh>
        <mesh castShadow position={[0, 0.72, 0]}>
          <capsuleGeometry args={[0.3, 0.45, 4, 8]} />
          <meshStandardMaterial color="#c17936" roughness={0.9} />
          <BuildingInk />
        </mesh>
        <mesh castShadow position={[0, 0.55, -0.08]} rotation={[0.08, 0, 0]}>
          <coneGeometry args={[0.48, 0.8, 5]} />
          <meshStandardMaterial color="#d7c18c" roughness={1} />
        </mesh>
        {/* Head is deliberately about 44% of total character height. */}
        <mesh castShadow position={[0, 1.45, 0.04]}>
          <sphereGeometry args={[0.56, 16, 14]} />
          <meshStandardMaterial color="#f4ad39" roughness={0.82} flatShading />
          <BuildingInk />
        </mesh>
        {[-0.36, 0.36].map((x, i) => (
          <mesh key={`ear-${i}`} castShadow position={[x, 1.88, 0.02]} rotation={[0, 0, x < 0 ? 0.22 : -0.22]}>
            <coneGeometry args={[0.23, 0.66, 5]} />
            <meshStandardMaterial color="#e88d33" roughness={0.9} flatShading />
          <BuildingInk />
          </mesh>
        ))}
        {[-0.2, 0.2].map((x, i) => (
          <group key={`eye-${i}`} position={[x, 1.49, 0.51]}>
            <mesh>
              <sphereGeometry args={[0.105, 12, 10]} />
              <meshStandardMaterial color="#fff5d9" roughness={0.4} />
            </mesh>
            <mesh position={[0.015, -0.012, 0.084]}>
              <sphereGeometry args={[0.061, 10, 8]} />
              <meshBasicMaterial color="#30251e" />
            </mesh>
            <mesh position={[0.03, 0.02, 0.132]}>
              <sphereGeometry args={[0.022, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.29, 0.545]}>
          <sphereGeometry args={[0.13, 12, 9]} />
          <meshStandardMaterial color="#fff0d5" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.34, 0.665]}>
          <sphereGeometry args={[0.055, 9, 7]} />
          <meshStandardMaterial color="#49332c" roughness={0.8} />
        </mesh>
        {[-0.33, 0.33].map((x, i) => (
          <mesh key={`cheek-${i}`} position={[x, 1.27, 0.49]}>
            <sphereGeometry args={[0.09, 9, 7]} />
            <meshBasicMaterial color="#ee8a78" transparent opacity={0.8} />
          </mesh>
        ))}
        {/* Little pack and shoulder strap add a readable adventurer silhouette. */}
        <mesh castShadow position={[0, 0.78, -0.3]}>
          <boxGeometry args={[0.45, 0.5, 0.24]} />
          <meshStandardMaterial color="#805239" roughness={1} />
        </mesh>
        <mesh castShadow position={[0.29, 0.77, 0.04]} rotation={[0, 0, -0.35]}>
          <capsuleGeometry args={[0.07, 0.38, 3, 6]} />
          <meshStandardMaterial color="#e4d7b8" roughness={1} />
        </mesh>
        <mesh ref={leftArm} castShadow position={[-0.36, 0.78, 0.02]} rotation={[0, 0, 0.55]}>
          <capsuleGeometry args={[0.1, 0.32, 3, 6]} />
          <meshStandardMaterial color="#c17936" roughness={0.9} />
        </mesh>
        <mesh ref={rightArm} castShadow position={[0.38, 0.82, 0.02]} rotation={[0, 0, -0.55]}>
          <capsuleGeometry args={[0.1, 0.32, 3, 6]} />
          <meshStandardMaterial color="#c17936" roughness={0.9} />
        </mesh>
      </group>
      {nearby && (
        <Html position={[nearby.position[0] - root.current!.position.x, 2.8, nearby.position[2] - root.current!.position.z]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div className="world-prompt"><span>{nearby.section}</span><strong>{nearby.title}</strong><kbd>E</kbd></div>
        </Html>
      )}
    </group>
  )
}

function SkyBackdrop() {
  const geometry = useMemo(() => {
    const sky = new THREE.PlaneGeometry(320, 120, 1, 32)
    const positions = sky.attributes.position
    const colors: number[] = []
    const horizon = new THREE.Color('#b8e8e9')
    const middle = new THREE.Color('#74d0e2')
    const zenith = new THREE.Color('#48b5d8')
    for (let i = 0; i < positions.count; i += 1) {
      const t = THREE.MathUtils.clamp((positions.getY(i) + 60) / 120, 0, 1)
      const color = t < 0.48
        ? horizon.clone().lerp(middle, t / 0.48)
        : middle.clone().lerp(zenith, (t - 0.48) / 0.52)
      colors.push(color.r, color.g, color.b)
    }
    sky.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return sky
  }, [])
  return (
    <mesh geometry={geometry} position={[0, 59, -104]} renderOrder={-10}>
      <meshBasicMaterial vertexColors toneMapped={false} fog={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function OceanGlints() {
  const glints = useRef<THREE.Group>(null)
  const streaks = useMemo(() => [
    [-31, -25, 1.5], [-24, -20, 2.2], [-15, -29, 1.2], [-7, -23, 1.8], [2, -32, 2.4],
    [10, -25, 1.4], [18, -30, 2], [27, -22, 1.5], [-35, -34, 2.3], [-2, -18, 1.1],
    [22, -17, 1.3], [35, -31, 1.8],
  ] as const, [])
  useFrame(({ clock }) => {
    if (!glints.current) return
    glints.current.children.forEach((child, i) => {
      child.position.x = streaks[i][0] + Math.sin(clock.elapsedTime * 0.12 + i * 1.4) * 0.24
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
      material.opacity = 0.1 + (0.5 + 0.5 * Math.sin(clock.elapsedTime * 0.7 + i * 1.7)) * 0.16
    })
  })
  return (
    <group ref={glints}>
      {streaks.map(([x, z, length], i) => (
        <mesh key={`water-glint-${i}`} position={[x, -0.225, z]} rotation={[-Math.PI / 2, 0, Math.sin(i * 4.1) * 0.07]}>
          <planeGeometry args={[length, 0.055 + (i % 3) * 0.025]} />
          <meshBasicMaterial color={i % 3 ? '#c6e9da' : '#e1f0cf'} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Ocean() {
  const oceanGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(180, 180, 1, 80)
    const positions = geometry.attributes.position
    const colors: number[] = []
    const near = new THREE.Color('#3aa8b0')
    const far = new THREE.Color('#1a6f7a')
    for (let i = 0; i < positions.count; i += 1) {
      const t = THREE.MathUtils.clamp((positions.getY(i) + 90) / 180, 0, 1)
      const color = near.clone().lerp(far, t)
      colors.push(color.r, color.g, color.b)
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geometry
  }, [])

  return (
    <>
      <SkyBackdrop />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.27, -5]} receiveShadow>
        <primitive object={oceanGeometry} attach="geometry" />
        <meshStandardMaterial vertexColors roughness={0.4} metalness={0.02} />
      </mesh>
      <OceanGlints />
      <group position={[0, 1.45, -30]}>
        {[-29, -21, -12, -2, 8, 19, 29].map((x, i) => (
          <mesh key={x} position={[x, (i % 3) * 0.35, 0]} scale={[5 + (i % 2) * 2, 0.75 + (i % 3) * 0.25, 0.8]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={i % 2 ? '#67b9b8' : '#58aeb3'} transparent opacity={0.64} />
          </mesh>
        ))}
      </group>
      <DistantPeaks />
      <FarIslands />
      <group>
        {[
          [-25, 11.4, -21, 1.1], [-8, 13.2, -26, 0.84], [10, 11.7, -20, 1.2],
          [25, 13.1, -25, 0.95], [0, 14.3, -34, 0.76], [-34, 13.2, -37, 1.15],
          [34, 12.4, -35, 1.05], [-15, 15.2, -43, 0.82], [17, 14.8, -46, 0.9],
        ].map(([x, y, z, size], i) => (
          <FlowingCloud key={`cloud-${i}`} position={[x, y, z]} scale={size} phase={i * 1.17} drift={i % 2 ? -1.35 : 1.65}>
            <mesh position={[-1.2, 0, 0]} scale={[1.75, 0.75, 0.5]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#e9ffff" transparent opacity={0.82} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.48, 0]} scale={[1.05, 0.95, 0.52]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#f7ffff" transparent opacity={0.88} depthWrite={false} />
            </mesh>
            <mesh position={[1.1, 0.08, 0]} scale={[1.4, 0.68, 0.48]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#dff7f5" transparent opacity={0.78} depthWrite={false} />
            </mesh>
          </FlowingCloud>
        ))}
      </group>
    </>
  )
}

function DistantPeaks() {
  const peaks: [number, number, number, number, number, string][] = [
    [-29, 0.15, -38, 4.7, 2.7, '#58aeb3'], [-22, 0.35, -39, 3.4, 3.2, '#67b9b8'],
    [-12, 0.2, -40, 5.6, 3.7, '#58aeb3'], [-2, 0.1, -42, 3.7, 2.7, '#67b9b8'],
    [9, 0.22, -40, 4.6, 3.4, '#58aeb3'], [20, 0.12, -39, 5.1, 2.9, '#67b9b8'],
    [30, 0.25, -37, 4, 2.5, '#58aeb3'],
  ]
  return (
    <group>
      <PalmTree position={[-20, 1.0, -34]} scale={0.42} />
      <PalmTree position={[21, 1.15, -33]} scale={0.38} />
      {peaks.map(([x, y, z, radius, height, color], i) => (
        <group key={`distant-peak-${i}`} position={[x, y, z]}>
          <mesh position={[0, height * 0.38, 0]} scale={[1.45, 0.84, 0.75]}>
            <coneGeometry args={[radius, height, i % 2 ? 5 : 4]} />
            <meshBasicMaterial color={color} transparent opacity={0.56} depthWrite={false} />
          </mesh>
          <mesh position={[radius * 0.48, height * 0.28, -0.08]} scale={[0.92, 0.68, 0.72]}>
            <coneGeometry args={[radius * 0.72, height * 0.76, 5]} />
            <meshBasicMaterial color={i % 2 ? '#58aeb3' : '#67b9b8'} transparent opacity={0.38} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function FlowingCloud({ children, position, scale, phase, drift }: {
  children: ReactNode
  position: [number, number, number]
  scale: number
  phase: number
  drift: number
}) {
  const cloud = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!cloud.current) return
    const time = clock.elapsedTime
    cloud.current.position.x = position[0] + Math.sin(time * 0.075 + phase) * drift
    cloud.current.position.y = position[1] + Math.sin(time * 0.16 + phase) * 0.1
  })
  return <group ref={cloud} position={position} scale={scale}>{children}</group>
}

function FarIslands() {
  const back = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-65, -1)
    shape.lineTo(-65, 1.1)
    shape.lineTo(-56, 1.1)
    shape.lineTo(-52, 2.4)
    shape.lineTo(-47, 1.35)
    shape.lineTo(-42, 2.1)
    shape.lineTo(-37, 1.2)
    shape.lineTo(-31, 2.6)
    shape.lineTo(-26, 1.3)
    shape.lineTo(-18, 2)
    shape.lineTo(-12, 1.15)
    shape.lineTo(-4, 2.2)
    shape.lineTo(3, 1.05)
    shape.lineTo(12, 2.35)
    shape.lineTo(19, 1.25)
    shape.lineTo(29, 2.3)
    shape.lineTo(37, 1.15)
    shape.lineTo(46, 2)
    shape.lineTo(53, 1.2)
    shape.lineTo(65, 2.1)
    shape.lineTo(65, -1)
    shape.closePath()
    return new THREE.ShapeGeometry(shape, 1)
  }, [])
  const distant = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-65, -1)
    shape.lineTo(-65, 0.7)
    shape.lineTo(-57, 1.45)
    shape.lineTo(-50, 0.8)
    shape.lineTo(-40, 1.5)
    shape.lineTo(-32, 0.65)
    shape.lineTo(-21, 1.25)
    shape.lineTo(-10, 0.6)
    shape.lineTo(1, 1.4)
    shape.lineTo(12, 0.75)
    shape.lineTo(23, 1.35)
    shape.lineTo(34, 0.65)
    shape.lineTo(46, 1.5)
    shape.lineTo(55, 0.75)
    shape.lineTo(65, 1.35)
    shape.lineTo(65, -1)
    shape.closePath()
    return new THREE.ShapeGeometry(shape, 1)
  }, [])
  return (
    <group>
      <mesh geometry={distant} position={[0, 0.25, -67]}>
        <meshBasicMaterial color="#428f9a" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={back} position={[0, 0.3, -58]}>
        <meshBasicMaterial color="#58aeb3" transparent opacity={0.34} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function VillageWorld({ onOpen }: { onOpen: (spot: PortfolioSpot) => void }) {
  return (
    <group>
      <Ocean />
      <Island />
      <Beach />
      <MapEdgeFraming />
      {/* Broad low rises establish the future rear-left / rear-right skyline. */}
      <TerrainRise position={[-15, 0.45, -4]} scale={[5.8, 1.05, 2.5]} color="#76b744" />
      <TerrainRise position={[13, 0.45, -5.2]} scale={[6.2, 1.2, 3]} color="#6eaa40" />
      <VillageBlockout />
      <VillageDetails />
      <HeroCharacter onOpen={onOpen} />
    </group>
  )
}
