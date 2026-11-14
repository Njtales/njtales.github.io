import {useEffect,useMemo} from 'react'
import {useTexture} from '@react-three/drei'
import * as THREE from 'three'
import {portfolioSpots,type PortfolioSpot} from './portfolioData'
import {groundHeightAt} from './groundContours'
import {LandmarkSign,useLandmarkFeedback} from './LandmarkFeedback'
import {createContactShadowMask} from './SoftContactShadow'
import {createAlphaSpriteRaycast} from './paintedSpritePicking'

const CLOCK_ART='/assets/buildings/clocktower-painted-v1.png'
const HEIGHT=10.8,WIDTH=HEIGHT*2/3,ALPHA_CUTOFF=.55

/** The approved painted silhouette is the visible building. A hidden volume
 * supplies the existing Niro locator without rendering a second model. */
export function Clocktower({onOpen}:{onOpen:(spot:PortfolioSpot)=>void}){
  const spot=portfolioSpots.find(s=>s.id==='clocktower')!,feedback=useLandmarkFeedback(spot.id)
  const source=useTexture(CLOCK_ART)
  const resources=useMemo(()=>{
    const map=source.clone();map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true
    // A tiny pick mask excludes transparent corners and the open bell chamber.
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=192
    const context=canvas.getContext('2d')!;context.drawImage(source.image as HTMLImageElement,0,0,128,192)
    const rgba=context.getImageData(0,0,128,192).data,alpha=new Uint8Array(128*192)
    for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3]
    return{map,shadow:createContactShadowMask(),raycast:createAlphaSpriteRaycast(alpha,128,192,ALPHA_CUTOFF)}
  },[source])
  useEffect(()=>()=>{resources.map.dispose();resources.shadow.dispose()},[resources])
  const height=groundHeightAt(spot.position[0],spot.position[2])
  return <group name="Painted Clocktower" position={[spot.position[0],height,spot.position[2]]}
    onClick={event=>{event.stopPropagation();onOpen(spot)}} {...feedback.events}>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.018,0]} raycast={()=>{}}>
      <planeGeometry args={[5.1,2.5]}/>
      <meshBasicMaterial map={resources.shadow} transparent opacity={.20} color="#3b3523" depthWrite={false} polygonOffset polygonOffsetFactor={-1}/>
    </mesh>
    <sprite name="Approved painted clocktower artwork" scale={[WIDTH,HEIGHT,1]} center={[.5,.055]} raycast={resources.raycast} userData={{niroPaintedOccluder:true}}>
      <spriteMaterial map={resources.map} transparent alphaTest={ALPHA_CUTOFF} alphaToCoverage depthWrite toneMapped={false} fog={false}/>
    </sprite>
    <LandmarkSign spot={spot} position={[-1.15,2.4,2.65]} shown={feedback.showSign}/>
  </group>
}
