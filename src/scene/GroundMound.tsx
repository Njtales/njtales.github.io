import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { grassContour, sandContour, pointInContour, GRASS_HEIGHT, SAND_HEIGHT } from './groundContours'

export type GroundMoundProps = {
  position: [number, number]
  scale: [number, number, number]
  map: THREE.Texture
}

function distanceToGrassEdge(x: number, z: number) {
  const localY = -z
  let distanceSquared = Infinity
  for (let i = 0; i < grassContour.length; i++) {
    const a = grassContour[i]
    const b = grassContour[(i + 1) % grassContour.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lengthSquared = dx * dx + dy * dy
    const along = lengthSquared > 0
      ? THREE.MathUtils.clamp(((x - a.x) * dx + (localY - a.y) * dy) / lengthSquared, 0, 1)
      : 0
    const offsetX = x - a.x - along * dx
    const offsetY = localY - a.y - along * dy
    distanceSquared = Math.min(distanceSquared, offsetX * offsetX + offsetY * offsetY)
  }
  return Math.sqrt(distanceSquared)
}

function makeMound(centerX: number, centerZ: number, halfWidth: number, height: number, halfDepth: number) {
  const segments = 16
  const rings = 5
  const positions: number[] = []
  const uv: number[] = []
  const indices: number[] = []
  const onIsland: boolean[] = []
  const phase = centerX * 0.31 + centerZ * 0.23

  function vertex(radius: number, angle: number) {
    const irregularity = 1 + Math.sin(angle * 3 + phase) * 0.055 + Math.cos(angle * 5 - phase) * 0.025
    const centerWeight = 1 - radius * radius
    const localX = halfWidth * (Math.cos(angle) * radius * irregularity + centerWeight * 0.08)
    const localZ = halfDepth * (Math.sin(angle) * radius * irregularity - centerWeight * 0.06)
    const worldX = centerX + localX
    const worldZ = centerZ + localZ
    const inside = pointInContour(worldX, worldZ, grassContour)
    const onSand = pointInContour(worldX, worldZ, sandContour)
    const edgeDistance = distanceToGrassEdge(worldX, worldZ)
    const shoreFade = inside ? THREE.MathUtils.smoothstep(edgeDistance, 0.1, 0.8) : 0
    const profile = Math.min(1, centerWeight * centerWeight * (1 + radius * Math.cos(angle - 0.8) * 0.1))
    const buriedHeight = onSand ? SAND_HEIGHT - 0.05 : -0.08
    const surfaceHeight = GRASS_HEIGHT + height * profile - 0.016
    const worldY = THREE.MathUtils.lerp(buriedHeight, surfaceHeight, shoreFade)
    positions.push(localX, worldY, localZ)
    onIsland.push(onSand)
    // The flat island uses local XY coordinates, with local Y equal to -Z.
    // Sampling the same world location keeps its paint continuous up the rise.
    uv.push((worldX + 28) / 56, (-worldZ + 14) / 28)
  }

  vertex(0, 0)
  for (let ring = 1; ring <= rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      vertex(ring / rings, segment / segments * Math.PI * 2)
    }
  }
  function triangle(a: number, b: number, c: number) {
    // An outside vertex below the beach can still sit above the water. Cull
    // those coastal triangles as well as burying them, so no green shelf leaks.
    if (onIsland[a] && onIsland[b] && onIsland[c]) indices.push(a, b, c)
  }
  for (let segment = 0; segment < segments; segment++) {
    const next = (segment + 1) % segments
    triangle(0, 1 + next, 1 + segment)
    for (let ring = 0; ring < rings - 1; ring++) {
      const inner = 1 + ring * segments
      const outer = inner + segments
      triangle(inner + segment, inner + next, outer + segment)
      triangle(inner + next, outer + next, outer + segment)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  // The buried outer ring meets the flat field with an upward-facing normal.
  const normals = geometry.getAttribute('normal')
  for (let index = 1 + (rings - 1) * segments; index < positions.length / 3; index++) {
    normals.setXYZ(index, 0, 1, 0)
  }
  geometry.computeBoundingSphere()
  return geometry
}

export function GroundMound({ position, scale, map }: GroundMoundProps) {
  const [x, z] = position
  const [halfWidth, height, halfDepth] = scale
  const geometry = useMemo(() => makeMound(x, z, halfWidth, height, halfDepth), [x, z, halfWidth, height, halfDepth])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh position={[x, 0, z]} geometry={geometry} castShadow receiveShadow userData={{ walkableTerrain: true }}>
      <meshStandardMaterial map={map} color="#ffffff" roughness={1} />
    </mesh>
  )
}
