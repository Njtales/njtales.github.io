import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PortfolioSpot } from './portfolioData'
import { IslandGround, type GroundPaints } from './IslandGround'
import { CoastalIslands } from './CoastalIslands'
import { GroundRock } from './GroundRocks'
import { groundHeightAt } from './groundContours'
import { canWalkTo } from './worldNavigation'
import { createGroundPaintTexture } from './groundPaint'
import { createIslandComposition } from './groundComposition'
import { ShoreDock } from './ShoreDock'
import { MapFoliage } from './MapFoliage'
import { NiroModel } from './NiroModel'
import { Clocktower } from './Clocktower'
import { VillageBuildings } from './VillageBuildings'
import { SkyClouds } from './SkyClouds'
import { useAmbientTime, useScenePreferences } from './ScenePreferences'
import { findWalkingPath, type WalkPoint } from './walkingPath'
import { buildingFootprints,findNearbyLandmark } from './buildingLayout'
import { NIRO,createNiroRig } from './niroRig'
import { NiroWalker,integrateNiroHeight,surfaceSample,type GroundSampler,type VerticalState } from './NiroMotion'

function BeachDetails() {
  return (
    <group>
      {[
        [-10.5, 14, 1.05], [-9.8, 14.5, 0.53], [-3.4, 15.1, 0.72],
        [-12.5, 7.2, 0.76], [6.8, 7.8, 0.83], [13, -1, 0.67],
        [-17.2, -2.8, 0.8], [10.6, 9.9, 1.06],
      ].map(([x, z, size], i) => (
        <GroundRock key={`ground-rock-${i}`} position={[x, groundHeightAt(x, z), z]} size={size} variant={i} rotation={i * 1.17} />
      ))}
      <ShoreDock />
      <Starfish position={[5.4, groundHeightAt(5.4, 14) + 0.006, 14]} />
      <TideLine />
      <Dock />
    </group>
  )
}

function TideLine() {
  const stones = [
    [-21.2, 11.4, 0.78], [-14.8, 13.2, 0.72], [-5.7, 13.2, 0.65],
    [7.9, 12.4, 0.67], [19.2, 8.8, 0.74], [22.6, 6.6, 0.61],
  ]
  return (
    <group>
      {stones.map(([x, z, size], i) => (
        <GroundRock key={`tide-stone-${i}`} position={[x, groundHeightAt(x, z), z]} size={size} variant={i + 1} rotation={i * 0.61} />
      ))}
    </group>
  )
}

function Starfish({ position }: { position: [number, number, number] }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    for (let i = 0; i < 10; i += 1) {
      const angle = Math.PI / 2 + (i * Math.PI) / 5
      const radius = i % 2 === 0 ? 0.62 : 0.25
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()
    return new THREE.ShapeGeometry(shape, 1)
  }, [])
  return (
    <group position={position} rotation={[-Math.PI / 2, 0.18, 0]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color="#d56f5a" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.026, 0]}>
        <circleGeometry args={[0.12, 12]} />
        <meshStandardMaterial color="#f0b083" roughness={1} />
      </mesh>
    </group>
  )
}

function Dock() {
  return (
    <group position={[-27.4, 0.29, 6.8]} rotation={[0, -0.16, 0]}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-i * 0.52, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.18, 2.4]} />
          <meshStandardMaterial color={i % 2 ? '#87613f' : '#9a7048'} roughness={1} />
        </mesh>
      ))}
      {[-0.4, 1.6].map((z) => (
        <mesh key={z} position={[-1.5, -0.35, z]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 0.75, 7]} />
          <meshStandardMaterial color="#715237" roughness={1} />
        </mesh>
      ))}
      {[[-1, 0.48, 1.3], [-1.65, 0.45, 1.45]].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.28, 0.33, 0.58, 9]} />
            <meshStandardMaterial color="#b4834c" roughness={1} />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.07, 9]} />
            <meshStandardMaterial color="#e1c88e" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function MapEdgeFraming() {
  return (
    <group>
      {[
        [-26.8, 2.6, 2.35], [-27.4, 3.4, 1.35],
        [26.1, 0.5, 2.15], [26.8, 1.6, 1.3],
      ].map(([x, z, size], i) => (
        <GroundRock key={`shore-rock-${i}`} position={[x, groundHeightAt(x, z), z]} size={size} variant={i} rotation={i * 0.8} />
      ))}
    </group>
  )
}

