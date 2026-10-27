import * as THREE from 'three'

type GroundKind = 'grass' | 'sand'
type Pigment = readonly [number, number, number]

const grassPigments = {
  clearing: [103, 161, 45] as Pigment,
  sunlight: [139, 177, 51] as Pigment,
  olive: [101, 143, 42] as Pigment,
  shelter: [54, 106, 43] as Pigment,
  dryPaint: [148, 174, 65] as Pigment,
}

const sandPigments = {
  cream: [244, 226, 188] as Pigment,
  light: [253, 239, 207] as Pigment,
  earth: [211, 185, 150] as Pigment,
  rose: [232, 196, 176] as Pigment,
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function smoothstep(min: number, max: number, value: number) {
  const t = clamp((value - min) / (max - min))
  return t * t * (3 - 2 * t)
}

// Integer hashing makes a refresh reproduce the same painted terrain.
function hash(x: number, y: number, seed: number) {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295
}

function noise(x: number, y: number, seed: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
  const v = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
  const bottom = hash(ix, iy, seed) * (1 - u) + hash(ix + 1, iy, seed) * u
  const top = hash(ix, iy + 1, seed) * (1 - u) + hash(ix + 1, iy + 1, seed) * u
  return bottom * (1 - v) + top * v
}

function blend(a: Pigment, b: Pigment, amount: number): Pigment {
  const t = clamp(amount)
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function grassColor(x: number, y: number): Pigment {
  // Vary the field's coordinates before sampling it: patches join into uneven
  // organic regions instead of exposing the noise lattice or stamped shapes.
  const warpX = (noise(x / 8.6, y / 8.6, 191) - 0.5) * 5.6
    + (noise(x / 2.9, y / 2.9, 419) - 0.5) * 1.45
  const warpY = (noise(x / 8.6 + 13.4, y / 8.6 - 4.2, 829) - 0.5) * 5.6
    + (noise(x / 3.3 - 5.7, y / 3.3 + 2.1, 1229) - 0.5) * 1.45
  const px = x + warpX
  const py = y + warpY
  const broad = noise(px / 8.7 + 3.2, py / 8.7 - 8.4, 1619)
  const middle = noise(px / 3.8 - 7.1, py / 3.8 + 1.3, 2017)
  const small = noise(px / 1.15 + 2.4, py / 1.15 + 5.8, 2741)
  const grain = noise(px / 0.21, py / 0.21, 3229)
  const brokenPaint = noise(px / 2.2 + (small - 0.5) * 0.52, py / 2.2 + (grain - 0.5) * 0.24, 4759)
  const paintField = brokenPaint * 0.79 + small * 0.21

  // Only the outer portion becomes deeper green. This is color variation,
  // not a baked shadow; live object shadows remain the material's job.
  const radius = Math.hypot(x / 26.8, (y - 0.4) / 12.8)
  const perimeter = smoothstep(0.45, 1.08, radius)
  const shelterField = noise(px / 5.8 + 21.2, py / 5.8 - 7.5, 3559)
  const shelter = perimeter * smoothstep(0.31, 0.79, shelterField)
  const sunny = smoothstep(0.24, 0.83, broad) * 0.64
  let color = blend(grassPigments.clearing, grassPigments.sunlight, sunny)
  color = blend(color, grassPigments.olive, smoothstep(0.48, 0.84, middle) * (0.12 + perimeter * 0.31))
  color = blend(color, grassPigments.shelter, shelter * 0.70)
  // Smaller pigment regions have a readable irregular boundary instead of
  // being another blurred light gradient. Keep these restrained at spawn.
  const dryPatch = smoothstep(0.54, 0.67, paintField)
  const greenPatch = 1 - smoothstep(0.29, 0.43, paintField)
  color = blend(color, grassPigments.dryPaint, dryPatch * (0.18 + perimeter * 0.1))
  color = blend(color, grassPigments.olive, greenPatch * (0.2 + perimeter * 0.12))
  const pigment = (middle - 0.5) * (6 + perimeter * 5)
    + (small - 0.5) * 7.6 + (grain - 0.5) * 3.5
  return [color[0] + pigment, color[1] + pigment, color[2] + pigment * 0.5]
}

function sandColor(x: number, y: number): Pigment {
  const warpX = (noise(x / 7.5, y / 7.5, 367) - 0.5) * 4.5
  const warpY = (noise(x / 7.5 + 9.4, y / 7.5 - 2.8, 727) - 0.5) * 4.5
  const px = x + warpX
  const py = y + warpY
  const broad = noise(px / 6.2 + 4.3, py / 6.2 - 3.4, 1087)
  const stain = noise(px / 2.5 - 5.6, py / 2.5 + 11.1, 1459)
  const rose = noise(px / 3.7 + 13.5, py / 3.7 - 6.2, 1847)
  const fine = noise(px / 0.41, py / 0.41, 2213)
  let color = blend(sandPigments.cream, sandPigments.light, smoothstep(0.23, 0.81, broad) * 0.7)
  color = blend(color, sandPigments.earth, smoothstep(0.5, 0.86, stain) * 0.21)
  color = blend(color, sandPigments.rose, smoothstep(0.6, 0.87, rose) * 0.19)
  const pigment = (fine - 0.5) * 2.6
  return [color[0] + pigment, color[1] + pigment, color[2] + pigment]
}

function addFlecks(context: CanvasRenderingContext2D, type: GroundKind, width: number, height: number) {
  let seed = type === 'grass' ? 6827 : 9157
  const random = () => {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0
    return (seed >>> 0) / 4294967296
  }
  const count = 760
  for (let i = 0; i < count; i += 1) {
    const x = random() * width
    const y = random() * height
    if (type === 'grass') {
      // Sparse, tiny broken pigment marks, with no shared brush direction.
      const size = 0.85 + random() * 2.7
      const angle = random() * Math.PI * 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      context.fillStyle = random() < 0.56 ? 'rgba(192,194,95,0.34)' : 'rgba(62,104,38,0.25)'
      context.beginPath()
      context.moveTo(x, y)
      context.bezierCurveTo(
        x + cos * size - sin * size * 0.3, y + sin * size + cos * size * 0.3,
        x + cos * size * 1.9, y + sin * size * 1.9,
        x + cos * size * 1.3 + sin * size * 0.5, y + sin * size * 1.3 - cos * size * 0.5,
      )
      context.closePath()
      context.fill()
    } else {
      const size = 0.45 + random() * 1.0
      context.fillStyle = random() < 0.65 ? 'rgba(137,113,81,0.16)' : 'rgba(255,246,216,0.24)'
      context.fillRect(x, y, size, size * (0.6 + random() * 0.65))
    }
  }
}

/** One opaque, baked color map for the full surface; no frame-time work. */
export function createGroundPaintTexture(type: GroundKind): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = type === 'grass' ? 1536 : 1024
  canvas.height = type === 'grass' ? 768 : 512
  const context = canvas.getContext('2d')
  if (context) {
    // Broad paint is evaluated at a smaller resolution and smoothly enlarged.
    // Tiny marks are added afterward at the final resolution, keeping startup
    // work bounded while preserving soft fields and crisp sparse speckles.
    const paint = document.createElement('canvas')
    paint.width = 512
    paint.height = 256
    const paintContext = paint.getContext('2d')
    if (paintContext) {
      const pixels = paintContext.createImageData(paint.width, paint.height)
      const minX = type === 'grass' ? -28 : -32
      const spanX = type === 'grass' ? 56 : 64
      const maxY = type === 'grass' ? 14 : 16
      const spanY = type === 'grass' ? 28 : 38
      const sample = type === 'grass' ? grassColor : sandColor
      for (let row = 0; row < paint.height; row += 1) {
        // CanvasTexture flips the canvas: its top row maps to the highest v.
        const worldY = maxY - row / (paint.height - 1) * spanY
        for (let column = 0; column < paint.width; column += 1) {
          const worldX = minX + column / (paint.width - 1) * spanX
          const color = sample(worldX, worldY)
          const offset = (row * paint.width + column) * 4
          pixels.data[offset] = clamp(color[0], 0, 255)
          pixels.data[offset + 1] = clamp(color[1], 0, 255)
          pixels.data[offset + 2] = clamp(color[2], 0, 255)
          pixels.data[offset + 3] = 255
        }
      }
      paintContext.putImageData(pixels, 0, 0)
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(paint, 0, 0, canvas.width, canvas.height)
    } else {
      context.fillStyle = type === 'grass' ? '#67a12d' : '#f4e2bc'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    addFlecks(context, type, canvas.width, canvas.height)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}
