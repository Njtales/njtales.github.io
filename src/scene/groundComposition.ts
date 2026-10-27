import * as THREE from 'three'
import { foliagePlants, foliageObstacles } from './foliageLayout'
import { portfolioSpots } from './portfolioData'
import { buildingFootprints } from './buildingLayout'

type Point = [number, number]
type GroundKind = 'grass' | 'sand'
type Route = { points: Point[]; width: number; seed: number; closed?: boolean }

function entrance(id: string, front: number): Point {
  const spot = portfolioSpots.find((candidate) => candidate.id === id)!
  const building=buildingFootprints.find(building=>building.id===id)
  return [spot.position[0]+(building?.path[0]??0),spot.position[2]+(building?.path[1]??front)]
}

// Worn walking traces leave the building footprints and the central clearing
// open. Coordinates are world X/Z; the same paint crosses grass, rises and sand.
const routes: Route[] = [
  { points: [[-8.3,4.0],[-4.2,4.3],[.6,5.6],[5.0,7.0],[6.3,3.6],
    [5.2,-.1],[2.1,-3.7],[-2.2,-4.1],[-5.9,-2.2],[-7.3,1.4]], width: 0.55, seed: 11, closed: true },
  { points: [[-4.8,-3.6],[-5.7,-4.4],entrance('clocktower',2.1)], width: 0.48, seed: 27 },
  { points: [[-7.3,2.4],[-9.0,2.4],entrance('cloud-forge',3.7)], width: 0.52, seed: 39 },
  { points: [[-8.3,4.0],[-11.4,5.7],[-15.1,6.5],[-17.9,6.9],entrance('learning-lab',3.7)], width: 0.57, seed: 53 },
  { points: [[2.1,-3.7],[3.5,-2.5],[5.4,-2.0],entrance('data-tower',3.6)], width: 0.47, seed: 67 },
  { points: [entrance('data-tower',3.6),[9.7,-1.1],[13.7,-.2],[18.48,.25],[18.48,-.25],entrance('hobbies-hut',3.3)], width: 0.48, seed: 79 },
  { points: [[5.0,7.0],[8.2,8.6],[11,8.6],entrance('about-cottage',3.5)], width: 0.56, seed: 83 },
  { points: [[.6,5.6],[.5,4.6],entrance('signal-station',2.7)], width: 0.44, seed: 97 },
  { points: [entrance('about-cottage',3.5),[12.4,9.2],[13.3,10.7],[13.4,12.4],[13,14.4]], width: 0.66, seed: 109 },
  { points: [entrance('learning-lab',3.7),[-19.9,8.0],[-21.6,9.3],[-23.0,9.1],[-25.5,7.7],[-27.8,6.8]],
    width: 0.50, seed: 127 },
]

function hash(index: number, seed: number) {
  let n = Math.imul(index + seed * 61, 374761393)
  n = Math.imul(n ^ n >>> 13, 1274126177)
  return ((n ^ n >>> 16) >>> 0) / 4294967295
}

function polygon(context: CanvasRenderingContext2D, points: Point[]) {
  context.beginPath()
  points.forEach(([x,z],index) => index === 0 ? context.moveTo(x,z) : context.lineTo(x,z))
  context.closePath()
}

const sampledRoutes = routes.map((route) => {
  const curve = new THREE.CatmullRomCurve3(route.points.map(([x,z]) => new THREE.Vector3(x,0,z)),
    route.closed ?? false, 'centripetal')
  const count = Math.max(12,Math.ceil(curve.getLength() / 0.12))
  const samples = Array.from({length: count + 1},(_,index) => {
    const t = index / count
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    const width = route.width * 0.36 * (1 + Math.sin(index * 0.61 + route.seed) * 0.12
      + Math.sin(index * 1.77 + route.seed) * 0.07)
    return { x: point.x, z: point.z, nx: -tangent.z, nz: tangent.x, width }
  })
  return {...route,samples}
})

function paintPlanting(context: CanvasRenderingContext2D) {
  context.save()
  context.filter = 'blur(9px)'
  for (const [index,plant] of foliagePlants.entries()) {
    const width = (plant.kind === 'palm' ? 1.6 : plant.kind === 'flowers' ? 0.8 : 1.85) * plant.scale
    for (let pass = 0; pass < 2; pass++) {
      const outline: Point[] = []
      for (let edge = 0; edge < 18; edge++) {
        const angle = edge / 18 * Math.PI * 2
        const r = 1 + Math.sin(angle * 3 + index) * 0.17 + Math.sin(angle * 7 + pass) * 0.09
        outline.push([plant.x + Math.cos(angle) * width * r * (pass ? 0.66 : 1.17),
          plant.z + Math.sin(angle) * width * r * (pass ? 0.48 : 0.80)])
      }
      polygon(context,outline)
      context.fillStyle = pass ? 'rgba(92,117,44,0.14)' : 'rgba(36,88,45,0.17)'
      context.fill()
    }
  }
  context.restore()
}

