import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useAmbientTime, useScenePreferences } from './ScenePreferences'

const glints = [
  [-36,-18,1.5],[-31,-25,1.5],[-24,-20,2.2],[-15,-29,1.2],[-7,-23,1.8],[2,-32,2.4],
  [10,-25,1.4],[18,-30,2],[27,-22,1.5],[-35,-34,2.3],[-2,-18,1.1],[22,-17,1.3],
  [35,-31,1.8],[-29,-42,1.8],[-20,-37,1.3],[-12,-45,2],[-3,-39,1.4],[7,-44,2.1],
  [16,-38,1.4],[26,-46,1.9],[36,-40,1.5],[-40,-28,1.2],[-26,-49,1.6],[-9,-34,1.1],
  [4,-19,1.3],[19,-48,1.4],[31,-36,1.2],[42,-24,1.6],
]
const shallows: [number,number,number,number,number,string][] = [
  [-34,-16,2.5,.38,-.14,'#70c8c4'],[-25,-21,3.4,.42,.08,'#2c8996'],
  [-15,-18,2.1,.32,-.1,'#83d4cd'],[-5,-23,3.2,.44,.13,'#388f9a'],
  [8,-17,2.8,.36,-.08,'#75cbc5'],[19,-22,3.6,.45,.1,'#2d8290'],
  [31,-18,2.3,.34,-.12,'#80d1ca'],[-39,-27,3.5,.46,.1,'#287b8a'],
  [-29,-31,2.6,.36,-.12,'#7acbc5'],[-18,-28,3.8,.48,.1,'#347f8e'],
  [-7,-34,2.6,.4,-.12,'#80d0c9'],[5,-29,3.3,.42,.08,'#2b7a89'],
  [17,-34,3.8,.46,-.1,'#6fc4c1'],[29,-29,2.5,.38,.12,'#337f8e'],
  [39,-34,3.1,.4,-.08,'#77cbc5'],[-34,-41,2.8,.4,.13,'#327e8b'],
  [-22,-44,3.6,.46,-.1,'#6dbdc0'],[-9,-43,2.5,.36,.12,'#2b7485'],
  [7,-47,3.3,.42,-.08,'#65b4ba'],[24,-43,3.7,.48,.1,'#2b7888'],
  [39,-46,2.5,.36,-.12,'#63b6bb'],
]

/** Preserve the painted placements and colours, with one draw per layer. */
export function createOceanDetailLayer(isGlint: boolean) {
  const transform = new THREE.Object3D()
  const parts = (isGlint ? glints : shallows).map((entry, i) => {
    const [x,z,width,height,rotation,colour] = entry
    const geometry = isGlint ? new THREE.PlaneGeometry(width,.17+(i%3)*.07) : new THREE.CircleGeometry(1,11)
    transform.position.set(x,isGlint ? .08 : .075,z)
    transform.rotation.set(-Math.PI/2,0,isGlint ? Math.sin(i*4.1)*.07 : rotation!)
    transform.scale.set(isGlint ? 1 : width*1.25,isGlint ? 1 : height!*2.4,1)
    transform.updateMatrix(); geometry.applyMatrix4(transform.matrix)
    const count = geometry.attributes.position.count
    const color = new THREE.Color(isGlint ? (i%3 ? '#9de0d5' : '#e1f0cf') : colour!)
    const colors = new Float32Array(count*3), phases = new Float32Array(count)
    for(let vertex=0;vertex<count;vertex++) { colors.set([color.r,color.g,color.b],vertex*3); phases[vertex]=i }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
    geometry.setAttribute('aWaterPhase',new THREE.BufferAttribute(phases,1))
    return geometry
  })
  const geometry = mergeGeometries(parts)!
  parts.forEach(part=>part.dispose())
  geometry.computeBoundingSphere()
  // Shader displacement extends the original bounds by at most .24 units.
  if(geometry.boundingSphere) geometry.boundingSphere.radius += .24
  const time = { value: 0 }
  const material = new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,
    side:THREE.DoubleSide,forceSinglePass:true})
  material.customProgramCacheKey = () => isGlint ? 'coastlight-glints-v1' : 'coastlight-shallows-v1'
  material.onBeforeCompile = shader => {
    shader.uniforms.uWaterTime=time
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nuniform float uWaterTime;\nattribute float aWaterPhase;\nvarying float vWaterAlpha;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
        transformed.x += sin(uWaterTime * ${isGlint ? '.12' : '.045'} + aWaterPhase * ${isGlint ? '1.4' : '1.6'}) * ${isGlint ? '.24' : '.22'};
        vWaterAlpha = ${isGlint ? '.1 + (.5 + .5 * sin(uWaterTime * .7 + aWaterPhase * 1.7)) * .16' : '.31'};`)
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>','#include <common>\nvarying float vWaterAlpha;')
      .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= vWaterAlpha;')
  }
  return { geometry,material,time,count:parts.length }
}

export function OceanDetails() {
  const {quality}=useScenePreferences(), ambient=useAmbientTime()
  const layers=useMemo(()=>[createOceanDetailLayer(false),createOceanDetailLayer(true)],[])
  useFrame(()=>{for(const layer of layers)layer.time.value=ambient.current})
  useEffect(()=>()=>{for(const layer of layers){layer.geometry.dispose();layer.material.dispose()}},[layers])
  if(quality==='light')return null
  return <group>{layers.map((layer,i)=><mesh key={i} name={i ? 'Batched sea glints' : 'Batched sea shallows'}
    geometry={layer.geometry} material={layer.material} dispose={null} raycast={()=>{}} />)}</group>
}
