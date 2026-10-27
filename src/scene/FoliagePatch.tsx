import * as THREE from 'three'

type Point = [number, number, number]
type PaintMesh = { positions: number[]; colors: number[]; indices: number[] }

function vertex(data: PaintMesh, point: Point, color: THREE.Color) {
  const index = data.positions.length / 3
  data.positions.push(...point)
  data.colors.push(color.r, color.g, color.b)
  return index
}

function palm(data: PaintMesh, variation: number) {
  const sides = 9
  const levels = 25
  const start = data.positions.length / 3
  const dark = new THREE.Color('#675334')
  const light = new THREE.Color('#bb9554')
  for (let ring = 0; ring <= levels; ring++) {
    const t = ring / levels
    const y = -0.045 + t * 2.29
    const radius = (0.205 - t * 0.075) * (ring % 3 === 1 ? 1.045 : 1)
    for (let side = 0; side < sides; side++) {
      const angle = side / sides * Math.PI * 2
      const lit = 0.5 + Math.cos(angle + 0.8) * 0.28
      const color = dark.clone().lerp(light, lit)
      if (ring % 3 === 1) color.multiplyScalar(0.74)
      vertex(data, [0.27 * t * t + Math.cos(angle) * radius, y,
        -0.13 * t * t + Math.sin(angle) * radius], color)
    }
    if (ring === 0) continue
    for (let side = 0; side < sides; side++) {
      const a = start + (ring - 1) * sides + side
      const b = start + (ring - 1) * sides + (side + 1) % sides
      const c = start + ring * sides + side
      const d = start + ring * sides + (side + 1) % sides
      data.indices.push(a, c, b, c, d, b)
    }
  }

  const leafDark = new THREE.Color('#1b4838')
  const leafMid = new THREE.Color('#527f37')
  const leafLight = new THREE.Color('#b1ca50')
  for (let frond = 0; frond < 8; frond++) {
    const angle = frond / 8 * Math.PI * 2 + 0.19 * Math.sin(frond * 2.3 + variation)
    const length = 1.91 + Math.sin(frond * 1.73 + variation + 0.8) * 0.30
    const width = 0.47 + Math.cos(frond * 1.9 + variation) * 0.075
    const dx = Math.cos(angle), dz = Math.sin(angle)
    const sections = 7
    function leafPoint(step: number, side: number): Point {
      const u = step / sections
      const arch = Math.sin(u * Math.PI) * 0.57 - u * u * (0.46 + frond % 3 * 0.065)
      const notch = (step === 4 && side === (frond % 2 ? -1 : 1))
        || (step === 6 && side === (frond % 2 ? 1 : -1)) ? 0.68 : 1
      const bladeWidth = Math.pow(Math.sin(u * Math.PI), 0.72) * width * notch
      const bend = Math.sin(u * Math.PI) * Math.sin(frond * 2.4) * 0.12
      const lateral = side * bladeWidth + bend
      const fold = side === 0 ? Math.sin(u * Math.PI) * 0.17 : -bladeWidth * 0.17
      return [0.27 + dx * length * u - dz * lateral,
        2.24 + arch + fold + Math.sin(frond * 2.6 + variation) * 0.14,
        -0.13 + dz * length * u + dx * lateral]
    }
    // Each half keeps one clear painted tone across its width. This makes
    // the fold readable instead of blending both halves into a pale ribbon.
    for (const side of [-1, 1]) {
      const start = data.positions.length / 3
      for (let step = 0; step <= sections; step++) {
        const tone = side === -1 ? leafDark.clone().lerp(leafMid, 0.48)
          : leafMid.clone().lerp(leafLight, 0.76)
        const u = step / sections
        const patch = Math.sin(u * Math.PI) * 0.17 + Math.sin(frond * 2.7 + variation + step * 1.2) * 0.055
        tone.lerp(side === -1 ? leafMid : leafLight, Math.max(0, patch))
        tone.multiplyScalar(0.88 + Math.sin(angle + variation) * 0.08 + Math.sin(u * Math.PI) * 0.10)
        vertex(data, leafPoint(step, 0), tone.clone().lerp(leafLight, 0.20))
        vertex(data, leafPoint(step, side), tone)
        if (step === 0) continue
        const a = start + (step - 1) * 2, b = start + step * 2
        if (side === 1) data.indices.push(a, a + 1, b, a + 1, b + 1, b)
        else data.indices.push(a, b, a + 1, a + 1, b, b + 1)
      }
    }
  }
}

