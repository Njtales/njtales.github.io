import { useFrame, useThree } from '@react-three/fiber'
import { Html, Outlines, Text } from '@react-three/drei'
import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
  'clocktower': [1.72, 1.55],
  'cloud-forge': [2.45, 1.65],
  'data-tower': [1.7, 1.65],
  'learning-lab': [1.95, 1.65],
  'about-cottage': [1.9, 1.85],
  'hobbies-hut': [1.75, 1.7],
  'signal-station': [1.12, 1.05],
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
    <mesh position={position} scale={scale} castShadow receiveShadow userData={{ walkableTerrain: true }}>
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

function TreeInk() {
  return <Outlines color="#315634" thickness={0.021} screenspace transparent opacity={0.72} angle={0} />
}

function VillageDoor({ position, width, height, color = '#654633', trim = '#b99a69' }: {
  position: [number, number, number]
  width: number
  height: number
  color?: string
  trim?: string
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0, -0.025]}>
        <boxGeometry args={[width + 0.14, height + 0.12, 0.1]} />
        <meshStandardMaterial color={trim} roughness={0.86} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 0, 0.035]}>
        <boxGeometry args={[width, height, 0.065]} />
        <meshStandardMaterial color={color} roughness={0.9} />
        <BuildingInk />
      </mesh>
      {[-0.27, 0, 0.27].map((fraction, i) => (
        <mesh key={`door-plank-${i}`} position={[fraction * width, 0, 0.074]}>
          <boxGeometry args={[0.018, height * 0.82, 0.012]} />
          <meshStandardMaterial color={trim} roughness={1} />
        </mesh>
      ))}
      {[height * 0.28, -height * 0.31].map((y, i) => (
        <mesh key={`door-brace-${i}`} position={[0, y, 0.078]}>
          <boxGeometry args={[width * 0.82, 0.045, 0.018]} />
          <meshStandardMaterial color={trim} roughness={0.88} />
        </mesh>
      ))}
      <mesh castShadow position={[width * 0.32, -0.015, 0.092]}>
        <sphereGeometry args={[Math.min(0.055, width * 0.1), 9, 7]} />
        <meshStandardMaterial color="#d9b86f" metalness={0.35} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0, -height / 2 - 0.08, 0.055]}>
        <boxGeometry args={[width + 0.3, 0.13, 0.34]} />
        <meshStandardMaterial color="#95856a" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function AboutCottage() {
  return (
    <group position={[6.8, 0.34, 4.5]} scale={0.9}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]} rotation={[0, 0, -0.025]}>
        <boxGeometry args={[2.65, 1.8, 2.05]} />
        <meshStandardMaterial color="#d7b785" roughness={0.96} />
        <BuildingInk />
      </mesh>
      <GableRoof width={3.32} depth={2.35} ridge={3.08} eave={1.75} color="#a9533d" />
      <mesh castShadow position={[0.22, 0.48, 1.57]}>
        <boxGeometry args={[2.8, 0.16, 1.05]} />
        <meshStandardMaterial color="#805c3c" roughness={1} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0.16, 2.02, 1.62]} rotation={[0.04, 0, 0.035]}>
        <boxGeometry args={[2.9, 0.18, 1.15]} />
        <meshStandardMaterial color="#bd7548" roughness={0.95} />
        <BuildingInk />
      </mesh>
      {[-1.02, 1.18].map((x) => (
        <mesh key={`porch-post-${x}`} castShadow position={[x, 1.25, 1.92]} rotation={[0, 0, x < 0 ? -0.025 : 0.025]}>
          <cylinderGeometry args={[0.075, 0.095, 1.48, 6]} />
          <meshStandardMaterial color="#795638" roughness={1} />
          <BuildingInk />
        </mesh>
      ))}
      <VillageDoor position={[0.26, 0.73, 1.12]} width={0.48} height={1.22} />
      {[-0.88, 0.92].map((x) => (
        <group key={`about-window-${x}`} position={[x, 1.2, 1.055]}>
          <mesh>
            <boxGeometry args={[0.48, 0.47, 0.08]} />
            <meshStandardMaterial color="#f0d080" emissive="#b98a42" emissiveIntensity={0.3} roughness={0.5} />
            <BuildingInk />
          </mesh>
          <mesh position={[0, -0.34, 0.07]}>
            <boxGeometry args={[0.66, 0.13, 0.2]} />
            <meshStandardMaterial color="#70533a" roughness={1} />
          </mesh>
          {[-0.18, 0, 0.18].map((flowerX, i) => (
            <mesh key={`planter-flower-${x}-${i}`} position={[flowerX, -0.19, 0.13]}>
              <sphereGeometry args={[0.095, 7, 5]} />
              <meshStandardMaterial color={i === 1 ? '#e8c94f' : '#dc786e'} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh castShadow position={[-1.04, 2.62, -0.48]} rotation={[0, 0, -0.16]}>
        <boxGeometry args={[0.42, 1.08, 0.48]} />
        <meshStandardMaterial color="#805b3d" roughness={1} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[1.42, 2.15, 1.48]}>
        <boxGeometry args={[0.1, 0.42, 0.1]} />
        <meshStandardMaterial color="#60442f" />
      </mesh>
      <mesh position={[1.42, 1.88, 1.56]}>
        <octahedronGeometry args={[0.23, 0]} />
        <meshStandardMaterial color="#f2bd54" emissive="#d88c31" emissiveIntensity={0.65} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[3.08, 0.14, 2.42]} />
        <meshStandardMaterial color="#725942" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function HobbiesHut() {
  const hut = useRef<THREE.Group>(null)
  const { scene } = useThree()

  useLayoutEffect(() => {
    if (!hut.current) return
    hut.current.position.y = 0.34
    const terrain: THREE.Object3D[] = []
    scene.traverse((object) => {
      if (object.userData.walkableTerrain) terrain.push(object)
    })
    if (!terrain.length) return
    scene.updateMatrixWorld(true)
    const base = hut.current.getWorldPosition(new THREE.Vector3())
    const ray = new THREE.Raycaster(new THREE.Vector3(base.x, 12, base.z), new THREE.Vector3(0, -1, 0), 0, 24)
    const surface = ray.intersectObjects(terrain, true)[0]
    if (surface) hut.current.position.y = Math.max(0.34, surface.point.y - 0.04)
  }, [scene])

  return (
    <group ref={hut} position={[12, 0.34, -4.5]} scale={0.82}>
      <mesh castShadow receiveShadow position={[0, 0.84, 0]}>
        <cylinderGeometry args={[1.12, 1.28, 1.62, 9]} />
        <meshStandardMaterial color="#c5a16d" roughness={0.96} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 1.65, 0]}>
        <cylinderGeometry args={[1.45, 1.5, 0.2, 11]} />
        <meshStandardMaterial color="#714b76" roughness={0.94} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 1.72, 0]}>
        <sphereGeometry args={[1.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#76568c" roughness={0.88} flatShading side={THREE.DoubleSide} />
        <BuildingInk />
      </mesh>
      <VillageDoor position={[0.26, 0.64, 1.29]} width={0.43} height={0.92} color="#634633" trim="#bda477" />
      {[-0.53, 0.56].map((x, i) => (
        <group key={`hobby-porthole-${i}`} position={[x, 1.02, 1.16]}>
          <mesh>
            <circleGeometry args={[0.22, 10]} />
            <meshStandardMaterial color={i ? '#f2bd54' : '#79d5d1'} emissive={i ? '#bc793a' : '#237a83'} emissiveIntensity={0.22} />
            <BuildingInk />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <torusGeometry args={[0.24, 0.045, 5, 10]} />
            <meshStandardMaterial color="#493544" roughness={1} />
          </mesh>
        </group>
      ))}
      <group position={[0.94, 2.15, 0.68]} rotation={[0, 0, -0.42]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.075, 0.11, 0.82, 6]} />
          <meshStandardMaterial color="#d38b55" roughness={0.88} />
          <BuildingInk />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <coneGeometry args={[0.14, 0.25, 5]} />
          <meshStandardMaterial color="#e6c873" roughness={0.8} />
          <BuildingInk />
        </mesh>
        <mesh position={[0, -0.37, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.11, 0.18, 5]} />
          <meshStandardMaterial color="#79513a" roughness={0.9} />
        </mesh>
      </group>
      <mesh castShadow position={[0, 0.14, 0]}>
        <cylinderGeometry args={[1.28, 1.36, 0.22, 9]} />
        <meshStandardMaterial color="#70573f" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function Clocktower() {
  return (
    <group position={[-3.1, 0.34, -7]}>
      <mesh castShadow receiveShadow position={[0, 0.95, 0]}>
        <cylinderGeometry args={[1.05, 1.36, 1.9, 8]} />
        <meshStandardMaterial color="#90734f" roughness={0.96} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 3.7, 0]}>
        <cylinderGeometry args={[0.77, 0.96, 3.65, 8]} />
        <meshStandardMaterial color="#a7784b" roughness={0.95} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 5.68, 0]}>
        <cylinderGeometry args={[1.16, 0.82, 0.3, 8]} />
        <meshStandardMaterial color="#725942" roughness={1} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 6.18, 0]}>
        <coneGeometry args={[1.28, 1.05, 8]} />
        <meshStandardMaterial color="#a84b36" roughness={0.9} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 6.88, 0]}>
        <coneGeometry args={[0.82, 0.72, 7]} />
        <meshStandardMaterial color="#bd7548" roughness={0.92} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 7.28, 0]}>
        <cylinderGeometry args={[0.035, 0.06, 0.72, 8]} />
        <meshStandardMaterial color="#d4a453" metalness={0.32} roughness={0.52} />
      </mesh>
      <mesh castShadow position={[0, 7.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.78, 7]} />
        <meshStandardMaterial color="#725239" metalness={0.2} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.44, 7.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.105, 0.22, 4]} />
        <meshStandardMaterial color="#d6ad5e" roughness={0.72} />
      </mesh>
      <mesh position={[0, 7.48, 0]}>
        <sphereGeometry args={[0.075, 8, 6]} />
        <meshStandardMaterial color="#f0cb75" metalness={0.32} roughness={0.42} />
      </mesh>
      <mesh castShadow position={[0.96, 1.02, 0.05]} rotation={[0, 0, 0.035]}>
        <boxGeometry args={[0.82, 1.55, 1.03]} />
        <meshStandardMaterial color="#9b7049" roughness={0.98} />
        <BuildingInk />
      </mesh>
      <mesh position={[0.97, 1.0, 0.59]}>
        <boxGeometry args={[0.32, 0.78, 0.08]} />
        <meshStandardMaterial color="#f0d080" emissive="#ca8f38" emissiveIntensity={0.34} />
        <BuildingInk />
      </mesh>
      <mesh position={[0, 4.08, 0.83]}>
        <circleGeometry args={[0.72, 16]} />
        <meshStandardMaterial color="#f0dfbb" roughness={1} />
        <BuildingInk />
      </mesh>
      <mesh position={[0, 4.08, 0.86]}>
        <torusGeometry args={[0.76, 0.095, 6, 16]} />
        <meshStandardMaterial color="#634532" roughness={0.92} />
        <BuildingInk />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`clock-mark-${i}`} position={[Math.sin(i * Math.PI / 4) * 0.59, 4.08 + Math.cos(i * Math.PI / 4) * 0.59, 0.9]} rotation={[0, 0, -i * Math.PI / 4]}>
          <boxGeometry args={[0.055, 0.14, 0.035]} />
          <meshStandardMaterial color="#705239" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0.09, 4.12, 0.92]} rotation={[0, 0, -0.78]}>
        <boxGeometry args={[0.05, 0.38, 0.04]} />
        <meshStandardMaterial color="#573b2e" roughness={1} />
        <BuildingInk />
      </mesh>
      <mesh position={[-0.12, 3.98, 0.92]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.045, 0.26, 0.04]} />
        <meshStandardMaterial color="#573b2e" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.3, 6.05, 0.62]}>
        <boxGeometry args={[0.38, 0.62, 0.1]} />
        <meshStandardMaterial color="#49352e" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.34, 1.45, 0.24, 8]} />
        <meshStandardMaterial color="#786344" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function LearningLab() {
  const domeRibs = useMemo(() => [-0.78, -0.39, 0, 0.39, 0.78].map((x) => {
    const halfArc = Math.sqrt(1.46 ** 2 - x ** 2)
    const points = Array.from({ length: 9 }, (_, i) => {
      const y = (i / 8) * halfArc
      const z = Math.sqrt(Math.max(0, 1.46 ** 2 - x ** 2 - y ** 2))
      return new THREE.Vector3(x, 1.75 + y, z)
    })
    const curve = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(curve, 20, 0.035, 5, false)
  }), [])
  return (
    <group position={[-11.5, 0.38, 4]}>
      <mesh castShadow receiveShadow position={[0, 0.88, 0]}>
        <cylinderGeometry args={[1.24, 1.42, 1.75, 9]} />
        <meshStandardMaterial color="#695990" roughness={0.84} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 0.14, 0]}>
        <cylinderGeometry args={[1.34, 1.45, 0.24, 9]} />
        <meshStandardMaterial color="#4d526e" roughness={0.9} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 1.75, 0]}>
        <sphereGeometry args={[1.46, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#86d8d0" transparent opacity={0.64} roughness={0.28} side={THREE.DoubleSide} depthWrite={false} />
        <BuildingInk />
      </mesh>
      <mesh position={[0, 1.76, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.43, 0.08, 6, 14]} />
        <meshStandardMaterial color="#76bdb2" roughness={0.8} />
        <BuildingInk />
      </mesh>
      {domeRibs.map((geometry, i) => (
        <mesh key={`lab-dome-rib-${i}`} geometry={geometry}>
          <meshStandardMaterial color="#d2f0d3" roughness={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[-1.48, 0.92, -0.25]} rotation={[0, 0, -0.035]}>
        <boxGeometry args={[0.82, 1.28, 1.34]} />
        <meshStandardMaterial color="#826d9d" roughness={0.88} />
        <BuildingInk />
      </mesh>
      <mesh position={[-1.48, 0.9, 0.45]}>
        <boxGeometry args={[0.43, 0.58, 0.08]} />
        <meshStandardMaterial color="#91e2db" emissive="#388e91" emissiveIntensity={0.3} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[1.18, 1.16, 0.98]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.11, 0.11, 1.18, 7]} />
        <meshStandardMaterial color="#9bdcc6" transparent opacity={0.8} roughness={0.25} />
        <BuildingInk />
      </mesh>
      <mesh position={[1.18, 1.0, 1.04]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshStandardMaterial color="#f0ce68" emissive="#d28e39" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[1.18, 1.42, 1.04]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#d98c83" emissive="#aa524b" emissiveIntensity={0.25} />
      </mesh>
      <VillageDoor position={[0, 0.72, 1.3]} width={0.5} height={0.8} color="#58645b" trim="#b8a274" />
      <mesh position={[0.05, 2.95, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#73dce2" emissive="#34a7d2" emissiveIntensity={0.75} roughness={0.25} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function CloudForge() {
  return (
    <group position={[-6.7, 0.34, -1.7]}>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[4.05, 2, 2.72]} />
        <meshStandardMaterial color="#b8754d" roughness={0.96} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 2.26, 0]} rotation={[0.035, 0.015, -0.035]}>
        <cylinderGeometry args={[2.08, 2.44, 0.48, 8]} />
        <meshStandardMaterial color="#a94e3b" roughness={0.92} flatShading />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[-1.35, 3.12, -0.55]} rotation={[0.03, 0, -0.08]}>
        <cylinderGeometry args={[0.38, 0.48, 1.42, 7]} />
        <meshStandardMaterial color="#765447" roughness={1} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[-1.35, 3.88, -0.55]}>
        <cylinderGeometry args={[0.48, 0.48, 0.16, 7]} />
        <meshStandardMaterial color="#51443a" roughness={1} />
        <BuildingInk />
      </mesh>
      <group position={[1.2, 2.76, -0.52]} rotation={[0, 0, 0.18]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.29, 0.38, 1.15, 7]} />
          <meshStandardMaterial color="#765447" roughness={1} />
          <BuildingInk />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.14, 7]} />
          <meshStandardMaterial color="#51443a" roughness={1} />
          <BuildingInk />
        </mesh>
      </group>
      <VillageDoor position={[-0.72, 0.78, 1.47]} width={0.84} height={1.12} color="#49372d" trim="#8d6448" />
      <mesh position={[-0.72, 0.76, 1.5]}>
        <torusGeometry args={[0.35, 0.095, 7, 14, Math.PI]} />
        <meshStandardMaterial color="#f09d39" emissive="#e06f1e" emissiveIntensity={0.76} />
        <BuildingInk />
      </mesh>
      <mesh position={[1.24, 1.12, 1.38]}>
        <boxGeometry args={[0.52, 1.38, 0.08]} />
        <meshStandardMaterial color="#50382e" roughness={1} />
        <BuildingInk />
      </mesh>
      {[-1.72, 1.72].map((x) => (
        <mesh key={`forge-window-${x}`} position={[x, 1.36, 1.38]}>
          <boxGeometry args={[0.44, 0.42, 0.08]} />
          <meshStandardMaterial color="#f0d080" emissive="#c78d3d" emissiveIntensity={0.36} roughness={0.45} />
          <BuildingInk />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[4.42, 0.2, 3.08]} />
        <meshStandardMaterial color="#604c3b" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function DataTower() {
  return (
    <group position={[4.2, 0.35, -4.8]}>
      <mesh castShadow receiveShadow position={[0, 0.82, 0]} rotation={[0, 0, -0.015]}>
        <boxGeometry args={[2.9, 1.52, 2.55]} />
        <meshStandardMaterial color="#b79a72" roughness={0.96} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 2.22, -0.08]} rotation={[0.01, 0.012, 0.015]}>
        <boxGeometry args={[2.42, 1.18, 2.25]} />
        <meshStandardMaterial color="#c9a978" roughness={0.94} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 3.34, -0.2]} rotation={[-0.012, -0.01, -0.015]}>
        <boxGeometry args={[1.82, 1.08, 1.86]} />
        <meshStandardMaterial color="#d4ad7a" roughness={0.92} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[-0.17, 3.95, -0.2]}>
        <boxGeometry args={[2.02, 0.18, 2.04]} />
        <meshStandardMaterial color="#705344" roughness={0.94} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 1.6, 1.32]}>
        <boxGeometry args={[2.94, 0.1, 0.16]} />
        <meshStandardMaterial color="#d0b68a" roughness={0.86} />
      </mesh>
      <mesh castShadow position={[0, 2.82, 1.08]}>
        <boxGeometry args={[2.48, 0.1, 0.16]} />
        <meshStandardMaterial color="#d6bd92" roughness={0.84} />
      </mesh>
      <mesh castShadow position={[1.53, 2.05, 0.95]} rotation={[0, 0, -0.035]}>
        <boxGeometry args={[0.92, 0.16, 0.78]} />
        <meshStandardMaterial color="#776047" roughness={1} />
        <BuildingInk />
      </mesh>
      {[-1, 1].map((x) => (
        <mesh key={`data-balcony-brace-${x}`} position={[1.53 + x * 0.27, 1.72, 0.9]} rotation={[0, 0, -0.32]}>
          <boxGeometry args={[0.1, 0.52, 0.12]} />
          <meshStandardMaterial color="#705344" roughness={1} />
        </mesh>
      ))}
      <VillageDoor position={[0, 0.75, 1.35]} width={0.52} height={1.02} color="#594331" trim="#c5a977" />
      {[-0.92, 0.92].map((x, i) => (
        <mesh key={`data-window-${i}`} position={[x, 1.21, 1.3]}>
          <boxGeometry args={[0.4, 0.38, 0.08]} />
          <meshStandardMaterial color={i % 2 ? '#8bcac0' : '#f0d080'} emissive={i % 2 ? '#3c8582' : '#c78d3d'} emissiveIntensity={0.28} roughness={0.45} />
          <BuildingInk />
        </mesh>
      ))}
      {[-0.55, 0.35].map((x, i) => (
        <mesh key={`data-upper-window-${i}`} position={[x, 3.37, 0.76]}>
          <boxGeometry args={[0.36, 0.44, 0.08]} />
          <meshStandardMaterial color="#8bcac0" emissive="#3c8582" emissiveIntensity={0.32} roughness={0.4} />
          <BuildingInk />
        </mesh>
      ))}
      <mesh castShadow position={[-0.12, 4.57, -0.2]} rotation={[0.08, 0.12, -0.08]}>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#68c8c8" emissive="#358990" emissiveIntensity={0.36} roughness={0.35} />
        <BuildingInk />
      </mesh>
      <mesh position={[-0.12, 4.57, -0.2]} rotation={[0.35, 0.2, 0.15]}>
        <torusGeometry args={[0.63, 0.065, 6, 16]} />
        <meshStandardMaterial color="#d7ad62" roughness={0.78} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0.36, 5.12, -0.2]}>
        <cylinderGeometry args={[0.045, 0.07, 0.92, 5]} />
        <meshStandardMaterial color="#6d5845" roughness={0.9} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0.36, 5.52, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.35, 4]} />
        <meshStandardMaterial color="#d89e4c" roughness={0.82} />
        <BuildingInk />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[3.12, 0.2, 2.78]} />
        <meshStandardMaterial color="#766047" roughness={1} />
        <BuildingInk />
      </mesh>
    </group>
  )
}