function paintPaths(context: CanvasRenderingContext2D, type: GroundKind) {
  for (const route of sampledRoutes) {
    for (let pass = 0; pass < 2; pass++) {
      const outline: Point[] = []
      const spread = pass ? 1 : 1.5
      for (const sample of route.samples) outline.push([sample.x + sample.nx * sample.width * spread,
        sample.z + sample.nz * sample.width * spread])
      for (const sample of [...route.samples].reverse()) outline.push([sample.x - sample.nx * sample.width * spread,
        sample.z - sample.nz * sample.width * spread])
      polygon(context,outline)
      context.fillStyle = pass ? (type === 'grass' ? 'rgba(224,224,185,0.82)' : 'rgba(208,194,156,0.44)')
        : (type === 'grass' ? 'rgba(170,178,101,0.32)' : 'rgba(183,166,132,0.14)')
      context.fill()
    }
    // Small bites and short interruptions expose the original ground under
    // the trace. Keep the centre mostly continuous for readable navigation.
    context.save()
    context.globalCompositeOperation = 'destination-out'
    route.samples.forEach((sample,index) => {
      if (index % 3 !== 0) return
      const side = hash(index,route.seed) > 0.5 ? 1 : -1
      const inset = hash(index + 1,route.seed)
      const x = sample.x + sample.nx * sample.width * side * (inset > 0.93 ? 0 : 0.86)
      const z = sample.z + sample.nz * sample.width * side * (inset > 0.93 ? 0 : 0.86)
      const size = sample.width * (0.23 + hash(index + 2,route.seed) * 0.55)
      polygon(context,[[x-size,z-size*0.3],[x+size*0.15,z-size*0.8],
        [x+size,z+size*0.3],[x-size*0.25,z+size*0.7]])
      context.fillStyle = inset > 0.93 ? 'rgba(0,0,0,0.90)' : 'rgba(0,0,0,0.72)'
      context.fill()
    })
    context.restore()
  }
}

