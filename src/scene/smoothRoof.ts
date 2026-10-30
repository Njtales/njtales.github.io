import * as THREE from 'three'

type Point = [number,number,number]

/** Closed, smoothly lit roof shell and a continuous front/back fascia. */
export function createSmoothRoof(path:[number,number][],depth:number) {
  const curve=new THREE.CatmullRomCurve3(path.map(([x,y])=>new THREE.Vector3(x,y,0)),false,'centripetal')
  const count=(path.length-1)*2
  const points=Array.from({length:count+1},(_,i)=>curve.getPoint(i/count))
  const normals=points.map((_,i)=>{const t=curve.getTangent(i/count);return new THREE.Vector3(-t.y,t.x,0).normalize()})
  const shell={p:[] as number[],n:[] as number[],indices:[] as number[]}
  const trim={p:[] as number[],n:[] as number[],indices:[] as number[]}
  const vertex=(data:typeof shell,p:Point,n:THREE.Vector3)=>{const index=data.p.length/3;data.p.push(...p);data.n.push(n.x,n.y,n.z);return index}
  const quad=(data:typeof shell,ps:Point[],normal:THREE.Vector3)=>{
    const start=data.p.length/3
    ps.forEach(p=>vertex(data,p,normal))
    const cross=new THREE.Vector3(...ps[1]).sub(new THREE.Vector3(...ps[0]))
      .cross(new THREE.Vector3(...ps[2]).sub(new THREE.Vector3(...ps[0])))
    data.indices.push(...(cross.dot(normal)>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]).map(i=>i+start))
  }
  for(const bottom of [false,true]){
    const start=shell.p.length/3
    points.forEach((p,i)=>{for(const z of [-depth/2,depth/2])vertex(shell,[p.x,p.y+(bottom?-.10:.028),z],
      bottom?normals[i].clone().negate():normals[i])})
    for(let i=0;i<count;i++){
      const a=start+i*2,b=a+2
      shell.indices.push(...(bottom?[a,b,a+1,a+1,b,b+1]:[a,a+1,b,a+1,b+1,b]))
    }
  }
  for(const side of [-1,1])for(let i=0;i<count;i++){
    const a=points[i],b=points[i+1],z=side*depth/2,normal=new THREE.Vector3(0,0,side)
    quad(shell,[[a.x,a.y+.028,z],[b.x,b.y+.028,z],[b.x,b.y-.10,z],[a.x,a.y-.10,z]],normal)
    const edge=z+side*.018
    quad(trim,[[a.x,a.y+.05,edge],[b.x,b.y+.05,edge],[b.x,b.y-.115,edge],[a.x,a.y-.115,edge]],normal)
  }
  for(const [i,side]of [[0,-1],[count,1]]){
    const p=points[i]
    quad(shell,[[p.x,p.y+.028,-depth/2],[p.x,p.y+.028,depth/2],[p.x,p.y-.10,depth/2],[p.x,p.y-.10,-depth/2]],new THREE.Vector3(side,0,0))
  }
  const geometry=(data:typeof shell)=>{
    const result=new THREE.BufferGeometry()
    result.setAttribute('position',new THREE.Float32BufferAttribute(data.p,3))
    result.setAttribute('normal',new THREE.Float32BufferAttribute(data.n,3))
    result.setIndex(data.indices);result.computeBoundingSphere();return result
  }
  return {surface:geometry(shell),fascia:geometry(trim)}
}