function SignalStation() {
  const beacon = useRef<THREE.MeshStandardMaterial>(null)
  const glow = useRef<THREE.Mesh>(null)
  const dish = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.4)
    if (beacon.current) beacon.current.emissiveIntensity = 0.9 + pulse * 1.1
    if (glow.current) {
      const size = 1 + pulse * 0.16
      glow.current.scale.set(size, size, size)
    }
    if (dish.current) dish.current.rotation.y = Math.sin(clock.elapsedTime * 0.28) * 0.22
  })
  return (
    <group position={[0, 0.35, 0.6]}>
      <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[1.7, 1.12, 1.45]} />
        <meshStandardMaterial color="#ad8851" roughness={0.9} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 1.38, 0]}>
        <coneGeometry args={[1.08, 0.48, 6]} />
        <meshStandardMaterial color="#73563d" roughness={0.94} />
        <BuildingInk />
      </mesh>
      <VillageDoor position={[0, 0.62, 0.82]} width={0.48} height={0.76} color="#49392d" trim="#aa8d61" />
      <mesh position={[-0.48, 0.92, 0.76]}>
        <boxGeometry args={[0.32, 0.29, 0.08]} />
        <meshStandardMaterial color="#f0d080" emissive="#c78d3d" emissiveIntensity={0.42} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 2.15, 0]}>
        <cylinderGeometry args={[0.09, 0.15, 1.45, 7]} />
        <meshStandardMaterial color="#92734d" roughness={0.86} />
        <BuildingInk />
      </mesh>
      <group ref={dish} position={[-0.56, 2.16, 0.36]} rotation={[0, 0, -0.22]}>
        <mesh rotation={[0, 0, -0.18]}>
          <circleGeometry args={[0.58, 12]} />
          <meshStandardMaterial color="#c1a679" roughness={0.92} side={THREE.DoubleSide} flatShading />
          <BuildingInk />
        </mesh>
        <mesh rotation={[0, 0, -0.18]}>
          <torusGeometry args={[0.57, 0.075, 5, 12]} />
          <meshStandardMaterial color="#73563d" roughness={1} />
          <BuildingInk />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#ad8851" roughness={0.86} />
        </mesh>
      </group>
      <mesh position={[0, 2.94, 0]}>
        <sphereGeometry args={[0.72, 14, 12]} />
        <meshBasicMaterial color="#ffdc52" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh ref={glow} position={[0, 2.94, 0]}>
        <sphereGeometry args={[0.68, 14, 12]} />
        <meshBasicMaterial color="#ffdc52" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh castShadow position={[0, 2.94, 0]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.46, 0]} />
        <meshStandardMaterial ref={beacon} color="#ffd950" emissive="#ffad16" emissiveIntensity={1.4} />
        <BuildingInk />
      </mesh>
      <mesh castShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[1.9, 0.18, 1.62]} />
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
      <AboutCottage />
      <HobbiesHut />
      <SignalStation />
    </group>
  )
}

