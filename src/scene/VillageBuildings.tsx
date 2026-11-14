import {useEffect,useLayoutEffect,useMemo,useRef} from 'react'
import {useThree} from '@react-three/fiber'
import {useTexture} from '@react-three/drei'
import * as THREE from 'three'
import {portfolioSpots,type PortfolioSpot} from './portfolioData'
import {groundHeightAt} from './groundContours'
import {buildingFootprints} from './buildingLayout'
import type {VillageBuildingId} from './villageBuildingGeometry'
import {ForgeEffects} from './ForgeEffects'
import {LandmarkSign,useLandmarkFeedback} from './LandmarkFeedback'
import {createContactShadowMask} from './SoftContactShadow'
import {createAlphaSpriteRaycast} from './paintedSpritePicking'
import {PAINTED_ATLAS,PAINTED_BASELINE,PAINTED_FORGE_ANCHORS,paintedBuildings,paintedBuildingSize} from './paintedVillageLayout'

const ALPHA_CUTOFF=.55
type PaintedView={id:VillageBuildingId;map:THREE.Texture;raycast:THREE.Sprite['raycast']}

function Landmark({view,shadow,onOpen}:{view:PaintedView;shadow:THREE.Texture;onOpen:(spot:PortfolioSpot)=>void}){
  const {id,map,raycast}=view,spot=portfolioSpots.find(s=>s.id===id)!,root=useRef<THREE.Group>(null)
  const feedback=useLandmarkFeedback(id),scene=useThree(state=>state.scene)
  const size=paintedBuildingSize(id),spec=paintedBuildings[id]
  const footprint=buildingFootprints.find(b=>b.id===id)!,entrance=footprint.entrance
  useLayoutEffect(()=>{
    if(!root.current)return
    scene.updateMatrixWorld(true)
    const terrain:THREE.Object3D[]=[]
    scene.traverse(object=>{if(object.userData.walkableTerrain)terrain.push(object)})
    const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0)
    let height=groundHeightAt(spot.position[0],spot.position[2])
    for(const [minX,maxX,minZ,maxZ]of footprint.rectangles)for(const [x,z]of [[minX,minZ],[maxX,minZ],[minX,maxZ],[maxX,maxZ],[(minX+maxX)/2,(minZ+maxZ)/2]]){
      ray.set(new THREE.Vector3(spot.position[0]+x,12,spot.position[2]+z),down)
      height=Math.max(height,ray.intersectObjects(terrain,false)[0]?.point.y??height)
    }
    root.current.position.y=height-.015
  },[scene,spot,footprint])
  return <group ref={root} name={`Painted ${spot.title}`} position={[spot.position[0],groundHeightAt(spot.position[0],spot.position[2]),spot.position[2]]}
    onClick={event=>{event.stopPropagation();onOpen(spot)}} {...feedback.events}>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]} raycast={()=>{}}>
      <planeGeometry args={[spec.shadowWidth,spec.shadowDepth]}/>
      <meshBasicMaterial map={shadow} transparent opacity={.17} color="#3b3523" depthWrite={false} polygonOffset polygonOffsetFactor={-1}/>
    </mesh>
    <sprite name={`${spot.title} painted artwork`} scale={[size.width,size.height,1]} center={[.5,PAINTED_BASELINE]}
      raycast={raycast} userData={{niroPaintedOccluder:true}}>
      <spriteMaterial map={map} transparent alphaTest={ALPHA_CUTOFF} alphaToCoverage depthWrite toneMapped={false} fog={false}/>
    </sprite>
    {id==='cloud-forge'&&<ForgeEffects anchors={PAINTED_FORGE_ANCHORS}/>}
    <LandmarkSign spot={spot} position={[entrance[0],2.4,entrance[1]]} shown={feedback.showSign}/>
  </group>
}

export function VillageBuildings({onOpen}:{onOpen:(spot:PortfolioSpot)=>void}){
  const source=useTexture(PAINTED_ATLAS.url)
  const resources=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128
    const context=canvas.getContext('2d')!
    const views=(Object.keys(paintedBuildings) as VillageBuildingId[]).map(id=>{
      const [x,y,width,height]=paintedBuildings[id].crop,map=source.clone()
      map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4
      map.repeat.set(width/PAINTED_ATLAS.width,height/PAINTED_ATLAS.height)
      map.offset.set(x/PAINTED_ATLAS.width,1-(y+height)/PAINTED_ATLAS.height);map.needsUpdate=true
      context.clearRect(0,0,128,128);context.drawImage(source.image as HTMLImageElement,x,y,width,height,0,0,128,128)
      const rgba=context.getImageData(0,0,128,128).data,alpha=new Uint8Array(128*128)
      for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3]
      return{id,map,raycast:createAlphaSpriteRaycast(alpha,128,128,ALPHA_CUTOFF)}
    })
    return{views,shadow:createContactShadowMask()}
  },[source])
  useEffect(()=>()=>{resources.views.forEach(view=>view.map.dispose());resources.shadow.dispose()},[resources])
  return <group name="Painted village landmarks">{resources.views.map(view=><Landmark key={view.id} view={view} shadow={resources.shadow} onOpen={onOpen}/>)}</group>
}
