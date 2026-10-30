import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { foliagePlants, type FoliagePlant } from './foliageLayout'
import { groundHeightAt } from './groundContours'
import { createPalmGeometry, createShrubGeometry, createLeafyTreeGeometry, createThicketGeometry } from './FoliagePatch'

function PlantBatch({ plants, geometry, material }: {
  plants: FoliagePlant[]; geometry: THREE.BufferGeometry; material: THREE.Material
}) {
  const batch = useRef<THREE.InstancedMesh>(null)
  const scene = useThree((state) => state.scene)
  useLayoutEffect(() => {
    if (!batch.current) return
    scene.updateMatrixWorld(true)
    const terrain: THREE.Object3D[] = []
    scene.traverse((object) => { if (object.userData.walkableTerrain) terrain.push(object) })
    const ray = new THREE.Raycaster()
    const down = new THREE.Vector3(0, -1, 0)
    const matrix = new THREE.Object3D()
    const sampleHeight = (x: number, z: number) => {
      ray.set(new THREE.Vector3(x, 12, z), down)
      return Math.max(groundHeightAt(x, z), ray.intersectObjects(terrain, true)[0]?.point.y ?? 0)
    }
    plants.forEach((plant, index) => {
      let height = sampleHeight(plant.x, plant.z)
      if (plant.kind !== 'palm' && plant.kind !== 'leafy-tree') {
        // Seat low plants slightly into a slope rather than balancing on its
        // highest point. Their buried outer skirt closes the grass contact.
        const reach = plant.kind === 'thicket' ? 0.7 : 0.4
        for (const [dx, dz] of [[reach, 0], [-reach, 0], [0, reach], [0, -reach]]) {
          height = Math.min(height, sampleHeight(plant.x + dx * plant.scale, plant.z + dz * plant.scale))
        }
      }
      matrix.position.set(plant.x, height - 0.012, plant.z)
      matrix.rotation.set(0, plant.rotation, 0)
      const heightScale = plant.kind === 'palm' ? 0.85 : 1
      matrix.scale.set(plant.scale, plant.scale * (0.96 + plant.variant * 0.045) * heightScale, plant.scale)
      matrix.updateMatrix()
      batch.current!.setMatrixAt(index, matrix.matrix)
    })
    batch.current.instanceMatrix.needsUpdate = true
    batch.current.computeBoundingSphere()
    batch.current.computeBoundingBox()
  }, [scene, plants])

  return <instancedMesh ref={batch} args={[geometry, material, plants.length]}
    userData={{niroOccluder:plants[0]?.kind!=='palm'&&plants[0]?.kind!=='flowers'}} castShadow dispose={null} />
}

export function MapFoliage() {
  const batches = useMemo(() => {
    const result: { plants: FoliagePlant[]; geometry: THREE.BufferGeometry; key: string }[] = []
    for (const kind of ['palm', 'leafy-tree', 'thicket', 'shrub', 'flowers'] as const) {
      const variants = kind === 'leafy-tree' ? 2 : kind === 'thicket' || kind === 'flowers' ? 1 : 3
      for (let variant = 0; variant < variants; variant++) {
        const plants = foliagePlants.filter((plant) => plant.kind === kind && plant.variant % variants === variant)
        if (!plants.length) continue
        const geometry = kind === 'palm' ? createPalmGeometry(variant)
          : kind === 'leafy-tree' ? createLeafyTreeGeometry(variant)
          : kind === 'thicket' ? createThicketGeometry(variant)
          : createShrubGeometry(variant, kind === 'flowers')
        result.push({ plants, key: `${kind}-${variant}`, geometry })
      }
    }
    return result
  }, [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: true, toneMapped: false, side: THREE.DoubleSide,
  }), [])
  useEffect(() => () => {
    batches.forEach((batch) => batch.geometry.dispose())
    material.dispose()
  }, [batches, material])

  return <group>{batches.map(({ key, plants, geometry }) => (
    <PlantBatch key={key} plants={plants} geometry={geometry} material={material} />
  ))}</group>
}