function makeRoadRibbon(curve: THREE.CatmullRomCurve3, halfWidth: number, y: number, phase: number) {
  const divisions = Math.max(48, curve.points.length * 20)
  const positions: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= divisions; i += 1) {
    const t = i / divisions
    const center = curve.getPoint(t)
    const tangent = curve.getTangent(t)
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
    const leftWidth = halfWidth * (1 + 0.09 * Math.sin(t * 37 + phase) + 0.035 * Math.sin(t * 89 + phase * 2))
    const rightWidth = halfWidth * (1 + 0.08 * Math.sin(t * 43 + phase + 1.8) + 0.04 * Math.sin(t * 97 + phase))
    positions.push(
      center.x + side.x * leftWidth, y, center.z + side.z * leftWidth,
      center.x - side.x * rightWidth, y, center.z - side.z * rightWidth,
    )
    if (i < divisions) {
      const a = i * 2
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function StonePath({ points, radius = 0.24 }: { points: [number, number, number][]; radius?: number }) {
  const { scene } = useThree()
  const curve = useMemo(() => new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)), false, 'catmullrom', 0.28,
  ), [points])
  const phase = points[0][0] * 0.73 + points[0][2] * 0.29
  // Keep the worn dirt visibly proud of both the island top and beach mesh;
  // otherwise the shallow camera makes the route disappear into z-fighting.
  // `radius` is the half-width of each route. Keep the broad village lane
  // readable, but let door approaches taper instead of inheriting a wide floor.
  const verge = useMemo(() => makeRoadRibbon(curve, Math.max(0.19, radius * 1.15), 0.33, phase), [curve, radius, phase])
  const surface = useMemo(() => makeRoadRibbon(curve, Math.max(0.13, radius * 0.76), 0.35, phase + 2), [curve, radius, phase])
  const cobbles = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    const palette = ['#a49a83', '#928873', '#b0a38b', '#898574'].map((color) => new THREE.Color(color))
    const count = Math.max(12, Math.ceil(curve.getLength() / 0.37))
    let vertexOffset = 0
    for (let i = 0; i <= count; i += 1) {
      const t = (i + 0.22 * Math.sin(i * 12.7 + phase)) / count
      const safeT = THREE.MathUtils.clamp(t, 0, 1)
      const center = curve.getPoint(safeT)
      const tangent = curve.getTangent(safeT)
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
      // Two offset rows make a foot-worn flagstone lane; alternating the
      // stagger keeps the stones from forming a regular brick grid.
      for (const row of [-1, 1]) {
        const seed = i * 19.13 + row * 7.4 + phase
        const along = (i % 2 ? 0.16 : -0.07) + 0.055 * Math.sin(seed * 1.71)
        const across = row * Math.max(0.085, radius * 0.36) + 0.018 * Math.sin(seed * 0.83)
        const stoneCenter = center.clone().addScaledVector(tangent, along).addScaledVector(side, across)
        const halfLength = 0.145 + (Math.sin(seed * 1.11) + 1) * 0.045
        const halfWidth = Math.min(0.105, Math.max(0.065, radius * 0.27)) + (Math.cos(seed * 0.91) + 1) * 0.012
        const sides = 7
        const color = palette[Math.abs(Math.floor(seed * 3)) % palette.length]
        positions.push(stoneCenter.x, 0.374, stoneCenter.z)
        colors.push(color.r, color.g, color.b)
        for (let edge = 0; edge < sides; edge += 1) {
          const angle = (edge / sides) * Math.PI * 2
          const alongEdge = Math.cos(angle) * halfLength * (1 + 0.12 * Math.sin(seed + edge))
          const acrossEdge = Math.sin(angle) * halfWidth * (1 + 0.1 * Math.cos(seed * 1.3 + edge))
          positions.push(
            stoneCenter.x + tangent.x * alongEdge + side.x * acrossEdge,
            0.374 + 0.006 * Math.sin(edge + seed),
            stoneCenter.z + tangent.z * alongEdge + side.z * acrossEdge,
          )
          colors.push(color.r, color.g, color.b)
        }
        for (let edge = 0; edge < sides; edge += 1) {
          indices.push(vertexOffset, vertexOffset + 1 + edge, vertexOffset + 1 + ((edge + 1) % sides))
        }
        vertexOffset += sides + 1
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }, [curve, radius, phase])
  useLayoutEffect(() => {
    const terrain: THREE.Object3D[] = []
    scene.traverse((object) => {
      if (object.userData.walkableTerrain) terrain.push(object)
    })
    if (!terrain.length) return
    scene.updateMatrixWorld(true)
    const ray = new THREE.Raycaster()
    const origin = new THREE.Vector3()
    const down = new THREE.Vector3(0, -1, 0)
    ;[[verge, 0.035], [surface, 0.055], [cobbles, 0.075]].forEach(([geometry, lift]) => {
      const meshGeometry = geometry as THREE.BufferGeometry
      const raise = lift as number
      const positions = meshGeometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i += 1) {
        origin.set(positions.getX(i), 12, positions.getZ(i))
        ray.set(origin, down)
        ray.far = 24
        const hit = ray.intersectObjects(terrain, true)[0]
        if (hit && hit.point.y > 0.24) positions.setY(i, Math.max(positions.getY(i), hit.point.y + raise))
      }
      positions.needsUpdate = true
      meshGeometry.computeVertexNormals()
      meshGeometry.computeBoundingSphere()
    })
  }, [scene, verge, surface, cobbles])
  return (
    <group>
      <mesh geometry={verge} receiveShadow>
        <meshStandardMaterial color="#81775f" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={surface} receiveShadow>
        <meshStandardMaterial color="#a99a7d" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={cobbles} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
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
        if (row === 0 && i % 2 === 1) continue
        const jitter = Math.sin(i * 13.1 + row * 7.7) * 0.09
        const center = point.clone().addScaledVector(side, row * 0.4 + jitter)
        const along = (Math.cos(i * 9.2 + row * 3.3) * 0.12)
        center.addScaledVector(tangent, along)
        const scale = 0.86 + (Math.sin(i * 5.4 + row) + 1) * 0.08
        layout.push({
          position: [center.x, center.y + 0.02, center.z],
          rotation: Math.atan2(tangent.x, tangent.z) + jitter * 0.6,
          scale: [scale * 0.78, 0.1 + (i % 3) * 0.012, 0.58 + (Math.cos(i * 3.4 + row) + 1) * 0.07],
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
  const group = useRef<THREE.Group>(null)
  const { scene } = useThree()
  const frondCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.62, 0.2, 0),
    new THREE.Vector3(1.3, 0.1, 0), new THREE.Vector3(2, -0.34, 0),
  ]), [])
  const frondStem = useMemo(() => new THREE.TubeGeometry(frondCurve, 16, 0.035, 5, false), [frondCurve])
  const leafletGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.quadraticCurveTo(0.17, -0.055, 0.48, -0.22)
    shape.quadraticCurveTo(0.34, -0.06, 0, 0.035)
    shape.closePath()
    return new THREE.ShapeGeometry(shape, 4)
  }, [])

  useLayoutEffect(() => {
    if (!group.current) return
    group.current.position.y = position[1]
    const terrain: THREE.Object3D[] = []
    scene.traverse((object) => {
      if (object.userData.walkableTerrain) terrain.push(object)
    })
    if (terrain.length === 0) return
    scene.updateMatrixWorld(true)
    group.current.updateWorldMatrix(true, false)
    const base = group.current.getWorldPosition(new THREE.Vector3())
    const raycaster = new THREE.Raycaster(new THREE.Vector3(base.x, 12, base.z), new THREE.Vector3(0, -1, 0), 0, 24)
    const surface = raycaster.intersectObjects(terrain, true)[0]
    if (surface && surface.point.y > 0.24) group.current.position.y += surface.point.y - 0.23
  }, [scene, position[0], position[1], position[2]])

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh castShadow position={[0, 1.55, 0]} rotation={[0, 0, -0.08]}>
        <cylinderGeometry args={[0.12, 0.24, 3.1, 7]} />
        <meshStandardMaterial color="#8a6240" roughness={1} flatShading />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const angle = i * Math.PI * 2 / 7
        return (
          <group key={`palm-frond-${i}`} position={[0, 3.0, 0]} rotation={[0, angle, 0]}>
            <mesh geometry={frondStem} castShadow>
              <meshStandardMaterial color={i % 2 ? '#438843' : '#4e9d46'} roughness={0.88} />
            </mesh>
            {Array.from({ length: 6 }, (_, leaflet) => {
              const x = 0.28 + leaflet * 0.22
              const y = 0.16 - leaflet * 0.035
              const length = 0.92 - leaflet * 0.055
              return [-1, 1].map((side) => (
                <mesh
                  key={`palm-leaflet-${leaflet}-${side}`}
                  geometry={leafletGeometry}
                  position={[x, y, 0]}
                  rotation={[0.08, side * Math.PI / 2, side * 0.14]}
                  scale={[length, 1, 1]}
                  castShadow
                >
                  <meshStandardMaterial color={(leaflet + i) % 3 === 0 ? '#65ab48' : i % 2 ? '#438843' : '#4e9d46'} roughness={0.92} side={THREE.DoubleSide} />
                </mesh>
              ))
            })}
          </group>
        )
      })}
    </group>
  )
}