function shrub(data: PaintMesh, x: number, z: number, width: number, height: number, depth: number, variation: number, pink = false) {
  const segments = 24, rings = 5
  const start = data.positions.length / 3
  const palette = [
    ['#183f38', '#4b7e39', '#adca52'],
    ['#173e37', '#3e7448', '#8eb04a'],
    ['#2b5840', '#76a33f', '#c5d76a'],
  ][variation % 3]
  const shade = new THREE.Color(pink ? '#7e3e57' : palette[0])
  const mid = new THREE.Color(pink ? '#d87989' : palette[1])
  const sun = new THREE.Color(pink ? '#f1bc82' : palette[2])
  const phase = variation * 1.7
  function add(radius: number, angle: number) {
    const edge = 1 + Math.sin(angle * 5 + phase) * 0.095 + Math.cos(angle * 11 - phase) * 0.035
    const px = Math.cos(angle) * radius * edge
    const pz = Math.sin(angle) * radius * edge
    const lobes = Math.sin(angle * 3 + phase) * Math.sin(radius * Math.PI) * 0.19
      + Math.cos(angle * 7 - phase) * radius * 0.055
    const profile = Math.sqrt(Math.max(0, 1 - radius * radius)) * (0.93 + lobes)
    const y = height * profile - 0.04 - Math.pow(radius, 8) * 0.12
    const light = THREE.MathUtils.clamp(profile * 0.7 + (-px + pz) * 0.16, 0, 1)
    const patch = Math.sin(px * 8 + phase) * Math.cos(pz * 7 - phase) * 0.075
    const tone = shade.clone().lerp(mid, THREE.MathUtils.smoothstep(light, 0, 0.55))
    tone.lerp(sun, THREE.MathUtils.clamp((light - 0.3) * 1.1 + patch, 0, 0.85))
    vertex(data, [x + px * width, y, z + pz * depth], tone)
  }
  add(0, 0)
  for (let ring = 1; ring <= rings; ring++) {
    for (let segment = 0; segment < segments; segment++) add(ring / rings, segment / segments * Math.PI * 2)
  }
  for (let segment = 0; segment < segments; segment++) {
    const next = (segment + 1) % segments
    data.indices.push(start, start + 1 + next, start + 1 + segment)
    for (let ring = 0; ring < rings - 1; ring++) {
      const a = start + 1 + ring * segments
      const b = a + segments
      data.indices.push(a + segment, a + next, b + segment, a + next, b + next, b + segment)
    }
  }

  // A few broad folded leaf groups give the connected volume a leafy surface.
  // They share this mesh/material; no individual leaf objects or animation.
  function surface(px: number, pz: number) {
    const radius = Math.min(0.995, Math.hypot(px / width, pz / depth))
    const angle = Math.atan2(pz / depth, px / width)
    const lobes = Math.sin(angle * 3 + phase) * Math.sin(radius * Math.PI) * 0.19
      + Math.cos(angle * 7 - phase) * radius * 0.055
    return height * Math.sqrt(1 - radius * radius) * (0.93 + lobes) - 0.008
  }
  const count = pink ? 12 : 28
  for (let leaf = 0; leaf < count; leaf++) {
    const angle = leaf * 2.39996 + phase
    const radius = Math.sqrt((leaf + 0.5) / count) * 0.84
    const px = Math.cos(angle) * radius * width
    const pz = Math.sin(angle) * radius * depth
    const length = (pink ? 0.11 : 0.18) * (0.85 + (leaf % 4) * 0.09)
    const span = length * 0.82
    const direction = angle + 0.45
    const dx = Math.cos(direction), dz = Math.sin(direction)
    const tone = mid.clone().lerp(sun, 0.38 + (leaf % 3) * 0.15)
    const outline: [number, number][] = [
      [px - dx * length, pz - dz * length],
      [px - dx * length * 0.45 - dz * span, pz - dz * length * 0.45 + dx * span],
      [px + dx * length * 0.40 - dz * span * 0.9, pz + dz * length * 0.40 + dx * span * 0.9],
      [px + dx * length, pz + dz * length],
      [px + dx * length * 0.35 + dz * span, pz + dz * length * 0.35 - dx * span],
      [px - dx * length * 0.40 + dz * span * 0.9, pz - dz * length * 0.40 - dx * span * 0.9],
    ]
    const centre = vertex(data, [x + px, surface(px, pz) + 0.055, z + pz], tone)
    const corners = outline.map(([lx, lz], index) => vertex(data,
      [x + lx, surface(lx, lz), z + lz], tone.clone().multiplyScalar(index % 2 ? 0.86 : 1)))
    for (let index = 0; index < corners.length; index++) data.indices.push(centre, corners[index], corners[(index + 1) % corners.length])
  }
}

