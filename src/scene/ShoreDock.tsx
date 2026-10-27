import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  DOCK_ORIGIN, DOCK_START_Z, DOCK_END_Z, DOCK_WIDTH,
  DOCK_LANDING_START_Z, DOCK_LANDING_WIDTH, DOCK_RAMP_END_Z,
  DOCK_DECK_HEIGHT, DOCK_DECK_THICKNESS, dockHeightAt,
} from './dockLayout'

type Point = [number, number, number]
type MeshData = { positions: number[]; colors: number[] }

function quad(data: MeshData, a: Point, b: Point, c: Point, d: Point, pigment: string) {
  const color = new THREE.Color(pigment)
  for (const point of [a, b, c, a, c, d]) {
    data.positions.push(...point)
    data.colors.push(color.r, color.g, color.b)
  }
}

function box(data: MeshData, center: Point, size: Point, pigment: string) {
  const [x, y, z] = center
  const [width, height, depth] = size.map((value) => value / 2)
  const corners: Point[] = [
    [x - width, y - height, z - depth], [x + width, y - height, z - depth],
    [x + width, y - height, z + depth], [x - width, y - height, z + depth],
    [x - width, y + height, z - depth], [x + width, y + height, z - depth],
    [x + width, y + height, z + depth], [x - width, y + height, z + depth],
  ]
  for (const [a, b, c, d] of [[4, 7, 6, 5], [0, 1, 2, 3], [0, 3, 7, 4], [1, 5, 6, 2], [0, 4, 5, 1], [3, 2, 6, 7]]) {
    quad(data, corners[a], corners[b], corners[c], corners[d], pigment)
  }
}

function geometryFrom(data: MeshData) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

function makeDock() {
  const deck: MeshData = { positions: [], colors: [] }
  const timber: MeshData = { positions: [], colors: [] }
  const breaks = [DOCK_START_Z, DOCK_RAMP_END_Z, DOCK_LANDING_START_Z, DOCK_END_Z]
  for (let z = DOCK_START_Z + 0.36; z < DOCK_END_Z - 0.1; z += 0.36) breaks.push(z)
  breaks.sort((a, b) => a - b)
  const sections = breaks.filter((value, index) => index === 0 || value - breaks[index - 1] > 0.001)
  const palette = ['#a77d49', '#b18a55', '#ad814d', '#b58d57', '#a9814f']

  for (let index = 0; index < sections.length - 1; index++) {
    const start = sections[index]
    const end = sections[index + 1]
    const halfWidth = (start >= DOCK_LANDING_START_Z ? DOCK_LANDING_WIDTH : DOCK_WIDTH) / 2
    const localStart = start - DOCK_START_Z
    const localEnd = end - DOCK_START_Z
    const topStart = dockHeightAt(DOCK_ORIGIN[0], start)!
    const topEnd = dockHeightAt(DOCK_ORIGIN[0], end)!
    const seamEnd = Math.min(end, start + 0.012)
    const localSeam = seamEnd - DOCK_START_Z
    const seamHeight = dockHeightAt(DOCK_ORIGIN[0], seamEnd)!
    const color = palette[index % palette.length]

    // Planks touch exactly. A narrow strip of dark pigment marks the seam
    // within the same top plane, so even the visual gaps stay walkable.
    quad(deck,
      [-halfWidth, topStart, localStart], [-halfWidth, seamHeight, localSeam],
      [halfWidth, seamHeight, localSeam], [halfWidth, topStart, localStart], '#735937')
    quad(deck,
      [-halfWidth, seamHeight, localSeam], [-halfWidth, topEnd, localEnd],
      [halfWidth, topEnd, localEnd], [halfWidth, seamHeight, localSeam], color)

    const undersideStart = topStart - DOCK_DECK_THICKNESS
    const undersideEnd = topEnd - DOCK_DECK_THICKNESS
    quad(deck,
      [-halfWidth, undersideStart, localStart], [halfWidth, undersideStart, localStart],
      [halfWidth, undersideEnd, localEnd], [-halfWidth, undersideEnd, localEnd], '#5e4930')
    quad(deck,
      [-halfWidth, undersideStart, localStart], [-halfWidth, undersideEnd, localEnd],
      [-halfWidth, topEnd, localEnd], [-halfWidth, topStart, localStart], '#89643d')
    quad(deck,
      [halfWidth, undersideStart, localStart], [halfWidth, topStart, localStart],
      [halfWidth, topEnd, localEnd], [halfWidth, undersideEnd, localEnd], '#947044')
    quad(deck,
      [-halfWidth, undersideStart, localStart], [-halfWidth, topStart, localStart],
      [halfWidth, topStart, localStart], [halfWidth, undersideStart, localStart], '#8d693f')
    quad(deck,
      [-halfWidth, undersideEnd, localEnd], [halfWidth, undersideEnd, localEnd],
      [halfWidth, topEnd, localEnd], [-halfWidth, topEnd, localEnd], '#8d693f')
  }

  // Six low posts sit beyond the deck's sides; the landing remains open.
  const postPairs = [
    { z: DOCK_RAMP_END_Z + 0.18, width: DOCK_WIDTH },
    { z: 18.1, width: DOCK_WIDTH },
    { z: DOCK_END_Z - 0.27, width: DOCK_LANDING_WIDTH },
  ]
  for (const [index, pair] of postPairs.entries()) {
    for (const side of [-1, 1]) {
      const x = side * (pair.width / 2 + 0.095)
      const z = pair.z - DOCK_START_Z
      box(timber, [x, 0.2, z], [0.2, 1.16, 0.22], index % 2 ? '#85623c' : '#967344')
      box(timber, [x, 0.81, z], [0.27, 0.08, 0.29], '#b18a54')
    }
  }

  // Broad underside beams make the deck read as timber supported in the sea.
  const beamStart = DOCK_RAMP_END_Z - DOCK_START_Z
  const beamEnd = DOCK_END_Z - DOCK_START_Z
  for (const side of [-1, 1]) {
    box(timber, [side * (DOCK_WIDTH / 2 - 0.24), DOCK_DECK_HEIGHT - 0.2, (beamStart + beamEnd) / 2],
      [0.18, 0.16, beamEnd - beamStart], '#6e5233')
  }
  for (const pair of postPairs) {
    box(timber, [0, DOCK_DECK_HEIGHT - 0.24, pair.z - DOCK_START_Z],
      [pair.width + 0.3, 0.18, 0.19], '#755535')
  }

  return { deck: geometryFrom(deck), timber: geometryFrom(timber) }
}

export function ShoreDock() {
  const geometry = useMemo(makeDock, [])
  useEffect(() => () => {
    geometry.deck.dispose()
    geometry.timber.dispose()
  }, [geometry])

  return (
    <group position={DOCK_ORIGIN}>
      <mesh geometry={geometry.deck} castShadow receiveShadow userData={{ walkableTerrain: true }}>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      <mesh geometry={geometry.timber} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
    </group>
  )
}
