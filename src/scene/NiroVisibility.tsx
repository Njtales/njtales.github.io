import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useScenePreferences } from './ScenePreferences'

/** Only intersections before the character can obscure him. */
export function sightlineBlocked(ray:THREE.Ray,distance:number,boxes:THREE.Box3[],hit:THREE.Vector3) {
  return boxes.some(box=>ray.intersectBox(box,hit)!==null&&hit.distanceToSquared(ray.origin)<(distance-.12)**2)
}

export function NiroVisibility({target}:{target:RefObject<THREE.Group|null>}) {
  const {camera,scene}=useThree(),{panelOpen}=useScenePreferences()
  const [hidden,setHidden]=useState(false)
  const lastHidden=useRef(false)
  const anchor=useRef<THREE.Group>(null),elapsed=useRef(0),blockedSamples=useRef(0)
  const boxes=useRef<THREE.Box3[]>([])
  const scratch=useMemo(()=>({ray:new THREE.Ray(),point:new THREE.Vector3(),hit:new THREE.Vector3(),matrix:new THREE.Matrix4(),local:new THREE.Matrix4()}),[])
  useLayoutEffect(()=>{
    scene.updateMatrixWorld(true);boxes.current=[]
    scene.traverse(object=>{
      if(!object.userData.niroOccluder||!(object instanceof THREE.Mesh))return
      object.geometry.computeBoundingBox()
      if(object instanceof THREE.InstancedMesh) {
        for(let i=0;i<object.count;i++) {
          object.getMatrixAt(i,scratch.local);scratch.matrix.multiplyMatrices(object.matrixWorld,scratch.local)
          boxes.current.push(object.geometry.boundingBox!.clone().applyMatrix4(scratch.matrix))
        }
      } else boxes.current.push(object.geometry.boundingBox!.clone().applyMatrix4(object.matrixWorld))
    })
  },[scene,scratch])
  useFrame((_,delta)=>{
    if(!target.current||panelOpen)return
    const position=target.current.position
    if(anchor.current)anchor.current.position.set(position.x,position.y+2.65,position.z)
    elapsed.current+=Math.min(delta,.05)
    if(elapsed.current<.20)return
    elapsed.current=0
    let obscured=true
    for(const height of [1.45,2.05]) {
      scratch.point.set(position.x,position.y+height,position.z)
      const distance=camera.position.distanceTo(scratch.point)
      scratch.ray.origin.copy(camera.position);scratch.ray.direction.subVectors(scratch.point,camera.position).normalize()
      if(!sightlineBlocked(scratch.ray,distance,boxes.current,scratch.hit)){obscured=false;break}
    }
    blockedSamples.current=obscured?blockedSamples.current+1:0
    const next=blockedSamples.current>=2
    if(next!==lastHidden.current){lastHidden.current=next;setHidden(next)}
  })
  return <group ref={anchor}>{hidden&&!panelOpen&&<Html center zIndexRange={[1,0]} style={{pointerEvents:'none'}}>
    <div className="niro-locator" role="img" aria-label="Niro is behind the scenery">Niro<span aria-hidden="true">⌄</span></div>
  </Html>}</group>
}