function Tree({ position, scale = 1, tint = '#3c8950', variant = 0 }: {
  position: [number, number, number]
  scale?: number
  tint?: string
  variant?: number
}) {
  const group = useRef<THREE.Group>(null)
  const { scene } = useThree()

  useLayoutEffect(() => {
    if (!group.current) return
    // Reset first so React StrictMode's development effect replay cannot
    // accumulate the terrain offset more than once.
    group.current.position.y = position[1]
    const terrain: THREE.Object3D[] = []
    scene.traverse((object) => {
      if (object.userData.walkableTerrain) terrain.push(object)
    })
    if (terrain.length === 0) return
    scene.updateMatrixWorld(true)
    group.current.updateWorldMatrix(true, false)
    const base = group.current.getWorldPosition(new THREE.Vector3())
    const raycaster = new THREE.Raycaster(new THREE.Vector3(base.x, 12, base.z), new THREE.Vector3(0, -1, 0), 0, 24)
    const surface = raycaster.intersectObjects(terrain, true)[0]
    // Trees keep their existing flat-ground planting height; only lift those
    // that intersect the raised landscape so the trunk never starts underground.
    if (surface && surface.point.y > 0.24) group.current.position.y += surface.point.y - 0.23
  }, [scene])

  const crowns: [number, number, number, number, number, number, string][] = variant % 4 === 0
    ? [
      [0, 2.08, 0, 1.02, 0.9, 0.82, tint], [-0.62, 1.82, 0.04, 0.75, 0.72, 0.7, '#4d9948'],
      [0.58, 1.8, 0.12, 0.76, 0.68, 0.72, '#72b84d'], [0.15, 1.52, -0.36, 0.73, 0.62, 0.7, '#438844'],
      [0.03, 2.63, 0.02, 0.64, 0.62, 0.67, '#65ab48'],
    ]
    : variant % 4 === 1
      ? [
        [-0.18, 1.72, 0, 0.92, 0.62, 0.68, tint], [0.5, 1.88, 0.05, 0.82, 0.7, 0.7, '#72b84d'],
        [-0.58, 2.04, -0.02, 0.75, 0.68, 0.66, '#4d9948'], [0.16, 2.43, 0.06, 0.73, 0.72, 0.65, '#5da64a'],
        [0.63, 2.31, 0.12, 0.57, 0.56, 0.58, '#438844'],
      ]
      : variant % 4 === 2
        ? [
          [0, 1.55, 0, 0.78, 0.66, 0.72, '#438844'], [0.04, 2.1, 0.01, 0.86, 0.7, 0.76, tint],
          [-0.24, 2.65, 0.02, 0.66, 0.69, 0.63, '#72b84d'], [0.48, 1.96, 0.08, 0.65, 0.62, 0.66, '#4d9948'],
          [-0.53, 1.93, 0.05, 0.59, 0.57, 0.61, '#65ab48'],
        ]
        : [
          [0.25, 1.92, 0.03, 1.02, 0.77, 0.74, tint], [-0.51, 1.69, 0.02, 0.67, 0.62, 0.65, '#438844'],
          [0.82, 1.73, 0.07, 0.67, 0.59, 0.65, '#72b84d'], [0.53, 2.52, 0.02, 0.68, 0.69, 0.65, '#65ab48'],
          [-0.13, 2.32, 0.02, 0.69, 0.65, 0.68, '#4d9948'],
        ]

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh castShadow position={[variant % 2 ? 0.1 : -0.06, 0.82, 0]} rotation={[0, 0, variant % 3 === 0 ? -0.045 : 0.025]}>
        <cylinderGeometry args={[0.12, 0.23, 1.64, 7]} />
        <meshStandardMaterial color="#805a3a" roughness={1} flatShading />
        <TreeInk />
      </mesh>
      {variant % 4 === 2 && [-1, 1].map((side) => (
        <mesh key={`branch-${side}`} castShadow position={[side * 0.32, 1.32, 0]} rotation={[0, 0, side * -0.52]}>
          <cylinderGeometry args={[0.045, 0.075, 0.8, 5]} />
          <meshStandardMaterial color="#805a3a" roughness={1} flatShading />
          <TreeInk />
        </mesh>
      ))}
      {crowns.map(([x, y, z, sx, sy, sz, color], i) => (
        <mesh key={`canopy-${i}`} castShadow position={[x, y, z]} scale={[sx, sy, sz]} rotation={[0.03 * (i % 2), i * 0.41, 0.025 * (i % 3)]}>
          <dodecahedronGeometry args={[0.72, 0]} />
          <meshStandardMaterial color={i === 0 ? tint : color} roughness={1} flatShading />
          <TreeInk />
        </mesh>
      ))}
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

function VillageLamp({ position }: { position: [number, number, number] }) {
  const bracket = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.08, 0), new THREE.Vector3(0.18, 2.14, 0),
    new THREE.Vector3(0.4, 2.12, 0), new THREE.Vector3(0.51, 2.0, 0),
  ]), 12, 0.045, 6, false), [])
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.22, 7]} />
        <meshStandardMaterial color="#887456" roughness={1} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.18, 0]} rotation={[0, 0, -0.018]}>
        <cylinderGeometry args={[0.075, 0.13, 2.05, 7]} />
        <meshStandardMaterial color="#614b35" roughness={1} flatShading />
        <BuildingInk />
      </mesh>
      <mesh geometry={bracket} castShadow>
        <meshStandardMaterial color="#614b35" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0.48, 1.94, 0]}>
        <boxGeometry args={[0.32, 0.4, 0.32]} />
        <meshStandardMaterial color="#f5d995" emissive="#eab755" emissiveIntensity={0.48} roughness={0.48} />
      </mesh>
      <pointLight position={[0.48, 1.94, 0.08]} color="#ffd992" intensity={0.62} distance={4.4} decay={2} />
      {[0.29, 0.67].flatMap((x) => [-0.19, 0.19].map((z) => (
        <mesh key={`lamp-frame-${x}-${z}`} position={[x, 1.94, z]}>
          <boxGeometry args={[0.045, 0.47, 0.045]} />
          <meshStandardMaterial color="#493b2d" roughness={0.9} metalness={0.1} />
        </mesh>
      )))}
      <mesh castShadow position={[0.48, 2.22, 0]}>
        <coneGeometry args={[0.27, 0.18, 6]} />
        <meshStandardMaterial color="#694a35" roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0.48, 1.62, 0]}>
        <boxGeometry args={[0.36, 0.075, 0.36]} />
        <meshStandardMaterial color="#493b2d" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.48, 2.34, 0]}>
        <sphereGeometry args={[0.055, 6, 5]} />
        <meshStandardMaterial color="#d9b45a" emissive="#d9b45a" emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}

