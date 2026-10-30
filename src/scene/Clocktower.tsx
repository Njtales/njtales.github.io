import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { makeClocktowerGeometry } from './clocktowerGeometry'
import { portfolioSpots, type PortfolioSpot } from './portfolioData'
import { groundHeightAt } from './groundContours'
import { LandmarkSign, useLandmarkFeedback } from './LandmarkFeedback'

function makeDial() {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512
  const ctx=canvas.getContext('2d')!
  const wash=ctx.createRadialGradient(215,190,20,256,256,260)
  wash.addColorStop(0,'#f2e3bc');wash.addColorStop(.72,'#e5d2a6');wash.addColorStop(1,'#b69c70')
  ctx.fillStyle=wash;ctx.fillRect(0,0,512,512)
  // Sparse painted pigment, legible markings and hands, baked once at startup.
  for(let i=0;i<130;i++) {
    const x=(i*173.17)%512,y=(i*97.31)%512
    ctx.fillStyle=i%2?'rgba(125,98,60,.035)':'rgba(255,246,213,.11)'
    ctx.beginPath();ctx.ellipse(x,y,5+i%17,3+i%7,i*.7,0,Math.PI*2);ctx.fill()
  }
  ctx.strokeStyle='#9d8359';ctx.lineWidth=2
  for(const r of [231,178]) {ctx.beginPath();ctx.arc(256,256,r,0,Math.PI*2);ctx.stroke()}
  const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI']
  ctx.fillStyle='#493d31';ctx.font='bold 30px Georgia';ctx.textAlign='center';ctx.textBaseline='middle'
  for(let i=0;i<60;i++) {
    const a=i/60*Math.PI*2
    ctx.save();ctx.translate(256,256);ctx.rotate(a)
    ctx.fillRect(-1.2,-226,2.4,i%5===0?12:5);ctx.restore()
    if(i%5===0)ctx.fillText(roman[i/5],256+Math.sin(a)*202,256-Math.cos(a)*202)
  }
  function hand(angle:number,length:number,width:number) {
    ctx.save();ctx.translate(256,256);ctx.rotate(angle)
    ctx.fillStyle='#37484a';ctx.strokeStyle='#283538';ctx.lineWidth=2
    ctx.beginPath();ctx.moveTo(0,-length);ctx.lineTo(width,-length+23);ctx.lineTo(width*.38,-26)
    ctx.lineTo(width*.7,27);ctx.lineTo(-width*.7,27);ctx.lineTo(-width*.38,-26);ctx.lineTo(-width,-length+23)
    ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()
  }
  hand(Math.PI/3,165,10);hand(-Math.PI/3,122,12)
  ctx.fillStyle='#bd9450';ctx.beginPath();ctx.arc(256,256,13,0,Math.PI*2);ctx.fill()
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4
  return map
}

export function Clocktower({onOpen}:{onOpen:(spot:PortfolioSpot)=>void}) {
  const spot=portfolioSpots.find(s=>s.id==='clocktower')!
  const feedback=useLandmarkFeedback(spot.id)
  const model=useMemo(makeClocktowerGeometry,[])
  const dial=useMemo(makeDial,[])
  useEffect(()=>()=>{Object.values(model).forEach(g=>g.dispose());dial.dispose()},[model,dial])
  return <group name="Clocktower B" position={[spot.position[0],groundHeightAt(spot.position[0],spot.position[2]),spot.position[2]]}
    onClick={event=>{event.stopPropagation();onOpen(spot)}} {...feedback.events}>
    <mesh geometry={model.body} userData={{niroOccluder:true}} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={.95} side={THREE.DoubleSide} emissive="#b69b51" emissiveIntensity={feedback.active?.13:0}/>
    </mesh>
    <LandmarkSign spot={spot} position={[0,2.4,2.7]} shown={feedback.showSign}/>
    <mesh geometry={model.panes}>
      <meshStandardMaterial vertexColors emissive="#deb66c" emissiveIntensity={.22} roughness={.8}/>
    </mesh>
    <mesh position={[-.16,5.22,1.345]}>
      <circleGeometry args={[.975,48]}/>
      <meshStandardMaterial map={dial} roughness={1}/>
    </mesh>
  </group>
}
