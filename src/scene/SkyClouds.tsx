import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useAmbientTime, useScenePreferences } from './ScenePreferences'

export const skyCloudBanks = [
  { position: [-32, 7.8, -31], scale: [1.28, 1.04, 1], phase: .3 },
  { position: [-13, 10.5, -43], scale: [1.12, 1.35, 1], phase: 1.5 },
  { position: [10, 8.8, -34], scale: [1.45, 1.10, 1], phase: 2.7 },
  { position: [33, 9.8, -38], scale: [1.20, 1.30, 1], phase: 4.2 },
  { position: [-49, 10.7, -57], scale: [1.60, 1.08, 1], phase: 5.3 },
  { position: [48, 12.1, -59], scale: [1.65, 1.45, 1], phase: .9 },
  { position: [2, 14.2, -62], scale: [1.85, 1.15, 1], phase: 3.4 },
] as const

export function createSkyCloudGeometry() {
  // Broad scalloped silhouettes, rising crowns, and a flatter shaded base.
  // All lobes become one reusable mesh, instead of separate translucent balls.
  const lobes = [
    [-3.8, -.22, .02, 1.7, .70, .72], [-2.4, .12, .05, 1.9, 1.12, .83],
    [-1.2, 1.0, -.18, 1.45, 1.42, .90], [.25, .65, 0, 1.9, 1.45, 1.0],
    [1.75, .12, .14, 1.8, 1.08, .82], [3.35, -.15, .06, 1.7, .70, .66],
    [-.9, -.43, .36, 2.8, .64, .70], [1.45, -.43, .34, 2.2, .60, .67],
  ]
  const white = new THREE.Color('#ffffff'), shade = new THREE.Color('#dbe6eb')
  const parts = lobes.map(([x, y, z, width, height, depth]) => {
    const geometry = new THREE.SphereGeometry(1, 12, 7)
    const p = geometry.attributes.position, normal = geometry.attributes.normal
    const colours = new Float32Array(p.count * 3), colour = new THREE.Color()
    for (let i = 0; i < p.count; i++) {
      const light = THREE.MathUtils.clamp(.60 + normal.getY(i) * .48 - normal.getX(i) * .10, 0, 1)
      colour.copy(shade).lerp(white, light)
      colours.set([colour.r, colour.g, colour.b], i * 3)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
    geometry.scale(width, height, depth); geometry.translate(x, y, z)
    return geometry
  })
  const merged = mergeGeometries(parts)!
  parts.forEach(part => part.dispose())
  merged.computeBoundingSphere()
  return merged
}

export function SkyClouds() {
  const { quality, reducedMotion, panelOpen } = useScenePreferences(), ambient = useAmbientTime()
  const count = quality === 'light' ? 5 : skyCloudBanks.length
  const mesh = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(createSkyCloudGeometry, [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: false }), [])
  const transform = useMemo(() => new THREE.Object3D(), [])
  const place = (time: number) => {
    if (!mesh.current) return
    for (let i = 0; i < count; i++) {
      const bank = skyCloudBanks[i]
      transform.position.set(bank.position[0] + Math.sin(time * .024 + bank.phase) * 1.6,
        bank.position[1] + Math.sin(time * .035 + bank.phase) * .12, bank.position[2])
      transform.scale.set(bank.scale[0], bank.scale[1], bank.scale[2])
      transform.rotation.y = Math.sin(bank.phase) * .12
      transform.updateMatrix(); mesh.current!.setMatrixAt(i, transform.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }
  useLayoutEffect(() => { place(ambient.current) }, [count])
  useFrame(() => { if (!reducedMotion && !panelOpen) place(ambient.current) })
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  return <instancedMesh ref={mesh} name="White cumulus cloud banks" args={[geometry, material, count]}
    frustumCulled={false} raycast={() => {}} dispose={null} />
}
