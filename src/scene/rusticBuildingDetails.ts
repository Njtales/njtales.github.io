import * as THREE from 'three'
import {BuildingGeometryKit as Kit,villagePalette as P,type Point3} from './buildingGeometryKit'

export type RoofPath=[number,number][]

/** A wall profile meets the same sampled curve used by the closed roof shell. */
export function house(k:Kit,width:number,depth:number,roof:RoofPath,front:number,color:string=P.plaster) {
  const curve=new THREE.CatmullRomCurve3(roof.map(([x,y])=>new THREE.Vector3(x,y,0)),false,'centripetal')
  const count=(roof.length-1)*2,points=Array.from({length:count+1},(_,i)=>curve.getPoint(i/count))
  const height=(x:number)=>{
    for(let i=0;i<count;i++)if(points[i].x<=x&&points[i+1].x>=x)
      return THREE.MathUtils.lerp(points[i].y,points[i+1].y,(x-points[i].x)/(points[i+1].x-points[i].x))-.10
    return points[0].y-.10
  }
  const top:[number,number][]=[[-width/2,height(-width/2)],
    ...points.filter(p=>p.x>-width/2&&p.x<width/2).map(p=>[p.x,p.y-.10] as [number,number]),[width/2,height(width/2)]]
  k.profile([[-width/2,.30],[width/2,.30],...top.reverse()],depth,[0,0,front-depth],color)
  return height
}

export function footing(k:Kit,width:number,depth:number) {
  k.box([0,-.15,0],[width-.15,.72,depth-.15],P.stoneShade)
  for(const side of[-1,1])for(let i=0;i<3;i++){
    const x=-width*.335+i*width*.335
    k.stoneBlock([x,.23+(i%2)*.035,side*(depth/2-.12)],
      [width*.335,.53+(i%3)*.08,.42+(i%2)*.08],i%2?P.stone:P.stoneShade,[.03*side,.025*i,(i%2?1:-1)*.06])
  }
  for(const side of[-1,1])
    k.stoneBlock([side*(width/2-.11),.28,0],[.43,.59,depth*.70],P.stone,[0,.03,side*.05])
}

export function frame(k:Kit,width:number,front:number,eave:number,peak:Point3,back?:number) {
  for(const side of[-1,1]){
    const x=side*(width/2-.10)
    k.beam([x,.32,front+.075],[x,eave,front+.075],.25)
    k.beam([x,eave,front+.075],[peak[0],peak[1]-.14,front+.075],.22)
    if(back!==undefined){
      k.beam([x,.32,back-.04],[x,eave,back-.04],.16)
      k.beam([x,eave,back-.04],[peak[0],peak[1]-.14,back-.04],.14)
    }
  }
  k.beam([-width/2,eave,front+.075],[width/2,eave,front+.075],.27)
  if(back!==undefined){
    k.beam([-width/2,eave,back-.04],[width/2,eave,back-.04],.18)
    k.beam([width/2+.015,.6,back+.20],[width/2+.015,eave-.2,front-.20],.14)
  }
}

export function wallWear(k:Kit,width:number,front:number,height=3) {
  for(let row=0;row<4;row++)for(let column=0;column<3;column++){
    const index=row*3+column,x=-width*.34+column*width*.33+(row%2?width*.045:-width*.015),y=.5+row*(height-.7)/4
    const w=width*(.10+(index%3)*.025),h=.20+(index%3)*.075
    k.quad([[x-w,y,front+.012],[x+w,y+.035,front+.012],
      [x+w*.7,y+h,front+.012],[x-w*.8,y+h*.8,front+.012]],index%3?'#c8ab7b':'#a98c61')
  }
}

export function hangingSign(k:Kit,p:Point3,symbol:'cloud'|'book'|'brush') {
  const [x,y,z]=p,w=.61,h=.52
  k.beam([x-.47,y+.33,z-.10],[x+.45,y+.33,z-.10],.10)
  for(const dx of[-.20,.20])k.beam([x+dx,y+.32,z-.10],[x+dx,y+.12,z],.035,P.ink)
  k.box([x,y-.15,z],[w+.14,h+.13,.10],P.wood)
  k.box([x,y-.15,z+.057],[w,h,.025],P.teal)
  const f=z+.079
  if(symbol==='cloud'){
    for(const [dx,dy,r]of [[-.12,-.16,.10],[0,-.10,.14],[.14,-.17,.09]])
      k.add(new THREE.CircleGeometry(r,12),P.light,[x+dx,y+dy,f])
    k.box([x+.01,y-.20,f],[.29,.10,.006],P.light)
  }else if(symbol==='book'){
    k.quad([[x-.20,y+.02,f],[x-.025,y-.02,f],[x-.025,y-.29,f],[x-.20,y-.25,f]],P.light)
    k.quad([[x+.025,y-.02,f],[x+.20,y+.02,f],[x+.20,y-.25,f],[x+.025,y-.29,f]],'#e9d7a8')
  }else{
    k.beam([x-.13,y-.31,f],[x+.10,y-.06,f],.065,P.light)
    k.box([x+.10,y-.05,f],[.14,.14,.012],P.brass,[0,0,-.65])
    k.box([x+.16,y+.02,f],[.16,.13,.012],P.light,[0,0,-.65])
  }
}

export function chimney(k:Kit,x:number,z:number,bottom:number,top:number) {
  k.box([x,(bottom+top)/2,z],[.49,top-bottom,.52],P.stoneShade)
  for(let i=0;i<3;i++)k.stoneBlock([x+(i%2?.07:-.05),bottom+.2+i*(top-bottom)/3,z+.16],[.51,.28,.32],P.stone,[0,0,i%2?.04:-.04])
  k.stoneBlock([x,top-.03,z],[.72,.22,.72],P.stone,[0,.03,.025])
  k.box([x,top+.055,z],[.32,.012,.34],P.ink)
}

export function furnaceArch(k:Kit,x:number,y:number,z:number,width:number,height:number){
  const r=width/2+.07,outer=r+.27,cy=y+height-width/2
  for(let i=0;i<7;i++){
    const a=i*Math.PI/7+.022,b=(i+1)*Math.PI/7-.022
    k.profile([[Math.cos(a)*r,Math.sin(a)*r],[Math.cos(b)*r,Math.sin(b)*r],
      [Math.cos(b)*outer,Math.sin(b)*outer],[Math.cos(a)*outer,Math.sin(a)*outer]],.25,[x,cy,z],i%3?P.stone:P.stoneShade)
  }
  for(const side of[-1,1])for(let i=0;i<3;i++)
    k.stoneBlock([x+side*(r+.13),y+.12+i*.29,z+.09],[.32,.31,.38],i%2?P.stone:P.stoneShade,[0,0,side*(i%2?.04:-.04)])
}

export function telescope(k:Kit,from:Point3,to:Point3) {
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),axis=b.clone().sub(a)
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.clone().normalize())
  const tube=new THREE.CylinderGeometry(.14,.19,axis.length(),10);tube.applyQuaternion(q)
  k.add(tube,P.brass,a.clone().add(b).multiplyScalar(.5).toArray() as Point3)
  for(const t of[.12,1]){
    const rim=new THREE.CylinderGeometry(.205,.205,.10,10);rim.applyQuaternion(q)
    k.add(rim,P.wood,a.clone().lerp(b,t).toArray() as Point3)
  }
  const lens=new THREE.CircleGeometry(.15,12)
  lens.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis.clone().normalize()))
  k.add(lens,'#72a8a0',b.clone().addScaledVector(axis.normalize(),.06).toArray() as Point3,[0,0,0],true)
}
