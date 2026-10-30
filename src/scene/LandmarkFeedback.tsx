import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useScenePreferences } from './ScenePreferences'
import { sectionNames } from './portfolioUi'
import type { PortfolioSpot } from './portfolioData'

export function useLandmarkFeedback(id:string) {
  const {panelOpen}=useScenePreferences()
  const [hovered,setHovered]=useState(false)
  const [nearby,setNearby]=useState(()=>document.documentElement.dataset.nearbyLandmark===id)
  useEffect(()=>{
    const update=(event:Event)=>setNearby((event as CustomEvent<string|null>).detail===id)
    window.addEventListener('coastlight:nearby',update)
    return()=>window.removeEventListener('coastlight:nearby',update)
  },[id])
  useEffect(()=>{if(panelOpen)setHovered(false)},[panelOpen])
  useEffect(()=>{
    if(!hovered||panelOpen)return
    const previous=document.body.style.cursor;document.body.style.cursor='pointer'
    return()=>{document.body.style.cursor=previous}
  },[hovered,panelOpen])
  return {active:!panelOpen&&(hovered||nearby),showSign:!panelOpen&&hovered&&!nearby,
    events:{onPointerOver:(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();setHovered(true)},
      onPointerOut:()=>setHovered(false)}}
}

export function LandmarkSign({spot,position,shown}:{spot:PortfolioSpot;position:[number,number,number];shown:boolean}) {
  if(!shown)return null
  return <Html position={position} center distanceFactor={20} zIndexRange={[1,0]} style={{pointerEvents:'none'}}>
    <div className="landmark-sign"><span>{sectionNames[spot.id]}</span><strong>{spot.title}</strong><small>Click to explore</small></div>
  </Html>
}