function paintPaving(context: CanvasRenderingContext2D) {
  const patches = [
    { x: -14.1, z: 6.45, rx: 2.3, rz: 1.10, seed: 31 },
    { x: -17.8, z: 8.1, rx: 2.05, rz: 1.00, seed: 53 },
    { x: 13.0, z: 12.65, rx: 1.65, rz: 1.7, seed: 79 },
  ]
  const colors = ['#546343','#68734b','#727956','#4b6144','#777a5b','#5c6849']
  for (const patch of patches) {
    // Unevenly spaced seeds produce interlocking flagstones without rows.
    // Exterior seeds trim the rim into broken cells instead of a rectangle.
    const sites: Point[] = []
    for (let attempt = 0; attempt < 480; attempt++) {
      const x = patch.x + (hash(attempt*3,patch.seed)*2-1)*patch.rx*1.42
      const z = patch.z + (hash(attempt*3+1,patch.seed)*2-1)*patch.rz*1.50
      const spacing = 0.40 + hash(attempt*3+2,patch.seed)*0.27
      if (sites.some(([sx,sz]) => Math.hypot(x-sx,z-sz)<spacing)) continue
      sites.push([x,z])
    }

    for (const [index,[x,z]] of sites.entries()) {
      const nx=(x-patch.x)/patch.rx, nz=(z-patch.z)/patch.rz
      const radius=Math.hypot(nx,nz), angle=Math.atan2(nz,nx)
      const boundary=0.94+Math.sin(angle*3+patch.seed)*0.12+Math.cos(angle*5)*0.07
      if (radius>boundary || (radius>0.70 && hash(index+3,patch.seed)>0.70)) continue
      if (foliageObstacles.some((plant) => Math.hypot(x-plant.x,z-plant.z)<plant.radius+0.52)) continue
      let cell: Point[] = [[patch.x-patch.rx*2,patch.z-patch.rz*2],
        [patch.x+patch.rx*2,patch.z-patch.rz*2],[patch.x+patch.rx*2,patch.z+patch.rz*2],
        [patch.x-patch.rx*2,patch.z+patch.rz*2]]
      for (const [other,[sx,sz]] of sites.entries()) {
        if (other===index || cell.length<3) continue
        const dx=sx-x, dz=sz-z, limit=(sx*sx+sz*sz-x*x-z*z)*0.5
        const clipped: Point[]=[]
        for (let edge=0;edge<cell.length;edge++) {
          const a=cell[edge], b=cell[(edge+1)%cell.length]
          const da=a[0]*dx+a[1]*dz-limit, db=b[0]*dx+b[1]*dz-limit
          if (da<=0) clipped.push(a)
          if ((da<=0)!==(db<=0)) {
            const t=da/(da-db)
            clipped.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])
          }
        }
        cell=clipped
      }
      if (cell.length<3) continue
      const stone: Point[]=[]
      const inset=0.91+hash(index+11,patch.seed)*0.055
      for (let edge=0;edge<cell.length;edge++) {
        const a=cell[edge], prev=cell[(edge+cell.length-1)%cell.length], next=cell[(edge+1)%cell.length]
        const bevel=0.035+hash(index*11+edge,patch.seed)*0.13
        for (const neighbor of [prev,next]) stone.push([
          x+(a[0]*(1-bevel)+neighbor[0]*bevel-x)*inset,
          z+(a[1]*(1-bevel)+neighbor[1]*bevel-z)*inset])
      }
      polygon(context,stone)
      context.fillStyle=colors[Math.floor(hash(index+7,patch.seed)*colors.length)]
      context.fill()
      context.strokeStyle='rgba(40,64,35,0.64)'
      context.lineWidth=0.024
      context.stroke()
      context.save()
      context.clip()
      const glaze=context.createLinearGradient(x-0.30,z-0.30,x+0.30,z+0.30)
      glaze.addColorStop(0,'rgba(216,211,157,0.18)')
      glaze.addColorStop(0.55,'rgba(160,170,110,0.02)')
      glaze.addColorStop(1,'rgba(33,54,34,0.13)')
      context.fillStyle=glaze
      context.fillRect(x-1,z-1,2,2)
      if (hash(index+13,patch.seed)>0.48) {
        polygon(context,[stone[0],stone[2],[x+0.08,z-0.04],stone[stone.length-2]])
        context.fillStyle='rgba(43,69,41,0.10)'
        context.fill()
      }
      // Large, quiet paint facets and occasional edge moss remain readable at
      // map scale. No universal bright bevel or repeated corner decoration.
      const [mx,mz]=stone[Math.floor(hash(index+19,patch.seed)*stone.length)]
      if (hash(index+17,patch.seed)>0.31) {
        polygon(context,[[mx-0.17,mz],[mx+0.08,mz-0.09],[mx+0.22,mz+0.08],
          [mx+0.04,mz+0.14],[mx-0.11,mz+0.22]])
        context.fillStyle='rgba(119,150,55,0.72)'
        context.fill()
      }
      if (hash(index+23,patch.seed)>0.76) {
        context.beginPath()
        context.moveTo(mx,mz)
        context.lineTo(mx+(x-mx)*0.48,mz+(z-mz)*0.48)
        context.lineTo(mx+(x-mx)*0.66+0.04,mz+(z-mz)*0.66-0.03)
        context.strokeStyle='rgba(47,65,37,0.50)'
        context.lineWidth=0.018
        context.stroke()
      }
      context.restore()
      // A few corners and outer fragments disappear into the real ground.
      if (radius>0.72 || hash(index+29,patch.seed)>0.80) {
        context.save()
        context.globalCompositeOperation='destination-out'
        polygon(context,[[mx-0.15,mz],[mx+0.06,mz-0.12],[mx+0.13,mz+0.04],[mx-0.04,mz+0.13]])
        context.fillStyle='rgba(0,0,0,0.92)'
        context.fill()
        context.restore()
      }
      if (radius>0.70 && hash(index+31,patch.seed)>0.38) {
        const a=stone[0], b=stone[1]
        context.beginPath()
        context.moveTo(a[0]-0.02,a[1]+0.03)
        context.lineTo(a[0]+0.04,a[1]-0.10)
        context.lineTo(a[0]+0.07,a[1]+0.01)
        context.lineTo(b[0],b[1]-0.04)
        context.lineTo(b[0]+0.03,b[1]+0.08)
        context.closePath()
        context.fillStyle='rgba(94,133,43,0.82)'
        context.fill()
      }
    }
  }
}

/** Main-island-only paint; offshore crops keep using the undecorated maps. */
export function createIslandComposition(base: THREE.Texture,type: GroundKind): THREE.CanvasTexture {
  const source = base.image as HTMLCanvasElement
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const context = canvas.getContext('2d')!
  context.drawImage(source,0,0)
  const bounds = type === 'grass' ? {minX:-28,minZ:-14,width:56,depth:28}
    : {minX:-32,minZ:-16,width:64,depth:38}
  const worldTransform = (target: CanvasRenderingContext2D) => target.setTransform(
    canvas.width/bounds.width,0,0,canvas.height/bounds.depth,
    -bounds.minX*canvas.width/bounds.width,-bounds.minZ*canvas.height/bounds.depth)
  worldTransform(context)
  if (type === 'grass') paintPlanting(context)
  const overlay = document.createElement('canvas')
  overlay.width=canvas.width; overlay.height=canvas.height
  const ink=overlay.getContext('2d')!
  worldTransform(ink)
  paintPaths(ink,type)
  paintPaving(ink)
  context.resetTransform()
  context.drawImage(overlay,0,0)
  const texture=new THREE.CanvasTexture(canvas)
  texture.colorSpace=THREE.SRGBColorSpace
  texture.anisotropy=8
  texture.wrapS=THREE.ClampToEdgeWrapping
  texture.wrapT=THREE.ClampToEdgeWrapping
  return texture
}
