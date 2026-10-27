import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { GroundMound } from './GroundMound'
import { grassContour, sandContour, grassShape, sandShape, outwardNormal, GRASS_HEIGHT, SAND_HEIGHT } from './groundContours'

function surfaceGeometry(shape: THREE.Shape, bounds: [number, number, number, number]) {
  const geometry = new THREE.ShapeGeometry(shape, 1)
  const positions = geometry.attributes.position
  const uv = new Float32Array(positions.count * 2)
  const [minX, minY, width, height] = bounds
  for (let i = 0; i < positions.count; i++) {
    uv[i * 2] = (positions.getX(i) - minX) / width
    uv[i * 2 + 1] = (positions.getY(i) - minY) / height
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geometry
}

function coastBand(points: THREE.Vector2[], inner: number, outer: number, y: number, variation: number, colors?: [string, string]) {
  const positions: number[] = []
  const pigment: number[] = []
  const indices: number[] = []
  const insideColor = new THREE.Color(colors?.[0] ?? '#ffffff')
  const outsideColor = new THREE.Color(colors?.[1] ?? '#ffffff')
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const normal = outwardNormal(points, i)
    const weight = 1 + Math.sin(i * 0.31 + 1.1) * variation + Math.sin(i * 0.87) * variation * 0.3
    for (const [offset, color] of [[inner * weight, insideColor], [outer * weight, outsideColor]] as const) {
      positions.push(point.x + normal.x * offset, y, -point.y - normal.y * offset)
      pigment.push(color.r, color.g, color.b)
    }
    const next = ((i + 1) % points.length) * 2
    const current = i * 2
    indices.push(current, next, current + 1, next, next + 1, current + 1)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(pigment, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export type GroundPaints = { grass: THREE.Texture; sand: THREE.Texture }

function shallowWater(points: THREE.Vector2[]) {
  const positions: number[] = [], colors: number[] = [], indices: number[] = []
  const offsets = [0.015, 0.15, 0.5, 1.05, 1.8]
  const opacity = [0.24, 0.35, 0.25, 0.12, 0]
  const pale = new THREE.Color('#c8e6d3')
  const turquoise = new THREE.Color('#74d8ce')
  const deep = new THREE.Color('#489da7')
  const coral = new THREE.Color('#c0a0a6')
  for (let index = 0; index < points.length; index++) {
    const point = points[index], normal = outwardNormal(points, index)
    const width = 1 + Math.sin(index * 0.09 + 1.5) * 0.22 + Math.sin(index * 0.33) * 0.08
    for (let ring = 0; ring < offsets.length; ring++) {
      const distance = offsets[ring] * width
      positions.push(point.x + normal.x * distance, 0.049, -point.y - normal.y * distance)
      const pigment = ring < 2 ? pale.clone().lerp(turquoise, ring * 0.6)
        : turquoise.clone().lerp(deep, (ring - 2) / 2)
      if (ring === 1 || ring === 2) pigment.lerp(coral, Math.max(0, Math.sin(index * 0.13 + 1)) ** 8 * 0.23)
      colors.push(pigment.r, pigment.g, pigment.b, opacity[ring])
      if (ring === offsets.length - 1) continue
      const a = index * offsets.length + ring
      const b = ((index + 1) % points.length) * offsets.length + ring
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
  geometry.setIndex(indices)
  return geometry
}

export function IslandGround({ paints }: { paints: GroundPaints }) {
  const ground = useMemo(() => {
    const grass = surfaceGeometry(grassShape, [-28, -14, 56, 28])
    const sand = surfaceGeometry(sandShape, [-32, -22, 64, 38])
    const grassBase = new THREE.ExtrudeGeometry(grassShape, {
      depth: 0.54, bevelEnabled: false, curveSegments: 1, steps: 1,
    })
    const sandBase = new THREE.ExtrudeGeometry(sandShape, {
      depth: 0.3, bevelEnabled: false, curveSegments: 1, steps: 1,
    })
    return {
      grass, sand, grassBase, sandBase,
      grassLip: coastBand(grassContour, -0.045, 0.015, GRASS_HEIGHT + 0.002, 0.34, ['#5a762d', '#304b29']),
      sandRim: coastBand(sandContour, -0.065, 0.012, SAND_HEIGHT + 0.002, 0.28, ['#b19b73', '#5b5541']),
      foam: coastBand(sandContour, 0.025, 0.12, 0.06, 0.55),
      shallows: shallowWater(sandContour),
    }
  }, [])
  useEffect(() => () => {
    Object.values(ground).forEach((geometry) => geometry.dispose())
  }, [ground])

  return (
    <group>
      {/* Submerged sides and a low grass lip seat both surfaces in the water. */}
      <mesh geometry={ground.sandBase} rotation={[-Math.PI / 2, 0, 0]} position={[0, SAND_HEIGHT - 0.302, 0]}>
        <meshStandardMaterial attach="material-0" color="#c4b28c" roughness={1} />
        <meshStandardMaterial attach="material-1" color="#6e694e" roughness={1} />
      </mesh>
      <mesh geometry={ground.grassBase} rotation={[-Math.PI / 2, 0, 0]} position={[0, GRASS_HEIGHT - 0.542, 0]}>
        <meshStandardMaterial attach="material-0" color="#6f9536" roughness={1} />
        <meshStandardMaterial attach="material-1" color="#455733" roughness={1} />
      </mesh>
      <mesh geometry={ground.sand} rotation={[-Math.PI / 2, 0, 0]} position={[0, SAND_HEIGHT, 0]} receiveShadow userData={{ walkableTerrain: true }}>
        <meshStandardMaterial map={paints.sand} color="#ffffff" roughness={1} />
      </mesh>
      <mesh geometry={ground.grass} rotation={[-Math.PI / 2, 0, 0]} position={[0, GRASS_HEIGHT, 0]} receiveShadow userData={{ walkableTerrain: true }}>
        <meshStandardMaterial map={paints.grass} color="#ffffff" roughness={1} />
      </mesh>
      {[
        [-22.2, -7.8, 4.2, 0.72, 3.1], [-22.8, 1.4, 3.5, 0.54, 2.6],
        [20.3, -7.3, 4.6, 0.74, 3.1], [22.2, 1.35, 3.8, 0.58, 2.6],
        [-17.8, -8.7, 3.1, 0.48, 2.2], [16.7, -8.4, 3.2, 0.49, 2.25],
        [-7, 8.7, 4.1, 0.42, 2.9], [1, 10, 4.1, 0.30, 2.6],
        [9, 6, 3, 0.34, 2.6],
      ].map(([x, z, width, height, depth], i) => (
        <GroundMound key={`coastal-rise-${i}`} position={[x, z]} scale={[width, height, depth]} map={paints.grass} />
      ))}
      <mesh geometry={ground.grassLip}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={ground.sandRim}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={ground.shallows}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={ground.foam}>
        <meshBasicMaterial color="#d9ecdb" transparent opacity={0.68} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
