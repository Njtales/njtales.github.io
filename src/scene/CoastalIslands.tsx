import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { GroundRock } from './GroundRocks'
import { makeIslandFoliage } from './islandFoliage'

type CoastalIslandsProps = {
  grassMap: THREE.Texture
  sandMap: THREE.Texture
}

type IslandPlacement = {
  position: [number, number, number]
  scale: number
  rotation: number
  hillScale: number
  stretch: number
}

const placements: IslandPlacement[] = [
  { position: [-34, 0, -23], scale: 1.05, rotation: -0.22, hillScale: 1.45, stretch: 1.15 },
  { position: [-24, 0, -35], scale: 0.60, rotation: 0.24, hillScale: 0.7, stretch: 0.8 },
  { position: [-11, 0, -25], scale: 1.18, rotation: 0.14, hillScale: 2.2, stretch: 1.3 },
  { position: [-4.6, 0, -30.5], scale: 0.51, rotation: 0.17, hillScale: 1.6, stretch: 0.9 },
  { position: [12.5, 0, -34], scale: 0.76, rotation: -0.2, hillScale: 0.9, stretch: 1.8 },
  { position: [23, 0, -25.5], scale: 1.25, rotation: -0.25, hillScale: 2.8, stretch: 0.9 },
  { position: [38, 0, -34], scale: 0.62, rotation: 0.13, hillScale: 1.1, stretch: 1.7 },
]

const segments = 20
const rings = 5

function geometryFrom(positions: number[], uv: number[], indices: number[]) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

function makeIsland(variant: number, hillScale: number) {
  const phase = variant * 1.43 + 0.31
  const width = 2.92 + (variant % 3) * 0.18
  const depth = 1.34 + (variant % 2) * 0.2
  const boundary = Array.from({ length: segments }, (_, index) => {
    const angle = index / segments * Math.PI * 2
    const irregularity = 1 + Math.sin(angle * 3 + phase) * 0.075
      + Math.cos(angle * 5 - phase * 0.6) * 0.035
    return new THREE.Vector2(
      Math.cos(angle) * width * irregularity + Math.sin(angle * 2 + phase) * 0.1,
      Math.sin(angle) * depth * irregularity + Math.cos(angle * 3 - phase) * 0.055,
    )
  })

  const normals = boundary.map((_, index) => {
    const previous = boundary[(index + segments - 1) % segments]
    const next = boundary[(index + 1) % segments]
    return new THREE.Vector2(next.y - previous.y, previous.x - next.x).normalize()
  })
  const edgeHeight = (index: number) => 0.142 + Math.sin(index * 0.71 + phase) * 0.004
  const beachWidth = (index: number) => 0.19 + Math.sin(index / segments * Math.PI * 4 + phase) * 0.035
    + (variant % 3) * 0.013
  const shore = boundary.map((point, index) => point.clone().addScaledVector(normals[index], beachWidth(index)))

  const grassPositions: number[] = []
  const grassUv: number[] = []
  const grassIndices: number[] = []
  const paintU = 0.27 + (variant % 4) * 0.13
  const paintV = 0.29 + (variant % 3) * 0.19
  function grassVertex(x: number, z: number, radius: number, coastY: number) {
    const nx = x / width
    const nz = z / depth
    // Offset shoulders merge into one continuous land surface. A wide low
    // saddle, uneven peak positions and a quiet coast avoid stacked green hats.
    const peakA = Math.exp(-((nx + 0.27 - Math.sin(phase) * 0.08) ** 2 / 0.32
      + (nz + 0.05 + Math.cos(phase) * 0.11) ** 2 / 0.48)) * (0.36 + (variant % 3) * 0.026)
    const peakB = Math.exp(-((nx - 0.43 + Math.cos(phase) * 0.1) ** 2 / 0.23
      + (nz - 0.19 + Math.sin(phase) * 0.13) ** 2 / 0.37)) * (0.18 + (variant % 2) * 0.04)
    const coastFade = 1 - THREE.MathUtils.smoothstep(radius, 0.6, 1)
    grassPositions.push(x, coastY + (peakA + peakB) * coastFade * hillScale, z)
    // Crops differ between islands without cloning or changing shared maps.
    grassUv.push(paintU + nx * 0.145 + nz * 0.022, paintV - nz * 0.16 + nx * 0.024)
  }
  grassVertex(0, 0, 0, 0.142)
  for (let ring = 1; ring <= rings; ring++) {
    const radius = ring / rings
    for (let index = 0; index < segments; index++) {
      const point = boundary[index]
      grassVertex(point.x * radius, point.y * radius, radius, edgeHeight(index))
    }
  }
  for (let index = 0; index < segments; index++) {
    const next = (index + 1) % segments
    grassIndices.push(0, 1 + next, 1 + index)
    for (let ring = 0; ring < rings - 1; ring++) {
      const inner = 1 + ring * segments
      const outer = inner + segments
      grassIndices.push(inner + index, inner + next, outer + index,
        inner + next, outer + next, outer + index)
    }
  }
  const grass = geometryFrom(grassPositions, grassUv, grassIndices)
  const grassNormals = grass.getAttribute('normal')
  for (let index = 1 + (rings - 1) * segments; index < grassPositions.length / 3; index++) {
    grassNormals.setXYZ(index, 0, 1, 0)
  }

  const sandPositions: number[] = []
  const sandUv: number[] = []
  const sandIndices: number[] = []
  const sandU = 0.25 + variant * 0.075
  const sandV = 0.2 + (variant % 3) * 0.12
  const addSandVertex = (point: THREE.Vector2, y: number) => {
    sandPositions.push(point.x, y, point.y)
    sandUv.push(sandU + point.x / width * 0.095, sandV - point.y / depth * 0.085)
  }
  for (let index = 0; index < segments; index++) {
    addSandVertex(boundary[index], edgeHeight(index) - 0.002)
    addSandVertex(shore[index], 0.075 + Math.sin(index * 0.63 + phase) * 0.003)
  }
  for (let index = 0; index < segments; index++) {
    const current = index * 2
    const next = ((index + 1) % segments) * 2
    sandIndices.push(current, next, current + 1, current + 1, next, next + 1)
  }
  // Duplicate the coast vertices so the beach keeps gentle top normals while
  // its side slopes down below the water instead of exposing an elevated slab.
  const skirtStart = sandPositions.length / 3
  for (let index = 0; index < segments; index++) {
    addSandVertex(shore[index], 0.075 + Math.sin(index * 0.63 + phase) * 0.003)
    addSandVertex(shore[index].clone().multiplyScalar(0.96), -0.18)
  }
  for (let index = 0; index < segments; index++) {
    const current = skirtStart + index * 2
    const next = skirtStart + ((index + 1) % segments) * 2
    sandIndices.push(current, next, current + 1, current + 1, next, next + 1)
  }
  const bottomCenter = sandPositions.length / 3
  addSandVertex(new THREE.Vector2(), -0.18)
  for (let index = 0; index < segments; index++) {
    const current = skirtStart + index * 2 + 1
    const next = skirtStart + ((index + 1) % segments) * 2 + 1
    sandIndices.push(bottomCenter, current, next)
  }
  const sand = geometryFrom(sandPositions, sandUv, sandIndices)

  function band(points: THREE.Vector2[], inner: number, outer: number, foam: boolean) {
    const positions: number[] = []
    const uv: number[] = []
    const indices: number[] = []
    for (let index = 0; index < segments; index++) {
      const point = points[index]
      const normal = normals[index]
      const variation = 1 + Math.sin(index * 1.07 + phase) * 0.2
      for (const distance of [inner, outer]) {
        positions.push(point.x + normal.x * distance * variation,
          foam ? 0.048 : edgeHeight(index) + 0.001,
          point.y + normal.y * distance * variation)
        uv.push(0, 0)
      }
      const current = index * 2
      const next = ((index + 1) % segments) * 2
      indices.push(current, next, current + 1, current + 1, next, next + 1)
    }
    return geometryFrom(positions, uv, indices)
  }
  const lip = band(boundary, -0.026, 0.008, false)
  const foam = band(shore, 0.014, 0.075, true)

  const rockIndex = (variant * 3 + 4) % segments
  const rockPoint = boundary[rockIndex].clone().lerp(shore[rockIndex], 0.57)
  const rockPosition: [number, number, number] = [rockPoint.x, 0.103, rockPoint.y]
  return { grass, sand, lip, foam, rockPosition }
}

