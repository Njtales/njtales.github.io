import { useEffect,useLayoutEffect,useMemo,useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { portfolioSpots,type PortfolioSpot } from './portfolioData'
import { groundHeightAt } from './groundContours'
import { buildingFootprints } from './buildingLayout'
import { makeVillageBuilding,type VillageBuildingId } from './villageBuildingGeometry'
import { ForgeEffects } from './ForgeEffects'

function Landmark({id,model,materials,onOpen}:{id:VillageBuildingId;model:ReturnType<typeof makeVillageBuilding>;
  materials:{body:THREE.Material;panes:THREE.Material};onOpen:(spot:PortfolioSpot)=>void}){
  const spot=portfolioSpots.find(spot=>spot.id===id)!,root=useRef<THREE.Group>(null)
  const scene=useThree(state=>state.scene)
  useLayoutEffect(()=>{
    if(!root.current)return
    scene.updateMatrixWorld(true)
    const terrain:THREE.Object3D[]=[]
    scene.traverse(object=>{if(object.userData.walkableTerrain)terrain.push(object)})
    const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),footprint=buildingFootprints.find(b=>b.id===id)!
    let height=groundHeightAt(spot.position[0],spot.position[2])
    for(const [minX,maxX,minZ,maxZ]of footprint.rectangles)for(const [x,z]of [[minX,minZ],[maxX,minZ],[minX,maxZ],[maxX,maxZ],[(minX+maxX)/2,(minZ+maxZ)/2]]){
      ray.set(new THREE.Vector3(spot.position[0]+x,12,spot.position[2]+z),down)
      height=Math.max(height,ray.intersectObjects(terrain,false)[0]?.point.y??height)
    }
    // Deep plinths bury into the rise; the main masonry never floats over it.
    root.current.position.y=height-.08
  },[scene,id,spot])
  return <group ref={root} name={spot.title} position={[spot.position[0],groundHeightAt(spot.position[0],spot.position[2])-.08,spot.position[2]]}
    onClick={event=>{event.stopPropagation();onOpen(spot)}} dispose={null}>
    <mesh geometry={model.body} material={materials.body} castShadow receiveShadow/>
    {model.panes&&<mesh geometry={model.panes} material={materials.panes}/>}
    {id==='cloud-forge'&&<ForgeEffects/>}
  </group>
}

export function VillageBuildings({onOpen}:{onOpen:(spot:PortfolioSpot)=>void}){
  const models=useMemo(()=>{
    const ids:VillageBuildingId[]=['cloud-forge','data-tower','learning-lab','hobbies-hut','signal-station','about-cottage']
    return ids.map(id=>({id,model:makeVillageBuilding(id)}))
  },[])
  const materials=useMemo(()=>({body:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide}),
    panes:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false,side:THREE.DoubleSide})}),[])
  useEffect(()=>()=>{models.forEach(({model})=>{model.body.dispose();model.panes?.dispose()});Object.values(materials).forEach(m=>m.dispose())},[models,materials])
  return <group>{models.map(({id,model})=><Landmark key={id} id={id} model={model} materials={materials} onOpen={onOpen}/>)}</group>
}