function HeroCharacter({ onOpen, onPlayerPosition }: { onOpen: (spot: PortfolioSpot) => void; onPlayerPosition: (x: number, z: number) => void }) {
  const { panelOpen } = useScenePreferences()
  const walkingPath = useRef<WalkPoint[]>([]), destination = useRef<WalkPoint | null>(null)
  const destinationRing = useRef<THREE.Mesh>(null), markerTime = useRef(0)
  const destinationGround = useMemo(surfaceSample, [])
  const bob = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)
  const niroRig=useMemo(createNiroRig,[])
  const contactShadow=useRef<THREE.Mesh>(null)
  const pressed = useRef<Record<string, boolean>>({})
  const velocity = useRef(new THREE.Vector2())
  const nearestId = useRef<string | null>(null)
  const { camera, scene, size } = useThree()
  const terrain = useRef<THREE.Object3D[]>([])
  const groundRay = useRef(new THREE.Raycaster())
  const rayOrigin = useMemo(() => new THREE.Vector3(), [])
  const rayDown = useMemo(() => new THREE.Vector3(0, -1, 0), [])
  const [nearby, setNearby] = useState<PortfolioSpot | null>(null)
  const promptAnchor=useRef<THREE.Group>(null)
  const promptPlacement=useRef({position:new THREE.Vector3(),x:NaN,z:NaN})
  const promptGround=useMemo(surfaceSample,[])
  const previousPosition=useMemo(()=>new THREE.Vector3(),[])
  const inputDirection=useMemo(()=>new THREE.Vector3(),[])
  const ground=useMemo(surfaceSample,[])
  const shadowNormal=useMemo(()=>new THREE.Vector3(0,0,1),[])
  const vertical=useRef<VerticalState>({height:groundHeightAt(-3,5.5),velocity:0,grounded:true})
  const sampleGround=useMemo<GroundSampler>(()=>{
    const hits:THREE.Intersection[]=[]
    const normalMatrix=new THREE.Matrix3()
    const cached=surfaceSample()
    let cachedX=NaN,cachedZ=NaN
    return(x,z,out)=>{
      // Terrain is static. Reuse the resting centre sample between substeps.
      if(x===cachedX&&z===cachedZ){
        out.position.copy(cached.position);out.normal.copy(cached.normal);out.supported=cached.supported
        return
      }
      rayOrigin.set(x,12,z);groundRay.current.set(rayOrigin,rayDown);groundRay.current.far=24
      hits.length=0
      groundRay.current.intersectObjects(terrain.current,false,hits)
      const hit=hits[0]
      out.position.set(x,hit?.point.y??groundHeightAt(x,z),z)
      out.normal.set(0,1,0);out.supported=!!hit
      if(hit?.face){
        normalMatrix.getNormalMatrix(hit.object.matrixWorld)
        out.normal.copy(hit.face.normal).applyNormalMatrix(normalMatrix).normalize()
        if(out.normal.y<0)out.normal.negate()
      }
      cachedX=x;cachedZ=z;cached.position.copy(out.position);cached.normal.copy(out.normal);cached.supported=out.supported
    }
  },[rayOrigin,rayDown])
  const walker=useMemo(()=>new NiroWalker(sampleGround),[sampleGround])
  useEffect(() => {
    if (panelOpen) { pressed.current = {}; velocity.current.set(0, 0); walkingPath.current = []; destination.current = null }
  }, [panelOpen])

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true)
    terrain.current = []
    scene.traverse((object) => {
      if (object.userData.walkableTerrain) terrain.current.push(object)
    })
  }, [scene])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const code = event.code
      if ((code === 'KeyE' || code === 'Enter') && event.repeat) return
      if (event.target instanceof Element && event.target.closest('input,select,textarea,[contenteditable="true"]')) return
      if (code !== 'KeyE' && event.target instanceof Element && event.target.closest('button,a,summary')) return
      const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'KeyE', 'Enter']
      if (gameKeys.includes(code)) event.preventDefault()
      if (document.querySelector('[role="dialog"]')) {
        pressed.current[code] = false
        return
      }
      // Even a tap shorter than one rendered frame must cancel auto-walking.
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(code)) {
        walkingPath.current = []; destination.current = null
      }
      pressed.current[code] = true
      if ((code === 'KeyE' || code === 'Enter') && nearby) onOpen(nearby)
    }
    const up = (event: KeyboardEvent) => { pressed.current[event.code] = false }
    const resetMovement = () => { pressed.current = {} }
    const resetWhenHidden = () => { if (document.hidden) resetMovement() }
    const pad = (event: Event) => {
      const { code, down: isDown } = (event as CustomEvent<{ code: string; down: boolean }>).detail
      if (isDown) { walkingPath.current = []; destination.current = null }
      pressed.current[code] = isDown
    }
    const walkTo = (event: Event) => {
      if (document.querySelector('[role="dialog"]') || !root.current) return
      const goal = (event as CustomEvent<WalkPoint>).detail
      walkingPath.current = findWalkingPath(root.current.position, goal)
      destination.current = walkingPath.current.length ? goal : null
      if (destination.current) sampleGround(goal.x, goal.z, destinationGround)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', resetMovement)
    document.addEventListener('visibilitychange', resetWhenHidden)
    window.addEventListener('coastlight:move', pad)
    window.addEventListener('coastlight:walk-to', walkTo)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', resetMovement)
      document.removeEventListener('visibilitychange', resetWhenHidden)
      window.removeEventListener('coastlight:move', pad)
      window.removeEventListener('coastlight:walk-to', walkTo)
    }
  }, [nearby, onOpen, sampleGround, destinationGround])

  useFrame(({ clock }, delta) => {
    if(!root.current||!bob.current)return
    if (destinationRing.current) destinationRing.current.visible = !panelOpen && destination.current !== null
    if (panelOpen) return
    const frameDelta=Math.min(delta,0.05)
    const substeps=Math.max(1,Math.ceil(frameDelta*120))
    const dt=frameDelta/substeps
    const player=root.current.position
    const key=(...codes:string[])=>Number(codes.some(code=>pressed.current[code]===true))
    inputDirection.set(key('KeyD','ArrowRight')-key('KeyA','ArrowLeft'),0,
      key('KeyS','ArrowDown')-key('KeyW','ArrowUp'))
    if (inputDirection.lengthSq() > 0) { walkingPath.current = []; destination.current = null }
    else {
      while (walkingPath.current.length && Math.hypot(walkingPath.current[0].x - player.x, walkingPath.current[0].z - player.z) < .18) walkingPath.current.shift()
      const next = walkingPath.current[0]
      if (next) inputDirection.set(next.x - player.x, 0, next.z - player.z)
      else destination.current = null
    }
    const hasInput=inputDirection.lengthSq()>0
    if(hasInput)inputDirection.normalize()
    const targetSpeed = destination.current && walkingPath.current.length === 1
      ? NIRO.maxSpeed * Math.min(1, Math.hypot(destination.current.x - player.x, destination.current.z - player.z) / .55) : NIRO.maxSpeed
    // Keep support transfer and steering stable when render intervals vary.
    // Geometry/materials stay shared; only the small motion solver substeps.
    for(let step=0;step<substeps;step++){
      previousPosition.copy(player)
      velocity.current.x=THREE.MathUtils.damp(velocity.current.x,hasInput?inputDirection.x*targetSpeed:0,hasInput?14:20,dt)
      velocity.current.y=THREE.MathUtils.damp(velocity.current.y,hasInput?inputDirection.z*targetSpeed:0,hasInput?14:20,dt)
      const dx=velocity.current.x*dt,dz=velocity.current.y*dt
      if(canWalkTo(player.x+dx,player.z+dz)){player.x+=dx;player.z+=dz}
      else{
        if(canWalkTo(player.x+dx,player.z))player.x+=dx
        else velocity.current.x=0
        if(canWalkTo(player.x,player.z+dz))player.z+=dz
        else velocity.current.y=0
      }
      const plannedDistance=Math.hypot(player.x-previousPosition.x,player.z-previousPosition.z)
      if(plannedDistance>0.0001){
        const targetYaw=Math.atan2(player.x-previousPosition.x,player.z-previousPosition.z)
        const turn=THREE.MathUtils.euclideanModulo(targetYaw-bob.current.rotation.y+Math.PI,Math.PI*2)-Math.PI
        bob.current.rotation.y+=THREE.MathUtils.clamp(turn*(1-Math.exp(-NIRO.turnResponse*dt)),-NIRO.maxTurnSpeed*dt,NIRO.maxTurnSpeed*dt)
      }
      walker.constrainTravel(player,previousPosition,bob.current.rotation.y)
      sampleGround(player.x,player.z,ground)
      if(vertical.current.grounded && ground.position.y-player.y>NIRO.stepUp){
        player.x=previousPosition.x;player.z=previousPosition.z;velocity.current.set(0,0)
        sampleGround(player.x,player.z,ground)
      }
      vertical.current.height=player.y
      integrateNiroHeight(vertical.current,ground.position.y,dt)
      player.y=vertical.current.height
      const distance=Math.hypot(player.x-previousPosition.x,player.z-previousPosition.z)
      const speed=distance/Math.max(dt,0.0001)
      walker.update(niroRig,player,bob.current.rotation.y,speed,distance,dt,
        clock.elapsedTime-frameDelta+(step+1)*dt,vertical.current.grounded,velocity.current)
    }
    if(contactShadow.current){
      contactShadow.current.position.y=ground.position.y-player.y+0.009
      contactShadow.current.quaternion.setFromUnitVectors(shadowNormal,ground.normal)
      const height=Math.max(0,player.y-ground.position.y)
      contactShadow.current.scale.setScalar(1+height*0.25)
      const shadowMaterial=contactShadow.current.material as THREE.MeshBasicMaterial
      shadowMaterial.opacity=Math.max(0.03,0.20-height*0.20)
    }
    if (destinationRing.current && destination.current) destinationRing.current.position.copy(destinationGround.position).addScaledVector(destinationGround.normal, .025)
    markerTime.current += delta
    if (markerTime.current > .1) { onPlayerPosition(player.x, player.z); markerTime.current = 0 }

    // Keep the wide reference framing on landscape screens. Narrow screens get
    // a closer walkable view so the character and landmarks stay legible.
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / Math.max(1, size.height)
      const baseFov = THREE.MathUtils.degToRad(39)
      const responsiveFov = THREE.MathUtils.radToDeg(2 * Math.atan(
        Math.tan(baseFov / 2) * (16 / 9) / Math.max(aspect, 0.55),
      ))
      const nextFov = THREE.MathUtils.clamp(responsiveFov, 39, 48)
      if (Math.abs(camera.fov - nextFov) > 0.15) {
        camera.fov = nextFov
        camera.updateProjectionMatrix()
      }
    }
    // Let Niro roam the whole island while keeping the view composed around
    // its landmass. Near either coast the camera eases its focus back inland,
    // so the shoreline remains an edge detail instead of taking over a side
    // of the frame. Wider screens can use a tighter village boundary; narrow
    // screens keep a wider follow range so Niro stays on screen.
    const aspect = size.width / Math.max(1, size.height)
    const wideFrame = THREE.MathUtils.clamp((aspect - 0.55) / 1.25, 0, 1)
    const horizontalLimit = THREE.MathUtils.lerp(20.5, 15.5, wideFrame)
    // Portrait screens need Niro centred even at the pier's outside edge.
    const inlandBias = THREE.MathUtils.clamp(-player.x * 0.28, -6, 6) * wideFrame
    const focusX = THREE.MathUtils.clamp(player.x + inlandBias, -horizontalLimit, horizontalLimit)
    // Follow a little farther south while exploring the beach and new pier.
    const southernFollow = THREE.MathUtils.smoothstep(player.z, 12, 20) * 5
    const focusZ = THREE.MathUtils.clamp(player.z, -7.5, 10.5 + southernFollow)
    // At the far/northern edge, aim past Niro toward the island interior so
    // the follow view doesn't devote half its frame to open water.
    const northernCoastBias = THREE.MathUtils.clamp((-player.z - 3) / 8, 0, 1)
    const target = new THREE.Vector3(focusX, player.y + 1.0, focusZ - 6.5)
    target.z = focusZ - 5.5 + northernCoastBias * 7.5
    const cameraPosition = new THREE.Vector3(focusX, player.y + 11.4, focusZ + 24)
    camera.position.lerp(cameraPosition, 1 - Math.exp(-3.2 * delta))
    camera.lookAt(target)

    const closest=findNearbyLandmark(player.x,player.z)
    if(closest){
      const entrance=buildingFootprints.find(building=>building.id===closest.id)?.entrance??[0,0]
      const x=closest.position[0]+entrance[0],z=closest.position[2]+entrance[1],placement=promptPlacement.current
      if(placement.x!==x||placement.z!==z){
        sampleGround(x,z,promptGround)
        placement.position.set(x,promptGround.position.y+4.1,z)
        placement.x=x;placement.z=z
      }
      promptAnchor.current?.position.copy(placement.position)
    }
    if (nearestId.current !== (closest?.id ?? null)) {
      nearestId.current = closest?.id ?? null
      setNearby(closest)
    }
  })

  return (
    <>
    <group ref={root} position={[-3, groundHeightAt(-3, 5.5), 5.5]}>
      <mesh ref={contactShadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.010, 0]}>
        <circleGeometry args={[0.58, 24]} />
        <meshBasicMaterial color="#294a32" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <group ref={bob}>
        <NiroModel rig={niroRig}/>
      </group>
    </group>
      <mesh ref={destinationRing} visible={false} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
        <ringGeometry args={[.15, .22, 24]} /><meshBasicMaterial color="#fff5dc" transparent opacity={.85} depthWrite={false} />
      </mesh>
      {nearby && !panelOpen && (
        <group key={nearby.id} ref={promptAnchor} position={promptPlacement.current.position}>
          <Html center distanceFactor={20} zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
            <div className="world-prompt"><span>{nearby.section}</span><strong>{nearby.title}</strong><kbd>E</kbd></div>
          </Html>
        </group>
      )}
    </>
  )
}

