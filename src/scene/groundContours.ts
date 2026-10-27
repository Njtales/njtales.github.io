import * as THREE from 'three'
import { dockContains, dockHeightAt } from './dockLayout'

export const GRASS_HEIGHT = 0.19
export const SAND_HEIGHT = 0.145

const outline = new THREE.Shape()
outline.moveTo(-27, -1)
outline.bezierCurveTo(-27, 3, -25, 8, -21, 10)
outline.bezierCurveTo(-16, 13, -10, 11, -5, 12)
outline.bezierCurveTo(1, 13, 6, 11, 11, 10)
outline.bezierCurveTo(17, 9, 22, 10, 26, 7)
outline.bezierCurveTo(28, 4, 26, 0, 24, -3)
outline.bezierCurveTo(22, -7, 19, -8, 16, -10)
outline.bezierCurveTo(12, -13, 8, -12, 3, -13)
outline.bezierCurveTo(-3, -14, -6, -11, -11, -12)
outline.bezierCurveTo(-16, -13, -20, -10, -24, -8)
outline.bezierCurveTo(-27, -6, -29, -4, -27, -1)
outline.closePath()

const base = outline.getSpacedPoints(320).slice(0, -1)

export function outwardNormal(points: THREE.Vector2[], index: number) {
  const previous = points[(index + points.length - 1) % points.length]
  const next = points[(index + 1) % points.length]
  // Contours run clockwise in the island's local XY plane.
  return new THREE.Vector2(previous.y - next.y, next.x - previous.x).normalize()
}

// Keep the original island's broad bays, then give the close grass edge smaller
// unequal notches. Sand uses the smooth base normals, avoiding offset spikes.
export const grassContour = base.map((point, i) => {
  const s = i * outline.getLength() / base.length
  const front = THREE.MathUtils.smoothstep(-point.y, 2, 9)
  const displacement = front * (Math.sin(s * 0.93) * 0.19
    + Math.sin(s * 2.04 + 1.2) * 0.12 + Math.sin(s * 3.31 + 0.6) * 0.07)
    + (1 - front) * Math.sin(s * 1.42 + 2.7) * 0.045
  return point.clone().addScaledVector(outwardNormal(base, i), displacement)
})

export const sandContour = base.map((point, i) => {
  const s = i * outline.getLength() / base.length
  const front = THREE.MathUtils.smoothstep(-point.y, -1, 10)
  const width = 0.7 + front * 4.65 + Math.sin(s * 0.24 + 1.5) * 0.2
  const scallop = Math.sin(s * 1.11 + 0.8) * 0.16 + Math.sin(s * 2.17) * 0.055
  return point.clone().addScaledVector(outwardNormal(base, i), width + scallop)
})

function shapeFromContour(points: THREE.Vector2[]) {
  const shape = new THREE.Shape(points)
  shape.closePath()
  return shape
}

export const grassShape = shapeFromContour(grassContour)
export const sandShape = shapeFromContour(sandContour)

export function pointInContour(x: number, z: number, polygon: THREE.Vector2[]) {
  const localY = -z
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i++) {
    const a = polygon[i]
    const b = polygon[j]
    if ((a.y > localY) !== (b.y > localY)
      && x < (b.x - a.x) * (localY - a.y) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

export function groundHeightAt(x: number, z: number) {
  const ground = pointInContour(x, z, grassContour) ? GRASS_HEIGHT : SAND_HEIGHT
  return Math.max(ground, dockHeightAt(x, z) ?? ground)
}

export function canWalkTo(x: number, z: number) {
  // Test the combined surface so feet can cross the beach/deck join freely.
  const onSurface = (px: number, pz: number) => pointInContour(px, pz, sandContour) || dockContains(px, pz)
  if (!onSurface(x, z)) return false
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4
    if (!onSurface(x + Math.cos(angle) * 0.55, z + Math.sin(angle) * 0.55)) return false
  }
  return true
}