function VillageDetails() {
  const trees: [number, number, number, number, string?][] = [
    [-25.5, 0.32, -5.3, 0.96, '#347e4b'], [-22, 0.34, -5.8, 0.82], [-17.5, 0.34, -5.7, 0.82],
    [-12.2, 0.34, -5.6, 1.02, '#367d43'], [-7.2, 0.34, -5.2, 0.78], [0.7, 0.34, -8.5, 0.94],
    [10.2, 0.34, -6.5, 1.24, '#397f42'], [15.1, 0.34, -5.2, 1.35, '#347648'],
    [18.2, 0.34, -3.2, 0.96], [22.7, 0.34, -5.5, 1.12, '#347c4a'],
  ]
  const bushes: [number, number, number, number, boolean?][] = [
    [-23, 0.34, 1.8, 0.76, true], [-18.8, 0.34, 3.4, 0.78], [-15, 0.34, 4.4, 0.92, true],
    [-13.1, 0.34, 1.8, 0.68], [-19.2, 0.34, -3.7, 0.68], [-17.1, 0.34, -3.7, 0.6, true],
    [6.2, 0.34, -1, 0.9], [10.3, 0.34, 4.9, 0.8], [16, 0.34, 5.1, 0.8, true],
    [18.1, 0.34, 1.1, 0.82], [23, 0.34, 4.8, 0.74, true],
  ]

  return (
    <group>
      {/* Worn stone routes: beach approach to the hub, then short branches. */}
      <FlagstoneApproach />
      <StonePath points={[[-8, 0.39, 10], [-9.4, 0.39, 7], [-7.5, 0.39, 6.3], [-5.1, 0.39, 4.8], [-1.5, 0.39, 6.1], [1.6, 0.39, 4.25]]} radius={0.36} />
      <StonePath points={[[1.6, 0.39, 4.25], [4.6, 0.39, 6], [8.1, 0.39, 3.7], [10.7, 0.39, 5.2]]} radius={0.34} />
      <StonePath points={[[-7, 0.39, 5.9], [-9.3, 0.39, 4.7], [-11.2, 0.39, 4.4], [-11.5, 0.39, 5.1]]} radius={0.27} />
      <StonePath points={[[-7.5, 0.39, 6.3], [-8.7, 0.39, 4.6], [-7.1, 0.39, 2.8], [-8.1, 0.39, 1.5], [-6.8, 0.39, 0.1]]} radius={0.22} />
      <StonePath points={[[-2.6, 0.39, 5.4], [-4.5, 0.39, 3.8], [-3.7, 0.39, 2.1], [-5.1, 0.39, 0.6], [-2.9, 0.39, -0.8], [-3.8, 0.39, -3], [-3.1, 0.39, -5.4]]} radius={0.24} />
      <StonePath points={[[-1.5, 0.39, 6.1], [-0.3, 0.39, 4.5], [1.4, 0.39, 3], [0.6, 0.39, 1.5]]} radius={0.23} />
      <StonePath points={[[1.6, 0.39, 4.25], [2.9, 0.39, 2.5], [4.9, 0.39, 0.4], [3.6, 0.39, -1.1], [5.1, 0.39, -2.8], [4.2, 0.39, -3.5]]} radius={0.24} />
      <StonePath points={[[8.1, 0.39, 3.7], [9.1, 0.39, 4.5], [8.4, 0.39, 6.2], [6.8, 0.39, 5.9]]} radius={0.22} />
      <StonePath points={[[10.7, 0.39, 5.2], [12.2, 0.39, 3.4], [10.9, 0.39, 1.2], [12.4, 0.39, -1], [11.3, 0.39, -3.7], [12, 0.39, -3.2]]} radius={0.23} />
      {/* A subtle worn meeting patch, not a geometric building layout. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.245, 4.8]}>
        <circleGeometry args={[1.15, 32]} />
        <meshStandardMaterial color="#81b34b" roughness={1} transparent opacity={0.55} />
      </mesh>
      <Text position={[-3.7, 0.43, 6.35]} rotation={[-Math.PI / 2, 0, -0.12]} fontSize={0.48} color="#435837" anchorX="center" anchorY="middle" letterSpacing={0.04}>
        STAR CLIFF
      </Text>
      <Text position={[15.5, 0.43, 4.4]} rotation={[-Math.PI / 2, 0, -0.1]} fontSize={0.46} color="#435837" anchorX="center" anchorY="middle" letterSpacing={0.04}>
        DUSTY BEACH
      </Text>
      <VillageResident position={[-10.2, 0.38, 4.3]} coat="#8a6240" ear="#c78b62" />
      <VillageResident position={[1.5, 0.38, 3.7]} coat="#d8c5a3" ear="#b9826b" />
      <VillageResident position={[8.2, 0.38, 5.15]} coat="#765b50" ear="#a47c6e" />
      <PalmTree position={[-18.4, 0.32, -7.1]} scale={0.94} />
      <PalmTree position={[11.8, 0.32, -7.7]} scale={0.82} />

      {trees.map(([x, y, z, scale, tint], i) => (
        <Tree key={`tree-${i}`} position={[x, y, z]} scale={scale} tint={tint} variant={i} />
      ))}
      {bushes.map(([x, y, z, scale, flowers], i) => (
        <Shrub key={`shrub-${i}`} position={[x, y, z]} scale={scale} flowers={flowers} color={i % 5 === 0 ? '#438843' : '#4e9d46'} />
      ))}

      {/* Functional props cluster around the workshop; extras mark the hub approach. */}
      {[
        [-16.2, 0.34, 1.4], [-15.3, 0.34, 1.2], [-15.8, 0.34, 2.05], [-12.2, 0.34, 3.4],
        [-8.4, 0.34, 3.5], [6.8, 0.34, 1.3], [15.8, 0.34, 1.5],
      ].map((p, i) => <Barrel key={`barrel-${i}`} position={p as [number, number, number]} scale={i === 3 ? 0.86 : 1} />)}
      {[
        [-16.8, 0.34, 0.25], [-11.8, 0.34, 0.1], [-7.5, 0.34, 2.4], [-2.4, 0.34, 0.6],
        [4.8, 0.34, 0.8], [8.1, 0.34, 0.4], [15.8, 0.34, 0.2],
      ].map((p, i) => <Crate key={`crate-${i}`} position={p as [number, number, number]} />)}
      {[
        [-12.8, 0.34, 5.8], [-5.9, 0.34, 6.1], [1.2, 0.34, 5.8],
        [8.5, 0.34, 5.1], [12.1, 0.34, 2.2],
      ].map((p, i) => <VillageLamp key={`village-lamp-${i}`} position={p as [number, number, number]} />)}
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
  const tail = useRef<THREE.Group>(null)
  const tailCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.29, 0.02, -0.08),
    new THREE.Vector3(0.49, 0.2, -0.1),
    new THREE.Vector3(0.44, 0.43, -0.1),
  ]), [])
  const tailGeometry = useMemo(() => new THREE.TubeGeometry(tailCurve, 16, 0.105, 8, false), [tailCurve])
  const pressed = useRef<Record<string, boolean>>({})
  const nearestId = useRef<string | null>(null)
  const { camera, scene } = useThree()
  const terrain = useRef<THREE.Object3D[]>([])
  const groundRay = useRef(new THREE.Raycaster())
  const rayOrigin = useMemo(() => new THREE.Vector3(), [])
  const rayDown = useMemo(() => new THREE.Vector3(0, -1, 0), [])
  const [nearby, setNearby] = useState<PortfolioSpot | null>(null)

  useLayoutEffect(() => {
    terrain.current = []
    scene.traverse((object) => {
      if (object.userData.walkableTerrain) terrain.current.push(object)
    })
  }, [scene])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const code = event.code
      const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'KeyE', 'Enter']
      if (gameKeys.includes(code)) event.preventDefault()
      if (document.querySelector('[role="dialog"]')) {
        pressed.current[code] = false
        return
      }
      pressed.current[code] = true
      if ((code === 'KeyE' || code === 'Enter') && nearby) onOpen(nearby)
    }
    const up = (event: KeyboardEvent) => { pressed.current[event.code] = false }
    const resetMovement = () => { pressed.current = {} }
    const resetWhenHidden = () => { if (document.hidden) resetMovement() }
    const pad = (event: Event) => {
      const { code, down: isDown } = (event as CustomEvent<{ code: string; down: boolean }>).detail
      pressed.current[code] = isDown
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', resetMovement)
    document.addEventListener('visibilitychange', resetWhenHidden)
    window.addEventListener('coastlight:move', pad)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', resetMovement)
      document.removeEventListener('visibilitychange', resetWhenHidden)
      window.removeEventListener('coastlight:move', pad)
    }
  }, [nearby, onOpen])

  useFrame(({ clock }, delta) => {
    if (bob.current) bob.current.position.y = Math.sin(clock.elapsedTime * 1.6) * 0.008
    if (!root.current) return
    const speed = 6.2 * delta
    const key = (...codes: string[]) => Number(codes.some((code) => pressed.current[code] === true))
    const direction = new THREE.Vector3(
      key('KeyD', 'ArrowRight') - key('KeyA', 'ArrowLeft'),
      0,
      key('KeyS', 'ArrowDown') - key('KeyW', 'ArrowUp'),
    )
    const moving = direction.lengthSq() > 0
    const gait = moving ? Math.sin(clock.elapsedTime * 9.5) * 0.43 : 0
    if (bob.current) {
      bob.current.position.y = moving ? Math.abs(Math.sin(clock.elapsedTime * 9.5)) * 0.018 : 0
      bob.current.scale.set(1, 1, 1)
    }
    if (leftLeg.current) leftLeg.current.rotation.x = gait
    if (rightLeg.current) rightLeg.current.rotation.x = -gait
    if (leftArm.current) leftArm.current.rotation.x = -gait * 0.68
    if (rightArm.current) rightArm.current.rotation.x = gait * 0.68
    if (tail.current) {
      tail.current.rotation.x = Math.sin(clock.elapsedTime * (moving ? 5.5 : 1.4)) * (moving ? 0.045 : 0.018)
      tail.current.rotation.y = Math.sin(clock.elapsedTime * (moving ? 5 : 1.2)) * (moving ? 0.055 : 0.025)
    }
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

    // Sample the visible hill meshes under the player's feet. Vertical damping
    // prevents the faceted terrain from making movement pop between triangles.
    const player = root.current.position
    let groundY = 0.23
    if (terrain.current.length > 0) {
      rayOrigin.set(player.x, 12, player.z)
      groundRay.current.set(rayOrigin, rayDown)
      groundRay.current.far = 24
      const surface = groundRay.current.intersectObjects(terrain.current, true)[0]
      if (surface) groundY = Math.max(groundY, surface.point.y)
    }
    const groundedY = Math.max(0.34, groundY + 0.1)
    player.y = THREE.MathUtils.damp(player.y, groundedY, 12, delta)

    // Camera translates with the player while preserving its exact relative
    // framing and angle, including when crossing a rise.
    const target = new THREE.Vector3(player.x + 3, player.y, player.z - 5.5)
    const cameraPosition = new THREE.Vector3(player.x + 3, player.y + 8.8, player.z + 27.5)
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
        {/* Compact, practical rover robot: ceramic shell, dark joints and restrained teal hardware. */}
        <mesh ref={leftLeg} castShadow position={[-0.16, 0.25, 0]}>
          <capsuleGeometry args={[0.105, 0.28, 4, 8]} />
          <meshStandardMaterial color="#d9e3dd" roughness={0.62} metalness={0.12} />
          <BuildingInk />
        </mesh>
        <mesh ref={rightLeg} castShadow position={[0.16, 0.25, 0]}>
          <capsuleGeometry args={[0.105, 0.28, 4, 8]} />
          <meshStandardMaterial color="#d9e3dd" roughness={0.62} metalness={0.12} />
          <BuildingInk />
        </mesh>
        {[-0.16, 0.16].map((x) => (
          <group key={`boot-${x}`} position={[x, 0.12, 0.055]}>
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.16, 0.36]} />
              <meshStandardMaterial color="#334a50" roughness={0.72} metalness={0.18} />
              <BuildingInk />
            </mesh>
            <mesh position={[0, -0.075, 0.015]}>
              <boxGeometry args={[0.27, 0.035, 0.37]} />
              <meshStandardMaterial color="#c88e4f" roughness={0.9} />
            </mesh>
          </group>
        ))}
        <mesh castShadow position={[0, 0.77, 0]}>
          <capsuleGeometry args={[0.31, 0.43, 5, 10]} />
          <meshStandardMaterial color="#edf0df" roughness={0.62} metalness={0.1} />
          <BuildingInk />
        </mesh>
        <mesh castShadow position={[0, 1.08, 0.02]}>
          <torusGeometry args={[0.22, 0.045, 8, 18]} />
          <meshStandardMaterial color="#405c60" roughness={0.5} metalness={0.25} />
        </mesh>
        <mesh castShadow position={[0, 0.76, 0.292]}>
          <boxGeometry args={[0.29, 0.28, 0.06]} />
          <meshStandardMaterial color="#426e70" roughness={0.48} metalness={0.28} />
          <BuildingInk />
        </mesh>
        <mesh position={[0, 0.77, 0.33]}>
          <circleGeometry args={[0.048, 12]} />
          <meshBasicMaterial color="#efb85d" />
        </mesh>
        <mesh castShadow position={[0, 0.61, -0.27]}>
          <boxGeometry args={[0.4, 0.44, 0.25]} />
          <meshStandardMaterial color="#586c68" roughness={0.75} metalness={0.14} />
          <BuildingInk />
        </mesh>
        {/* Narrow feline sensor tail, kept close to the body rather than used as a comic prop. */}
        <group ref={tail} position={[0.08, 0.52, -0.34]}>
          <mesh geometry={tailGeometry} castShadow>
            <meshStandardMaterial color="#637e7b" roughness={0.58} metalness={0.2} />
            <BuildingInk />
          </mesh>
          <mesh position={[0.44, 0.43, -0.1]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#efb85d" roughness={0.48} metalness={0.2} />
          </mesh>
        </group>
        <mesh castShadow position={[0, 1.52, 0.04]}>
          <sphereGeometry args={[0.44, 24, 20]} />
          <meshStandardMaterial color="#edf0e4" roughness={0.52} metalness={0.12} />
          <BuildingInk />
        </mesh>
        {/* A compact dark sensor window replaces the oversized toy-like face. */}
        <mesh castShadow position={[0, 1.52, 0.395]} scale={[0.33, 0.3, 0.115]}>
          <sphereGeometry args={[1, 20, 16]} />
          <meshStandardMaterial color="#263e46" roughness={0.36} metalness={0.32} />
          <BuildingInk />
        </mesh>
        {[-0.145, 0.145].map((x, i) => (
          <mesh key={`sensor-eye-${i}`} position={[x, 1.54, 0.513]} scale={[0.65, 1.5, 0.45]}>
            <sphereGeometry args={[0.052, 12, 10]} />
            <meshBasicMaterial color={i === 0 ? '#86d8d0' : '#a2e1d5'} />
          </mesh>
        ))}
        <mesh position={[0, 1.43, 0.511]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshBasicMaterial color="#e9b35c" />
        </mesh>
        {/* Short ceramic cat-ear sensors; no oversized ears or face markings. */}
        {[-0.29, 0.29].map((x, i) => (
          <group key={`ear-${i}`}>
            <mesh castShadow position={[x, 1.87, 0.01]} rotation={[0, 0, x < 0 ? 0.18 : -0.18]}>
              <coneGeometry args={[0.16, 0.43, 6]} />
              <meshStandardMaterial color="#edf0e4" roughness={0.54} metalness={0.1} />
              <BuildingInk />
            </mesh>
            <mesh position={[x, 1.88, 0.11]} rotation={[0, 0, x < 0 ? 0.18 : -0.18]} scale={[0.52, 0.58, 0.3]}>
              <coneGeometry args={[0.1, 0.29, 6]} />
              <meshBasicMaterial color={i === 0 ? '#d4a05d' : '#62b5b0'} />
            </mesh>
          </group>
        ))}
        <mesh ref={leftArm} castShadow position={[-0.39, 0.78, 0.02]} rotation={[0, 0, 0.35]}>
          <capsuleGeometry args={[0.115, 0.3, 4, 8]} />
          <meshStandardMaterial color="#dfe8df" roughness={0.58} metalness={0.12} />
          <BuildingInk />
        </mesh>
        <mesh ref={rightArm} castShadow position={[0.39, 0.78, 0.02]} rotation={[0, 0, -0.35]}>
          <capsuleGeometry args={[0.115, 0.3, 4, 8]} />
          <meshStandardMaterial color="#dfe8df" roughness={0.58} metalness={0.12} />
          <BuildingInk />
        </mesh>
        {[-0.45, 0.45].map((x) => (
          <mesh key={`hand-${x}`} castShadow position={[x, 0.54, 0.06]}>
            <sphereGeometry args={[0.105, 10, 8]} />
            <meshStandardMaterial color="#40575a" roughness={0.58} metalness={0.22} />
            <BuildingInk />
          </mesh>
        ))}
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
    [-36, -18, 1.5], [-31, -25, 1.5], [-24, -20, 2.2], [-15, -29, 1.2], [-7, -23, 1.8], [2, -32, 2.4],
    [10, -25, 1.4], [18, -30, 2], [27, -22, 1.5], [-35, -34, 2.3], [-2, -18, 1.1], [22, -17, 1.3],
    [35, -31, 1.8], [-29, -42, 1.8], [-20, -37, 1.3], [-12, -45, 2], [-3, -39, 1.4], [7, -44, 2.1],
    [16, -38, 1.4], [26, -46, 1.9], [36, -40, 1.5], [-40, -28, 1.2], [-26, -49, 1.6], [-9, -34, 1.1],
    [4, -19, 1.3], [19, -48, 1.4], [31, -36, 1.2], [42, -24, 1.6],
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
        <mesh key={`water-glint-${i}`} position={[x, -0.12, z]} rotation={[-Math.PI / 2, 0, Math.sin(i * 4.1) * 0.07]}>
          <planeGeometry args={[length, 0.17 + (i % 3) * 0.07]} />
          <meshBasicMaterial color={i % 3 ? '#9de0d5' : '#e1f0cf'} transparent opacity={0.46} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function OceanShallows() {
  const group = useRef<THREE.Group>(null)
  const patches: [number, number, number, number, number, string][] = [
    [-34, -16, 2.5, 0.38, -0.14, '#70c8c4'], [-25, -21, 3.4, 0.42, 0.08, '#2c8996'],
    [-15, -18, 2.1, 0.32, -0.1, '#83d4cd'], [-5, -23, 3.2, 0.44, 0.13, '#388f9a'],
    [8, -17, 2.8, 0.36, -0.08, '#75cbc5'], [19, -22, 3.6, 0.45, 0.1, '#2d8290'],
    [31, -18, 2.3, 0.34, -0.12, '#80d1ca'], [-39, -27, 3.5, 0.46, 0.1, '#287b8a'],
    [-29, -31, 2.6, 0.36, -0.12, '#7acbc5'], [-18, -28, 3.8, 0.48, 0.1, '#347f8e'],
    [-7, -34, 2.6, 0.4, -0.12, '#80d0c9'], [5, -29, 3.3, 0.42, 0.08, '#2b7a89'],
    [17, -34, 3.8, 0.46, -0.1, '#6fc4c1'], [29, -29, 2.5, 0.38, 0.12, '#337f8e'],
    [39, -34, 3.1, 0.4, -0.08, '#77cbc5'], [-34, -41, 2.8, 0.4, 0.13, '#327e8b'],
    [-22, -44, 3.6, 0.46, -0.1, '#6dbdc0'], [-9, -43, 2.5, 0.36, 0.12, '#2b7485'],
    [7, -47, 3.3, 0.42, -0.08, '#65b4ba'], [24, -43, 3.7, 0.48, 0.1, '#2b7888'],
    [39, -46, 2.5, 0.36, -0.12, '#63b6bb'],
  ]
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.children.forEach((child, i) => {
      const x = patches[i][0]
      child.position.x = x + Math.sin(clock.elapsedTime * 0.045 + i * 1.6) * 0.22
    })
  })
  return (
    <group ref={group}>
      {patches.map(([x, z, sx, sz, rotation, color], i) => (
        <mesh key={`sea-shallow-${i}`} position={[x, -0.08, z]} rotation={[-Math.PI / 2, 0, rotation]} scale={[sx * 1.25, sz * 2.4, 1]}>
          <circleGeometry args={[1, 11]} />
          <meshBasicMaterial color={color} transparent opacity={0.31} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function OceanWaveBands() {
  const waves = useMemo(() => {
    const rows = [
      { z: -14, color: '#83d0ca' }, { z: -20.5, color: '#287f91' },
      { z: -29, color: '#6abfc0' }, { z: -39, color: '#327f8c' },
    ]
    return rows.flatMap((row, rowIndex) => Array.from({ length: 5 }, (_, segment) => {
      const phase = rowIndex * 1.31 + segment * 2.17
      const startX = -42 + segment * 17.2 + Math.sin(phase) * 3.1
      const length = 4.2 + (0.5 + 0.5 * Math.sin(phase * 1.7)) * 7.8
      const points = Array.from({ length: 7 }, (_, i) => {
        const x = startX + (i / 6) * length
        const z = row.z + Math.sin(x * 0.19 + phase) * 0.76 + Math.sin(x * 0.061 + phase * 2) * 0.5
        const y = -0.105 + Math.sin(x * 0.23 + phase) * 0.025
        return new THREE.Vector3(x, y, z)
      })
      return {
        geometry: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.043, 5, false),
        color: row.color,
        opacity: 0.28 + (segment % 3) * 0.07,
      }
    }))
  }, [])

  return (
    <group>
      {waves.map((wave, i) => (
        <mesh key={`ocean-wave-${i}`} geometry={wave.geometry}>
          <meshBasicMaterial color={wave.color} transparent opacity={wave.opacity} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Ocean() {
  const oceanGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(180, 180, 64, 80)
    const positions = geometry.attributes.position
    const colors: number[] = []
    const near = new THREE.Color('#48b5bb')
    const mid = new THREE.Color('#257f91')
    const far = new THREE.Color('#164d66')
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const t = THREE.MathUtils.clamp((y + 90) / 180, 0, 1)
      const color = t < 0.54
        ? near.clone().lerp(mid, t / 0.54)
        : mid.clone().lerp(far, (t - 0.54) / 0.46)
      const ripple = (
        Math.sin(x * 0.17 + y * 0.13)
        + Math.sin(x * 0.31 - y * 0.08 + 1.7) * 0.55
        + Math.sin(x * 0.073 - y * 0.22 + 2.8) * 0.38
      ) / 1.93
      const tone = ripple > 0 ? new THREE.Color('#69c9c4') : new THREE.Color('#124c63')
      color.lerp(tone, Math.abs(ripple) * 0.5)
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
      <OceanShallows />
      <OceanWaveBands />
      <OceanGlints />
      <group position={[0, 0.58, -27]}>
        {[-32, -23, -12, 1, 14, 26, 37].map((x, i) => (
          <group key={`sea-islet-${i}`} position={[x, 0, Math.sin(i * 1.8) * 0.7]}>
            <mesh position={[0, 0.18, 0]} scale={[2.9 + (i % 3) * 1.05, 0.5 + (i % 3) * 0.1, 0.92 + (i % 2) * 0.42]}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshBasicMaterial color={['#286e79', '#357f83', '#438f8d', '#2c7880'][i % 4]} />
            </mesh>
            {(i === 1 || i === 3 || i === 5) && (
              <mesh position={[0.28, 0.76 + (i % 2) * 0.24, -0.04]} rotation={[0.02, i * 0.37, -0.045]} scale={[1.5, 0.82 + (i % 2) * 0.18, 0.82]}>
                <coneGeometry args={[1.05 + (i % 2) * 0.24, 1.75 + (i % 3) * 0.35, i === 3 ? 5 : 4]} />
                <meshBasicMaterial color={i === 3 ? '#3d8d8a' : '#347f82'} />
              </mesh>
            )}
            {i % 2 === 0 && (
              <mesh position={[0.25, 0.53, 0.04]} scale={[1.15, 0.22, 0.72]}>
                <dodecahedronGeometry args={[1, 0]} />
                <meshBasicMaterial color="#68aa83" />
              </mesh>
            )}
          </group>
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
    [-29, 0.15, -38, 4.7, 2.7, '#276b78'], [-22, 0.35, -39, 3.4, 3.2, '#438e96'],
    [-12, 0.2, -40, 5.6, 3.7, '#246875'], [-2, 0.1, -42, 3.7, 2.7, '#559ba0'],
    [9, 0.22, -40, 4.6, 3.4, '#2b7480'], [20, 0.12, -39, 5.1, 2.9, '#4a9299'],
    [30, 0.25, -37, 4, 2.5, '#286b79'],
  ]
  const faces = ['#70b3b1', '#255e70', '#85bfba', '#327e88', '#6da9a9', '#235e70', '#91c9c2']
  return (
    <group>
      {peaks.map(([x, y, z, radius, height, color], i) => (
        <group key={`distant-peak-${i}`} position={[x, y, z]}>
          <mesh position={[0, height * 0.38, 0]} scale={[1.45, 0.84, 0.75]}>
            <coneGeometry args={[radius, height, i % 2 ? 5 : 4]} />
            <meshBasicMaterial color={color} transparent opacity={0.84} depthWrite={false} />
          </mesh>
          <mesh position={[radius * 0.48, height * 0.28, -0.08]} scale={[0.92, 0.68, 0.72]}>
            <coneGeometry args={[radius * 0.72, height * 0.76, 5]} />
            <meshBasicMaterial color={faces[i]} transparent opacity={0.66} depthWrite={false} />
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
        <meshBasicMaterial color="#b1d9d9" transparent opacity={0.44} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={back} position={[0, 0.3, -58]}>
        <meshBasicMaterial color="#58a9ae" transparent opacity={0.63} depthWrite={false} side={THREE.DoubleSide} />
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