function SkyBackdrop() {
  const geometry = useMemo(() => {
    // Continue beneath the distant sea: the old lower edge exposed a strip
    // of the renderer's different background colour behind the mountains.
    const sky = new THREE.PlaneGeometry(320, 200, 1, 48)
    const positions = sky.attributes.position
    const colors: number[] = []
    const horizon = new THREE.Color('#b8e8e9')
    const middle = new THREE.Color('#74d0e2')
    const zenith = new THREE.Color('#48b5d8')
    for (let i = 0; i < positions.count; i += 1) {
      const t = THREE.MathUtils.clamp((positions.getY(i) + 49) / 120, 0, 1)
      const color = t < 0.48
        ? horizon.clone().lerp(middle, t / 0.48)
        : middle.clone().lerp(zenith, (t - 0.48) / 0.52)
      colors.push(color.r, color.g, color.b)
    }
    sky.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return sky
  }, [])
  return (
    <mesh geometry={geometry} position={[0, 49, -104]} renderOrder={-10}>
      <meshBasicMaterial vertexColors toneMapped={false} fog={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function PaintedHorizon() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let disposed = false
    let loaded: THREE.Texture | null = null
    const loader = new THREE.TextureLoader()
    loader.load('/assets/coastlight-distant-isles.png', (image) => {
      if (disposed) {
        image.dispose()
        return
      }
      image.colorSpace = THREE.SRGBColorSpace
      image.anisotropy = 4
      loaded = image
      setTexture(image)
    })
    return () => {
      disposed = true
      loaded?.dispose()
    }
  }, [])

  return (
    <mesh position={[0, 1.2, -56]}>
      <planeGeometry args={[154, 34]} />
      {texture && (
        <meshBasicMaterial
          map={texture}
          transparent
          toneMapped={false}
          fog={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  )
}

function OceanGlints() {
  const ambient = useAmbientTime()
  const { quality } = useScenePreferences()
  const glints = useRef<THREE.Group>(null)
  const streaks = useMemo(() => [
    [-36, -18, 1.5], [-31, -25, 1.5], [-24, -20, 2.2], [-15, -29, 1.2], [-7, -23, 1.8], [2, -32, 2.4],
    [10, -25, 1.4], [18, -30, 2], [27, -22, 1.5], [-35, -34, 2.3], [-2, -18, 1.1], [22, -17, 1.3],
    [35, -31, 1.8], [-29, -42, 1.8], [-20, -37, 1.3], [-12, -45, 2], [-3, -39, 1.4], [7, -44, 2.1],
    [16, -38, 1.4], [26, -46, 1.9], [36, -40, 1.5], [-40, -28, 1.2], [-26, -49, 1.6], [-9, -34, 1.1],
    [4, -19, 1.3], [19, -48, 1.4], [31, -36, 1.2], [42, -24, 1.6],
  ] as const, [])
  useFrame(() => {
    if (!glints.current) return
    glints.current.children.forEach((child, i) => {
      child.position.x = streaks[i][0] + Math.sin(ambient.current * 0.12 + i * 1.4) * 0.24
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
      material.opacity = 0.1 + (0.5 + 0.5 * Math.sin(ambient.current * 0.7 + i * 1.7)) * 0.16
    })
  })
  if (quality === 'light') return null
  return (
    <group ref={glints}>
      {streaks.map(([x, z, length], i) => (
        <mesh key={`water-glint-${i}`} position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, Math.sin(i * 4.1) * 0.07]}>
          <planeGeometry args={[length, 0.17 + (i % 3) * 0.07]} />
          <meshBasicMaterial color={i % 3 ? '#9de0d5' : '#e1f0cf'} transparent opacity={0.46} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function OceanShallows() {
  const ambient = useAmbientTime()
  const { quality } = useScenePreferences()
  const group = useRef<THREE.Group>(null)
  const patches: [number, number, number, number, number, string][] = [
    [-34, -16, 2.5, 0.38, -0.14, '#70c8c4'], [-25, -21, 3.4, 0.42, 0.08, '#2c8996'],
    [-15, -18, 2.1, 0.32, -0.1, '#83d4cd'], [-5, -23, 3.2, 0.44, 0.13, '#388f9a'],
    [8, -17, 2.8, 0.36, -0.08, '#75cbc5'], [19, -22, 3.6, 0.45, 0.1, '#2d8290'],
    [31, -18, 2.3, 0.34, -0.12, '#80d1ca'], [-39, -27, 3.5, 0.46, 0.1, '#287b8a'],
    [-29, -31, 2.6, 0.36, -0.12, '#7acbc5'], [-18, -28, 3.8, 0.48, 0.1, '#347f8e'],
    [-7, -34, 2.6, 0.4, -0.12, '#80d0c9'], [5, -29, 3.3, 0.42, 0.08, '#2b7a89'],
    [17, -34, 3.8, 0.46, -0.1, '#6fc4c1'], [29, -29, 2.5, 0.38, 0.12, '#337f8e'],
    [39, -34, 3.1, 0.4, -0.08, '#77cbc5'], [-34, -41, 2.8, 0.4, 0.13, '#327e8b'],
    [-22, -44, 3.6, 0.46, -0.1, '#6dbdc0'], [-9, -43, 2.5, 0.36, 0.12, '#2b7485'],
    [7, -47, 3.3, 0.42, -0.08, '#65b4ba'], [24, -43, 3.7, 0.48, 0.1, '#2b7888'],
    [39, -46, 2.5, 0.36, -0.12, '#63b6bb'],
  ]
  useFrame(() => {
    if (!group.current) return
    group.current.children.forEach((child, i) => {
      const x = patches[i][0]
      child.position.x = x + Math.sin(ambient.current * 0.045 + i * 1.6) * 0.22
    })
  })
  if (quality === 'light') return null
  return (
    <group ref={group}>
      {patches.map(([x, z, sx, sz, rotation, color], i) => (
        <mesh key={`sea-shallow-${i}`} position={[x, 0.075, z]} rotation={[-Math.PI / 2, 0, rotation]} scale={[sx * 1.25, sz * 2.4, 1]}>
          <circleGeometry args={[1, 11]} />
          <meshBasicMaterial color={color} transparent opacity={0.31} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function OceanWaveBands() {
  const waves = useMemo(() => {
    const rows = [
      { z: -14, color: '#83d0ca' }, { z: -20.5, color: '#287f91' },
      { z: -29, color: '#6abfc0' }, { z: -39, color: '#327f8c' },
    ]
    return rows.flatMap((row, rowIndex) => Array.from({ length: 5 }, (_, segment) => {
      const phase = rowIndex * 1.31 + segment * 2.17
      const startX = -42 + segment * 17.2 + Math.sin(phase) * 3.1
      const length = 4.2 + (0.5 + 0.5 * Math.sin(phase * 1.7)) * 7.8
      const points = Array.from({ length: 7 }, (_, i) => {
        const x = startX + (i / 6) * length
        const z = row.z + Math.sin(x * 0.19 + phase) * 0.76 + Math.sin(x * 0.061 + phase * 2) * 0.5
        const y = 0.08 + Math.sin(x * 0.23 + phase) * 0.025
        return new THREE.Vector3(x, y, z)
      })
      return {
        geometry: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.043, 5, false),
        color: row.color,
        opacity: 0.28 + (segment % 3) * 0.07,
      }
    }))
  }, [])

  return (
    <group>
      {waves.map((wave, i) => (
        <mesh key={`ocean-wave-${i}`} geometry={wave.geometry}>
          <meshBasicMaterial color={wave.color} transparent opacity={wave.opacity} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function blendSeaIntoSky(shader: Parameters<THREE.MeshStandardMaterial['onBeforeCompile']>[0]) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying float vSeaZ;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSeaZ = (modelMatrix * vec4(position, 1.0)).z;')
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vSeaZ;')
    .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= 1.0 - smoothstep(52.0, 94.0, -vSeaZ);')
}

function Ocean({ paints }: { paints: GroundPaints }) {
  const oceanGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(180, 180, 64, 80)
    const positions = geometry.attributes.position
    const colors: number[] = []
    const near = new THREE.Color('#48b5bb')
    const mid = new THREE.Color('#257f91')
    const far = new THREE.Color('#164d66')
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const t = THREE.MathUtils.clamp((y + 90) / 180, 0, 1)
      const color = t < 0.54
        ? near.clone().lerp(mid, t / 0.54)
        : mid.clone().lerp(far, (t - 0.54) / 0.46)
      const ripple = (
        Math.sin(x * 0.17 + y * 0.13)
        + Math.sin(x * 0.31 - y * 0.08 + 1.7) * 0.55
        + Math.sin(x * 0.073 - y * 0.22 + 2.8) * 0.38
      ) / 1.93
      const tone = ripple > 0 ? new THREE.Color('#69c9c4') : new THREE.Color('#124c63')
      color.lerp(tone, Math.abs(ripple) * 0.5)
      colors.push(color.r, color.g, color.b)
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geometry
  }, [])

  return (
    <>
      <SkyBackdrop />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -5]} receiveShadow renderOrder={-5}>
        <primitive object={oceanGeometry} attach="geometry" />
        <meshStandardMaterial vertexColors roughness={0.4} metalness={0.02}
          transparent onBeforeCompile={blendSeaIntoSky} />
      </mesh>
      <OceanShallows />
      <OceanWaveBands />
      <OceanGlints />
      <PaintedHorizon />
      <CoastalIslands grassMap={paints.grass} sandMap={paints.sand} />
      <SkyClouds />
    </>
  )
}

export function VillageWorld({ onOpen, onPlayerPosition }: { onOpen: (spot: PortfolioSpot) => void; onPlayerPosition: (x: number, z: number) => void }) {
  const { panelOpen } = useScenePreferences()
  const walkTo = (event: ThreeEvent<MouseEvent>) => {
    if (panelOpen || !event.object.userData.walkableTerrain) return
    event.stopPropagation()
    window.dispatchEvent(new CustomEvent('coastlight:walk-to', { detail: { x: event.point.x, z: event.point.z } }))
  }
  const paints = useMemo(() => ({ grass: createGroundPaintTexture('grass'), sand: createGroundPaintTexture('sand') }), [])
  const islandPaints = useMemo(() => ({
    grass: createIslandComposition(paints.grass, 'grass'),
    sand: createIslandComposition(paints.sand, 'sand'),
  }), [paints])
  useEffect(() => () => {
    paints.grass.dispose()
    paints.sand.dispose()
  }, [paints])
  useEffect(() => () => {
    islandPaints.grass.dispose()
    islandPaints.sand.dispose()
  }, [islandPaints])

  return (
    <group onClick={walkTo}>
      <Ocean paints={paints} />
      <IslandGround paints={islandPaints} />
      <MapFoliage />
      <BeachDetails />
      <MapEdgeFraming />
      <Clocktower onOpen={onOpen} />
      <VillageBuildings onOpen={onOpen} />
      <HeroCharacter onOpen={onOpen} onPlayerPosition={onPlayerPosition} />
    </group>
  )
}
