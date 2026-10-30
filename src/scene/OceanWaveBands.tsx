import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function createWaveBandGeometry() {
  const rows=[{z:-14,color:'#83d0ca'},{z:-20.5,color:'#287f91'},
    {z:-29,color:'#6abfc0'},{z:-39,color:'#327f8c'}]
  const parts=rows.flatMap((row,rowIndex)=>Array.from({length:5},(_,segment)=>{
    const phase=rowIndex*1.31+segment*2.17
    const startX=-42+segment*17.2+Math.sin(phase)*3.1
    const length=4.2+(.5+.5*Math.sin(phase*1.7))*7.8
    const points=Array.from({length:7},(_,i)=>{
      const x=startX+i/6*length
      return new THREE.Vector3(x,.08+Math.sin(x*.23+phase)*.025,
        row.z+Math.sin(x*.19+phase)*.76+Math.sin(x*.061+phase*2)*.5)
    })
    const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.043,5,false)
    const color=new THREE.Color(row.color),opacity=.28+(segment%3)*.07
    const colors=new Float32Array(geometry.attributes.position.count*4)
    for(let i=0;i<geometry.attributes.position.count;i++)colors.set([color.r,color.g,color.b,opacity],i*4)
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,4))
    return geometry
  }))
  const geometry=mergeGeometries(parts)!
  parts.forEach(part=>part.dispose());geometry.computeBoundingSphere()
  return geometry
}

export function OceanWaveBands() {
  const geometry=useMemo(createWaveBandGeometry,[])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  return <mesh name="Painted sea wave bands" geometry={geometry} raycast={()=>{}}>
    <meshBasicMaterial vertexColors transparent depthWrite={false} />
  </mesh>
}
