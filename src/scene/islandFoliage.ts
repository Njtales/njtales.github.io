import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

function paint(g:THREE.BufferGeometry,color:string,p:THREE.Vector3,scale:THREE.Vector3){
  const tone=new THREE.Color(color),colors=new Float32Array(g.attributes.position.count*3)
  for(let i=0;i<g.attributes.position.count;i++){
    const shade=.75+Math.max(0,g.attributes.normal.getY(i))*.25
    colors.set([tone.r*shade,tone.g*shade,tone.b*shade],i*3)
  }
  if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i))
  g.deleteAttribute('uv');g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.scale(scale.x,scale.y,scale.z);g.translate(p.x,p.y,p.z)
  return g
}
function tree(palm:boolean){
  const parts:THREE.BufferGeometry[]=[]
  const trunk=new THREE.CylinderGeometry(palm?.065:.055,palm?.11:.085,palm?1.5:.85,6,3)
  const tp=trunk.attributes.position
  for(let i=0;i<tp.count;i++)tp.setX(i,tp.getX(i)+Math.max(0,tp.getY(i))**2*.14)
  trunk.computeVertexNormals();parts.push(paint(trunk,palm?'#b08c5c':'#9b8049',new THREE.Vector3(0,palm?.74:.41,0),new THREE.Vector3(1,1,1)))
  if(palm){
    for(let leaf=0;leaf<7;leaf++){
      const a=leaf/7*Math.PI*2+Math.sin(leaf*2.3)*.19,dx=Math.cos(a),dz=Math.sin(a)
      for(const side of [-1,1]){
        const points:number[]=[],colors:number[]=[],indices:number[]=[]
        for(let step=0;step<=3;step++){
          const t=step/3,len=(1.05+Math.sin(leaf*1.73)*.10)*t,w=Math.sin(t*Math.PI)*.23*side,
            y=1.5+Math.sin(t*Math.PI)*.35-t*t*(.32+leaf%3*.055)
          const colour=new THREE.Color(side<0?'#305a3d':'#a8bc60')
          points.push(.10+dx*len,y+.035,dz*len,.10+dx*len-dz*w,y-Math.abs(w)*.18,dz*len+dx*w)
          for(let j=0;j<2;j++)colors.push(colour.r,colour.g,colour.b)
          if(step){const i=(step-1)*2;indices.push(i,i+1,i+2,i+1,i+3,i+2)}
        }
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();parts.push(g)
      }
    }
  }else{
    for(const[cx,cy,cz,sx,sy,sz]of [[-.25,.96,0,.58,.47,.53],[.30,1.13,-.05,.52,.65,.49]]){
      const g=new THREE.SphereGeometry(1,12,6),p=g.attributes.position,colors=new Float32Array(p.count*3)
      const dark=new THREE.Color('#244f3b'),sun=new THREE.Color('#acc853')
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x)
        const r=1+Math.sin(a*5+y*3)*.16+Math.cos(a*3-y*4)*.10
        p.setXYZ(i,cx+x*r*sx,cy+y*sy+Math.sin(a*3)*.07*(1-y*y),cz+z*r*sz)
        const c=dark.clone().lerp(sun,THREE.MathUtils.clamp(.32+y*.48+(-x+z)*.13+cx*.12,0,1))
        colors.set([c.r,c.g,c.b],i*3)
      }
      g.deleteAttribute('uv');g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals();parts.push(g)
    }
  }
  const merged=mergeGeometries(parts,false)!
  parts.forEach(g=>g.dispose());return merged
}

/** Low-detail distant silhouettes; stable random groups with uniformly scaled crowns. */
export function makeIslandFoliage(grass:THREE.BufferGeometry,variant:number,placement:{scale:number;stretch:number}){
  let seed=317+variant*677
  const random=()=>{seed=Math.imul(seed,1664525)+1013904223|0;return(seed>>>0)/4294967296}
  const count=Math.max(1,Math.min(4,Math.round(placement.scale*Math.sqrt(placement.stretch)*2.6)))
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),surface=new THREE.Mesh(grass,material)
  surface.updateMatrixWorld(true)
  const ray=new THREE.Raycaster(),parts:THREE.BufferGeometry[]=[],plants:{x:number;y:number;z:number;scale:number;kind:string}[]=[]
  const templates=[tree(true),tree(false)]
  for(let attempts=0;attempts<100&&plants.length<count;attempts++){
    const x=(random()-.5)*3.8,z=(random()-.5)*1.15
    if((x/2.4)**2+(z/.95)**2>.62||plants.some(p=>Math.hypot(p.x-x,p.z-z)<.95))continue
    ray.set(new THREE.Vector3(x,5,z),new THREE.Vector3(0,-1,0))
    const hit=ray.intersectObject(surface,false)[0];if(!hit)continue
    const palm=(plants.length+variant)%3!==1,s=.63+random()*.22,angle=random()*Math.PI*2
    const g=templates[palm?0:1].clone()
    g.rotateY(angle)
    // Undo the island's horizontal stretch; parent scale then gives a uniform tree.
    g.scale(s/placement.stretch,s*placement.scale,s);g.translate(x,hit.point.y-.015,z);parts.push(g)
    plants.push({x,y:hit.point.y,z,scale:s*placement.scale,kind:palm?'palm':'leafy'})
  }
  templates.forEach(g=>g.dispose());material.dispose()
  const geometry=mergeGeometries(parts,false)!
  parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere()
  return{geometry,plants}
}