type IslandMaterials = {
  grass: THREE.MeshStandardMaterial
  sand: THREE.MeshStandardMaterial
  lip: THREE.MeshBasicMaterial
  foam: THREE.MeshBasicMaterial
  foliage: THREE.MeshBasicMaterial
}

function CoastalIslet({ placement, variant, materials }: {
  placement: IslandPlacement
  variant: number
  materials: IslandMaterials
}) {
  const ground = useMemo(() => makeIsland(variant, placement.hillScale), [variant, placement.hillScale])
  const foliage=useMemo(()=>makeIslandFoliage(ground.grass,variant,placement),[ground,variant,placement])
  useEffect(() => () => {
    ground.grass.dispose()
    ground.sand.dispose()
    ground.lip.dispose()
    ground.foam.dispose()
    foliage.geometry.dispose()
  }, [ground,foliage])

  return (
    <group position={placement.position} rotation={[0, placement.rotation, 0]} scale={[placement.scale * placement.stretch, 1, placement.scale]} dispose={null}>
      <mesh geometry={ground.sand} material={materials.sand} receiveShadow />
      <mesh geometry={ground.grass} material={materials.grass} castShadow receiveShadow />
      <mesh geometry={ground.lip} material={materials.lip} />
      <mesh geometry={ground.foam} material={materials.foam} />
      <mesh geometry={foliage.geometry} material={materials.foliage}/>
      {variant % 3 === 0 && (
        <GroundRock position={ground.rockPosition} size={0.49} variant={variant} rotation={variant * 0.71} />
      )}
    </group>
  )
}

export function CoastalIslands({ grassMap, sandMap }: CoastalIslandsProps) {
  const materials = useMemo<IslandMaterials>(() => ({
    grass: new THREE.MeshStandardMaterial({ map: grassMap, color: '#ffffff', roughness: 1 }),
    sand: new THREE.MeshStandardMaterial({ map: sandMap, color: '#ffffff', roughness: 1 }),
    lip: new THREE.MeshBasicMaterial({ color: '#527635', side: THREE.DoubleSide }),
    foam: new THREE.MeshBasicMaterial({ color: '#d9ecdb', transparent: true, opacity: 0.56, depthWrite: false, side: THREE.DoubleSide }),
    foliage: new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false,side:THREE.DoubleSide}),
  }), [grassMap, sandMap])
  useEffect(() => () => {
    Object.values(materials).forEach((material) => material.dispose())
  }, [materials])

  return (
    <group>
      {placements.map((placement, variant) => (
        <CoastalIslet key={`coastal-islet-${variant}`} placement={placement} variant={variant} materials={materials} />
      ))}
    </group>
  )
}
