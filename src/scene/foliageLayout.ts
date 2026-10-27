import { grassContour, pointInContour } from './groundContours'
import { portfolioSpots } from './portfolioData'

export type FoliagePlant = {
  x: number; z: number; scale: number; rotation: number; variant: number
  kind: 'palm' | 'leafy-tree' | 'thicket' | 'shrub' | 'flowers'
}

const footprints: Record<string, number> = {
  clocktower: 2.4, 'cloud-forge': 3.2, 'data-tower': 2.9,
  'learning-lab': 3, 'about-cottage': 2.8, 'hobbies-hut': 2.5, 'signal-station': 2,
}

// Loose groups and quiet gaps, rather than a uniformly populated grid.
const regions = [
  [-23, -3, 2.8, 2], [-21, 4.8, 2, 2], [-17.6, -7.8, 2, 2],
  [-10, -9.3, 1.7, 1], [1, -10, 1.8, 2], [16, -7.3, 2.4, 1],
  [22, -3.8, 2, 2], [20, 4.3, 1.7, 2], [-16, 8.5, 1.6, 2],
  [-6.7, 9.8, 1.5, 2], [1.5, 10.9, 1.2, 1],
  [-22.7, 8.1, 0.9, 1], [8, -10, 1.4, 1], [18.4, 7.4, 1.2, 1],
]

function onGrass(x: number, z: number, margin: number) {
  if (!pointInContour(x, z, grassContour)) return false
  for (let sample = 0; sample < 8; sample++) {
    const angle = sample * Math.PI / 4
    if (!pointInContour(x + Math.cos(angle) * margin, z + Math.sin(angle) * margin, grassContour)) return false
  }
  return true
}

function reserved(x: number, z: number, crown: number) {
  for (const spot of portfolioSpots) {
    const [bx, , bz] = spot.position
    const radius = footprints[spot.id] ?? 3
    // Include the canopy in the roof clearance, plus an open front approach.
    if (Math.hypot(x - bx, z - bz) < radius + crown + 1.1) return true
    if (Math.abs(x - bx) < 1.9 + crown && z > bz && z < bz + radius + 4.3) return true
  }
  if (Math.hypot(x + 3, z - 5.5) < 3.2 + crown * 0.35) return true
  if (Math.abs(x - 13) < 2.4 + crown && z > 9) return true
  if (x < -24 && z > 4.2 && z < 9.5) return true
  return false
}

function scatter() {
  let seed = 241026
  const random = () => {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0
    return (seed >>> 0) / 4294967296
  }
  const plants: FoliagePlant[] = []
  for (const [cx, cz, spread, count] of regions) {
    let placed = 0
    for (let attempt = 0; attempt < 160 && placed < count; attempt++) {
      const angle = random() * Math.PI * 2
      const radius = Math.sqrt(random()) * spread
      const scale = 0.66 + random() * 0.57
      const x = cx + Math.cos(angle) * radius
      const z = cz + Math.sin(angle) * radius * 0.72
      const crown = 2.7 * scale
      if (!onGrass(x, z, 0.9) || reserved(x, z, crown)) continue
      if (plants.some((plant) => Math.hypot(x - plant.x, z - plant.z) < 2.6 + (plant.scale + scale) * 0.35)) continue
      plants.push({ x, z, scale, rotation: random() * Math.PI * 2, variant: Math.floor(random() * 3), kind: 'palm' })
      placed++
    }
  }

  for (const [index, palm] of [...plants].entries()) {
    if (index % 3 === 1) continue
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = random() * Math.PI * 2
      const x = palm.x + Math.cos(angle) * (1.1 + random() * 0.65)
      const z = palm.z + Math.sin(angle) * (0.85 + random() * 0.5)
      const scale = 0.64 + random() * 0.30
      if (!onGrass(x, z, scale * 1.25) || reserved(x, z, scale * 1.2)) continue
      if (plants.some((plant) => plant.kind !== 'palm' && Math.hypot(x - plant.x, z - plant.z) < 1.5)) continue
      plants.push({ x, z, scale, rotation: random() * Math.PI * 2, variant: index % 3,
        kind: index % 5 === 0 ? 'flowers' : 'shrub' })
      break
    }
  }
  // Keep the accepted clearances and positions, but make palms accents in a
  // mixed landscape. The denser ground thickets need a wider grass margin.
  let treeIndex = 0
  return plants.map((plant): FoliagePlant => {
    if (plant.kind !== 'palm') return plant
    const species = treeIndex++ % 3
    if (species === 0) return plant
    if (species === 1) return { ...plant, kind: 'leafy-tree' }
    return { ...plant, kind: onGrass(plant.x, plant.z, 1.8 * plant.scale) ? 'thicket' : 'leafy-tree' }
  })
}

export const foliagePlants = scatter()
export const foliageObstacles = foliagePlants.filter((plant) => plant.kind !== 'flowers').map((plant) => ({
  x: plant.x, z: plant.z,
  radius: ({ palm: 0.21, 'leafy-tree': 0.78, thicket: 1.05, shrub: 0.68, flowers: 0 }[plant.kind]) * plant.scale,
}))
