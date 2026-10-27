import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Point3=[number,number,number]
export const villagePalette={plaster:'#dfc99b',light:'#eddbb6',stone:'#b9aa88',stoneShade:'#8d8d73',
  wood:'#795033',grain:'#a77b49',ink:'#483b2d',roof:'#b65336',tile:'#d47346',tileLight:'#df8a53',
  teal:'#397c7c',tealLight:'#56958f',tealDark:'#285658',brass:'#bd9450',gold:'#d3ad60',glass:'#83bbb4'}
const P=villagePalette

/** Broad painted forms merged once; no individual trim objects in the scene graph. */
export class BuildingGeometryKit {
  private solid:THREE.BufferGeometry[]=[]
  private light:THREE.BufferGeometry[]=[]
  add(g:THREE.BufferGeometry,color:string,p:Point3=[0,0,0],r:Point3=[0,0,0],glow=false,scale:Point3=[1,1,1]) {
    const pigment=new THREE.Color(color),colors=new Float32Array(g.attributes.position.count*3)
    for(let i=0;i<g.attributes.position.count;i++){
      const light=glow?1:.90+Math.max(0,g.attributes.normal.getY(i))*.10
      colors.set([pigment.r*light,pigment.g*light,pigment.b*light],i*3)
    }
    if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i))
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.deleteAttribute('uv')
    g.scale(...scale);g.rotateX(r[0]);g.rotateY(r[1]);g.rotateZ(r[2]);g.translate(...p)
    ;(glow?this.light:this.solid).push(g)
  }
  box(p:Point3,size:Point3,color:string=P.wood,r:Point3=[0,0,0]){this.add(new THREE.BoxGeometry(...size),color,p,r)}
  cylinder(p:Point3,top:number,bottom:number,height:number,color:string=P.plaster,sides=12,r:Point3=[0,0,0]){
    this.add(new THREE.CylinderGeometry(top,bottom,height,sides),color,p,r)
  }
  sphere(p:Point3,size:Point3,color:string=P.brass,glow=false){this.add(new THREE.SphereGeometry(1,12,8),color,p,[0,0,0],glow,size)}
  beam(a:Point3,b:Point3,width=.12,color:string=P.wood,depth=width){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),axis=end.clone().sub(start)
    const g=new THREE.BoxGeometry(width,axis.length(),depth)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize()))
    this.add(g,color,start.add(end).multiplyScalar(.5).toArray() as Point3)
  }
  ring(p:Point3,radius:number,tube:number,color:string=P.brass,rotation:Point3=[0,0,0],segments=24){
    this.add(new THREE.TorusGeometry(radius,tube,5,segments),color,p,rotation)
  }
  profile(points:[number,number][],depth:number,p:Point3,color:string=P.plaster){
    const s=new THREE.Shape(points.map(v=>new THREE.Vector2(...v)))
    this.add(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:1}),color,p)
  }
  quad(points:Point3[],color:string,glow=false){
    const g=new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,2,1,0,3,2]);g.computeVertexNormals()
    this.add(g,color,[0,0,0],[0,0,0],glow)
  }
  private arch(w:number,h:number){
    const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2)
    s.absarc(0,h-w/2,w/2,0,Math.PI,false);s.closePath();return s
  }
  opening(p:Point3,w:number,h:number,door=false,angle=0,tint:string=P.glass,mullions=true){
    const offset=(x:number,y:number,z:number):Point3=>[p[0]+Math.cos(angle)*x+Math.sin(angle)*z,p[1]+y,p[2]-Math.sin(angle)*x+Math.cos(angle)*z]
    this.add(new THREE.ExtrudeGeometry(this.arch(w+.20,h+.12),{depth:.055,bevelEnabled:true,
      bevelSize:.025,bevelThickness:.015,bevelSegments:1,curveSegments:5}),P.stone,p,[0,angle,0])
    this.add(new THREE.ShapeGeometry(this.arch(w,h),5),P.ink,offset(0,.045,.085),[0,angle,0])
    this.add(new THREE.ShapeGeometry(this.arch(w*.80,h*.90),5),door?'#725236':tint,offset(0,.10,.097),[0,angle,0],!door)
    if(door||mullions)this.beam(offset(0,.12,.12),offset(0,h*.84,.12),.035,door?P.grain:P.wood,.025)
    if(door){
      for(const y of [.48,h*.70])this.beam(offset(-w*.35,y,.13),offset(w*.35,y,.13),.055,P.ink,.025)
      this.ring(offset(w*.25,h*.45,.15),.06,.015,P.brass,[0,angle,0],10)
    }else if(mullions){
      this.beam(offset(-w*.36,h*.45,.13),offset(w*.36,h*.45,.13),.045)
      this.box(offset(0,-.015,.09),[w+.24,.10,.20],P.wood,[0,angle,0])
    }
  }
  roundWindow(p:Point3,r:number,angle=0){
    this.add(new THREE.CircleGeometry(r,20),P.tealDark,p,[0,angle,0])
    this.add(new THREE.CircleGeometry(r*.80,20),P.glass,[p[0]+Math.sin(angle)*.015,p[1],p[2]+Math.cos(angle)*.015],[0,angle,0],true)
    this.ring(p,r,.07,P.grain,[0,angle,0],20)
  }
  foundation(width:number,depth:number,round=false){
    if(round){this.cylinder([0,-.15,0],width/2,width/2+.12,.80,P.stoneShade);this.cylinder([0,.24,0],width/2+.03,width/2+.04,.16,P.stone)}
    else{this.box([0,-.15,0],[width,.80,depth],P.stoneShade);this.box([0,.24,0],[width+.08,.16,depth+.06],P.stone)}
  }
  steps(x:number,z:number,width=1.15){
    this.box([x,.03,z+.30],[width+.18,.20,.65],P.stoneShade)
    this.box([x,.18,z+.12],[width,.18,.44],P.stone)
  }
  masonry(width:number,depth:number,height:number){
    for(let row=0;row<Math.floor(height/.63);row++)for(const side of [-1,1]){
      const y=.55+row*.63
      this.box([side*(width/2-.10),y,depth/2+.017],[row%2?.34:.27,.21,.05],row%3?P.stone:P.light)
      this.box([side*(width/2+.017),y,-depth*.29],[.05,.21,.35],P.stone)
    }
  }
  roof(path:[number,number][],depth:number,color:string=P.roof,x=0,z=0){
    const base=new THREE.Color(color)
    const colours=[base.getStyle(),base.clone().lerp(new THREE.Color(color===P.teal?P.tealLight:P.tileLight),.25).getStyle(),
      base.clone().lerp(new THREE.Color(P.wood),.10).getStyle()]
    for(let i=0;i<path.length-1;i++){
      const [x0,y0]=path[i],[x1,y1]=path[i+1]
      this.quad([[x+x0,y0,z-depth/2],[x+x1,y1,z-depth/2],[x+x1,y1,z+depth/2],[x+x0,y0,z+depth/2]],P.ink)
      for(let tile=0;tile<6;tile++){
        const a=z-depth/2+tile*depth/6,b=a+depth/6-.007
        this.quad([[x+x0,y0+.028,a],[x+x1,y1+.028,a],[x+x1,y1+.028,b],[x+x0,y0+.028,b]],colours[(i+Math.floor(tile/3))%3])
      }
      for(const end of [-1,1])this.beam([x+x0,y0,z+end*depth/2],[x+x1,y1,z+end*depth/2],.115,P.wood)
    }
  }
  banner(p:Point3,width=.48,height=.85,color:string=P.teal,symbol:'star'|'cloud'|'ring'='star'){
    this.profile([[-width/2,0],[width/2,0],[width/2,-height],[0,-height+.13],[-width/2,-height]],.025,p,color)
    this.beam([p[0]-width*.7,p[1]+.04,p[2]],[p[0]+width*.7,p[1]+.04,p[2]],.055,P.brass)
    if(symbol==='cloud'){
      for(const [x,y,r]of [[-.10,-.36,.10],[.02,-.30,.13],[.13,-.37,.09]])this.sphere([p[0]+x,p[1]+y,p[2]+.04],[r,r,.025],P.light)
    }else if(symbol==='ring'){
      this.ring([p[0],p[1]-.37,p[2]+.04],.12,.018,P.gold,[0,0,0],12)
      this.beam([p[0],p[1]-.10,p[2]+.04],[p[0],p[1]-.65,p[2]+.04],.024,P.gold)
    }else{
      const points:[number,number][]=[]
      for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?.052:.17;points.push([Math.sin(a)*r,Math.cos(a)*r])}
      this.profile(points,.018,[p[0],p[1]-.39,p[2]+.04],P.gold)
    }
  }
  rail(a:Point3,b:Point3,height=.55){
    const n=Math.max(2,Math.ceil(new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b))/.36))
    for(let i=0;i<=n;i++){
      const p=a.map((v,j)=>v+(b[j]-v)*i/n) as Point3
      this.beam(p,[p[0],p[1]+height,p[2]],.065)
    }
    this.beam([a[0],a[1]+height,a[2]],[b[0],b[1]+height,b[2]],.10)
  }
  finish(){
    const merge=(parts:THREE.BufferGeometry[])=>{
      if(!parts.length)return null
      const result=mergeGeometries(parts,false);parts.forEach(g=>g.dispose())
      if(!result)throw new Error('Building geometry attributes differ')
      result.computeBoundingBox();result.computeBoundingSphere();return result
    }
    return{body:merge(this.solid)!,panes:merge(this.light)}
  }
}
