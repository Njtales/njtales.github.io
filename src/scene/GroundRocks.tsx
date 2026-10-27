import { useMemo } from 'react'
import * as THREE from 'three'

export type GroundRockProps = {
  /** Position of the terrain surface; the bottom of the stone sits below it. */
  position: [number, number, number]
  size?: number
  variant?: number
  rotation?: number
}

type Point = [number, number, number]
type RockGeometry = { stone: THREE.BufferGeometry; contact: THREE.BufferGeometry }

const geometries = new Map<number, RockGeometry>()
const stoneMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 1,
  metalness: 0,
})
const contactMaterial = new THREE.MeshBasicMaterial({
  color: '#35432b',
  transparent: true,
  opacity: 0.24,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
})

// The shoulder is deliberately below an off-centre ridge. This leaves broad
// sloping faces rather than the equally sized facets of a regular polyhedron.
const base: Point[] = [
  [-0.38, -0.055, -0.14], [-0.2, -0.055, -0.28],
  [0.23, -0.055, -0.24], [0.42, -0.055, 0.06],
  [0.22, -0.055, 0.28], [-0.26, -0.055, 0.23],
  [-0.32, 0.1, -0.12], [-0.15, 0.21, -0.22],
  [0.17, 0.23, -0.17], [0.34, 0.11, 0.05],
  [0.16, 0.1, 0.22], [-0.23, 0.08, 0.18],
  [-0.12, 0.35, -0.02], [0.14, 0.31, 0.01],
]
const topFaces = [
  [6, 7, 12], [7, 8, 13], [7, 13, 12], [8, 9, 13],
  [9, 10, 13], [10, 11, 12], [10, 12, 13], [11, 6, 12],
]
const topColors = ['#c8c49a', '#d5d0ac', '#d9d5b5', '#b4b28c', '#a5a985', '#c4c19c', '#d0cda8', '#b9bb94']
const sideColors = ['#838a66', '#949976', '#7a8362', '#6f7c58', '#7e8964', '#909671']

function makeGeometry(variant: number): RockGeometry {
  const cached = geometries.get(variant)
  if (cached) return cached

  const proportions = [[1, 1, 1], [0.88, 0.86, 1.14], [1.13, 0.78, 0.87], [0.9, 1.08, 0.94]][variant]
  const points = base.map(([x, y, z], index): Point => {
    const corner = index % 6
    const irregularity = variant === 0 ? 0 : Math.sin(corner * 1.7 + variant * 2.4) * 0.035
    return [
      (x + irregularity + (index >= 12 ? (variant - 1) * 0.035 : 0)) * proportions[0],
      y * proportions[1] * (index >= 6 ? 1 + Math.sin(index * 2.1 + variant) * 0.065 : 1),
      (z + irregularity * 0.6) * proportions[2],
    ]
  })
  const positions: number[] = []
  const colors: number[] = []
  const vectorA = new THREE.Vector3()
  const vectorB = new THREE.Vector3()
  const origin = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const color = new THREE.Color()

  function triangle(a: number, b: number, c: number, shade: string, top: boolean) {
    origin.fromArray(points[a])
    vectorA.fromArray(points[b]).sub(origin)
    vectorB.fromArray(points[c]).sub(origin)
    normal.crossVectors(vectorA, vectorB)
    const outward = top ? normal.y : normal.x * points[a][0] + normal.z * points[a][2]
    if (outward < 0) [b, c] = [c, b]
    color.set(shade)
    for (const index of [a, b, c]) {
      positions.push(...points[index])
      colors.push(color.r, color.g, color.b)
    }
  }

  for (let index = 0; index < 6; index++) {
    const next = (index + 1) % 6
    triangle(index, next, next + 6, sideColors[index], false)
    triangle(index, next + 6, index + 6, sideColors[index], false)
  }
  topFaces.forEach(([a, b, c], index) => triangle(a, b, c, topColors[index], true))

  const stone = new THREE.BufferGeometry()
  stone.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  stone.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  stone.computeVertexNormals()
  stone.computeBoundingSphere()

  // Just the footprint, with a tiny lip beyond the buried base. Real cast
  // shadows supply direction; this patch only anchors the ground contact.
  const footprint: number[] = []
  for (let index = 0; index < 6; index++) {
    const next = (index + 1) % 6
    footprint.push(0, 0.008, 0,
      points[next][0] * 1.035, 0.008, points[next][2] * 1.035,
      points[index][0] * 1.035, 0.008, points[index][2] * 1.035)
  }
  const contact = new THREE.BufferGeometry()
  contact.setAttribute('position', new THREE.Float32BufferAttribute(footprint, 3))
  contact.computeVertexNormals()
  contact.computeBoundingSphere()

  const geometry = { stone, contact }
  geometries.set(variant, geometry)
  return geometry
}

export function GroundRock({ position, size = 1, variant = 0, rotation = 0 }: GroundRockProps) {
  const shape = ((Math.trunc(variant) % 4) + 4) % 4
  const geometry = useMemo(() => makeGeometry(shape), [shape])

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={size} dispose={null}>
      <mesh geometry={geometry.contact} material={contactMaterial} />
      <mesh geometry={geometry.stone} material={stoneMaterial} castShadow receiveShadow />
    </group>
  )
}