function geometryFrom(data: PaintMesh) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3))
  geometry.setIndex(data.indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

export function createPalmGeometry(variation: number) {
  const data: PaintMesh = { positions: [], colors: [], indices: [] }
  palm(data, variation)
  return geometryFrom(data)
}

export function createShrubGeometry(variation: number, flowers: boolean) {
  const data: PaintMesh = { positions: [], colors: [], indices: [] }
  if (flowers) shrub(data, 0, 0, 0.56, 0.36, 0.48, variation, true)
  else {
    const height = variation === 2 ? 0.65 : 0.9
    crown(data, [0, height * 0.34, 0], [1.02, height * 0.68, 0.80], variation, variation === 1, true)
  }
  return geometryFrom(data)
}

// One uneven body sits behind overlapping three-leaf sprays. The sprays form
// the outline as well as the surface, instead of decorating separate green balls.
function crown(data: PaintMesh, centre: Point, radii: Point, variation: number, cool: boolean, low = false) {
  const sides = 24, rings = 8
  const start = data.positions.length / 3
  const dark = new THREE.Color('#163f32')
  const lime = low && variation % 3 === 2
  const mid = new THREE.Color(lime ? '#7da640' : cool ? '#326448' : '#548336')
  const light = new THREE.Color(lime ? '#c3d969' : cool ? '#7f9e46' : '#a6c04a')
  const phase = variation * 1.731
  function surface(latitude: number, angle: number) {
    const y = Math.cos(latitude)
    // Broad shoulders and offset crests avoid the old oval/egg profile.
    // Keep a closed underside for shadows and ground contact.
    const shoulder = Math.pow(Math.sin(latitude), 0.52) * (0.91 - y * 0.07)
    const uneven = 1 + Math.sin(angle * 3 + phase + latitude) * 0.23
      + Math.cos(angle * 5 - phase + latitude * 2) * 0.13
    return new THREE.Vector3(
      shoulder * Math.cos(angle) * uneven + y * 0.14,
      y * (y > 0 ? 0.78 : 1) + Math.pow(Math.sin(latitude), 0.52)
        * (Math.sin(angle * 3 + phase) * 0.32 + Math.cos(angle * 2 - phase + latitude) * 0.20),
      shoulder * Math.sin(angle) * uneven)
  }
  function paint(point: THREE.Vector3, patch: number) {
    const sun = THREE.MathUtils.clamp(point.y * 0.55 + (-point.x + point.z) * 0.21 + 0.28, 0, 1)
    const tone = dark.clone().lerp(mid, THREE.MathUtils.smoothstep(sun, 0.01, 0.50))
    return tone.lerp(light, THREE.MathUtils.clamp((sun - 0.22) * 1.05 + patch, 0, 0.86))
  }
  for (let ring = 0; ring <= rings; ring++) {
    const latitude = ring / rings * Math.PI
    for (let side = 0; side <= sides; side++) {
      const angle = side / sides * Math.PI * 2
      const point = surface(latitude, angle)
      vertex(data, [centre[0] + point.x * radii[0], centre[1] + point.y * radii[1],
        centre[2] + point.z * radii[2]], paint(point, -0.08))
      if (ring === 0 || side === 0) continue
      const a = start + (ring - 1) * (sides + 1) + side - 1
      const b = a + sides + 1
      data.indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  const layers = low ? 4 : 6
  for (let layer = 0; layer < layers; layer++) {
    const latitude = 0.18 + layer / (layers - 1) * 1.91
    const count = Math.round(5 + Math.sin(latitude) * (low ? 9 : 12))
    for (let tuft = 0; tuft < count; tuft++) {
      const angle = tuft / count * Math.PI * 2 + layer * 0.43 + phase
      const point = surface(latitude + Math.sin(tuft * 2.7 + phase) * 0.10, angle)
      const normal = new THREE.Vector3(point.x / radii[0], point.y / radii[1], point.z / radii[2]).normalize()
      const across = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle))
      const uphill = across.clone().cross(normal).normalize()
      const anchor = new THREE.Vector3(centre[0] + point.x * radii[0],
        centre[1] + point.y * radii[1], centre[2] + point.z * radii[2]).addScaledVector(normal, 0.025)
      const size = Math.min(radii[0], radii[2]) * (0.27 + Math.sin(tuft * 3.1 + layer) * 0.065)
      const tone = paint(point, Math.sin(tuft * 1.7 + layer + phase) * 0.065)
      // Three blunt-tipped leaves form one stepped, irregular fan. Its raised
      // ridge gives a painted light face and a darker tucked-under face.
      for (let leaf = -1; leaf <= 1; leaf++) {
        const turn = leaf * 0.80 + Math.sin(tuft + phase + layer) * 0.30
        const along = uphill.clone().multiplyScalar(Math.cos(turn)).addScaledVector(across, Math.sin(turn))
        const width = across.clone().multiplyScalar(Math.cos(turn)).addScaledVector(uphill, -Math.sin(turn))
        const length = size * (leaf === 0 ? 1.18 : 0.94)
        const shape = [[-0.34,-0.36],[-0.60,0.05],[-0.46,0.56],[-0.15,0.60],
          [0.07,1],[0.45,0.64],[0.55,0.10]]
        const ridge = anchor.clone().addScaledVector(along, length * 0.29).addScaledVector(normal, size * 0.18)
        const centreIndex = vertex(data, [ridge.x,ridge.y,ridge.z],tone)
        const corners = shape.map(([x,y],edge) => {
          const p = anchor.clone().addScaledVector(width,x * size).addScaledVector(along,y * length)
            .addScaledVector(normal, edge > 1 && edge < 6 ? size * 0.10 : -0.015)
          return vertex(data,[p.x,p.y,p.z],tone.clone().multiplyScalar(edge < 4 ? 0.93 : 0.79))
        })
        for (let edge=0;edge<corners.length;edge++) data.indices.push(centreIndex,corners[edge],corners[(edge+1)%corners.length])
      }
    }
  }
}

function branch(data: PaintMesh, from: Point, to: Point, base: number, tip: number) {
  const axis = new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize()
  const across = new THREE.Vector3(0, 0, 1).cross(axis).normalize()
  const other = axis.clone().cross(across).normalize()
  const start = data.positions.length / 3
  const shade = new THREE.Color('#594c32'), sun = new THREE.Color('#b29351')
  for (let ring = 0; ring < 2; ring++) {
    const centre = ring === 0 ? from : to
    const radius = ring === 0 ? base : tip
    for (let side = 0; side < 8; side++) {
      const angle = side / 8 * Math.PI * 2
      const offset = across.clone().multiplyScalar(Math.cos(angle) * radius)
        .addScaledVector(other, Math.sin(angle) * radius)
      vertex(data, [centre[0] + offset.x, centre[1] + offset.y, centre[2] + offset.z],
        shade.clone().lerp(sun, 0.45 + Math.cos(angle + 1) * 0.35))
      if (ring === 0) continue
      const a = start + side, next = start + (side + 1) % 8
      data.indices.push(a, next, a + 8, next, next + 8, a + 8)
    }
  }
}

export function createLeafyTreeGeometry(variation: number) {
  const data: PaintMesh = { positions: [], colors: [], indices: [] }
  branch(data, [0, -0.06, 0], [0.08, 0.82, 0], 0.19, 0.09)
  branch(data, [0.03, 0.38, 0], [-0.45, 0.94, 0.12], 0.11, 0.045)
  branch(data, [0.06, 0.48, 0], [0.56, 1.08, -0.08], 0.10, 0.035)
  crown(data, [0, 0.79, 0], variation === 0 ? [1.40,0.72,0.94] : [0.98,0.99,0.83],
    variation + 1, variation === 1)
  return geometryFrom(data)
}

export function createThicketGeometry(variation: number) {
  const data: PaintMesh = { positions: [], colors: [], indices: [] }
  crown(data, [-0.60, 0.30, -0.05], [0.92, 0.53, 0.82], variation, false, true)
  crown(data, [0.40, 0.47, -0.20], [0.96, 0.80, 0.78], variation + 1, true, true)
  crown(data, [0.45, 0.28, 0.52], [0.72, 0.50, 0.65], variation + 2, false, true)
  return geometryFrom(data)
}
