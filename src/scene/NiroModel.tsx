import { useEffect,useMemo } from 'react'
import { Outlines } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { NIRO,type NiroRig } from './niroRig'

type Point=[number,number,number]
const fur={gold:'#edb728',sun:'#f9cc3e',amber:'#cc7425',cream:'#eee0b9',teal:'#356a68',
  tealShade:'#284f50',scarf:'#a64c2e',leather:'#795136',brass:'#b18b42',ink:'#483522'}
function painted(g:THREE.BufferGeometry,color:string,position:Point,scale:Point=[1,1,1],rotation:Point=[0,0,0]){
  const p=new THREE.Color(color),colors=new Float32Array(g.attributes.position.count*3)
  for(let i=0;i<g.attributes.position.count;i++){
    const shade=0.94+Math.max(0,g.attributes.normal.getY(i))*0.06
    colors.set([p.r*shade,p.g*shade,p.b*shade],i*3)
  }
  if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i))
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.deleteAttribute('uv')
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale)))
  return g
}
function packed(parts:THREE.BufferGeometry[]){
  const result=mergeGeometries(parts,false);parts.forEach(g=>g.dispose())
  if(!result)throw new Error('Niro geometry attributes must match')
  result.computeBoundingSphere();return result
}
function sphere(c:string,p:Point,s:Point,w=16,h=10){return painted(new THREE.SphereGeometry(1,w,h),c,p,s)}
function box(c:string,p:Point,s:Point,r:Point=[0,0,0]){return painted(new THREE.BoxGeometry(1,1,1),c,p,s,r)}
function stroke(c:string,points:Point[],r:number){
  return painted(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),8,r,5,false),c,[0,0,0])
}
function triangle(c:string,a:Point,b:Point,d:Point){
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...d,...d,...b,...a],3))
  g.setIndex([0,1,2,3,4,5]);g.computeVertexNormals();return painted(g,c,[0,0,0])
}
function tuft(c:string,p:Point,s:Point,r:Point=[0,0,0]){return painted(new THREE.ConeGeometry(1,1,4),c,p,s,r)}
function cheek(side:number){
  const g=new THREE.SphereGeometry(1,16,10),p=g.attributes.position
  for(let i=0;i<p.count;i++){
    const outer=Math.max(0,p.getX(i)*side)
    p.setXYZ(i,p.getX(i),p.getY(i)*(0.92-outer*0.45)+outer*0.09,p.getZ(i)*(1-outer*0.32))
  }
  g.computeVertexNormals()
  return painted(g,fur.cream,[side*0.28,1.355,0.24],[0.235,0.135,0.15])
}


const headLift=.55
function makeHead(){
  const parts=[
    sphere(fur.sun,[0,1.50,0.015],[0.46,0.415,0.355],24,16),
    cheek(-1),cheek(1),
    sphere(fur.cream,[0,1.38,0.37],[0.225,0.145,0.17],16,12),
    sphere('#4b2d1b',[0,1.445,0.535],[0.063,0.043,0.047],12,8),
    stroke('#624023',[[-0.15,1.345,0.471],[-0.04,1.307,0.530],[0.045,1.319,0.534],[0.12,1.361,0.509]],0.009),
    stroke('#82501b',[[-0.32,1.72,0.235],[-0.23,1.78,0.300],[-0.12,1.735,0.339]],0.025),
    stroke('#82501b',[[0.12,1.735,0.339],[0.22,1.757,0.300],[0.32,1.713,0.235]],0.024),
    tuft(fur.sun,[-0.09,1.87,0.025],[0.09,0.24,0.12],[0,0,-0.47]),
    tuft(fur.sun,[0.06,1.88,0.03],[0.08,0.18,0.10],[0,0,-0.72]),
  ]
  for(const side of [-1,1]){
    const outline=new THREE.Shape()
    outline.moveTo(side*0.19,1.76);outline.lineTo(side*0.49,1.79);outline.lineTo(side*0.46,2.16);outline.closePath()
    const ear=painted(new THREE.ExtrudeGeometry(outline,{depth:0.12,bevelEnabled:true,
      bevelSize:0.015,bevelThickness:0.012,bevelSegments:1,steps:1,curveSegments:1}),fur.gold,[0,0,-0.08])
    const tips=new THREE.Color('#d9562b'),color=new THREE.Color()
    for(let i=0;i<ear.attributes.position.count;i++){
      const amount=THREE.MathUtils.smoothstep(ear.attributes.position.getY(i),2.00,2.105)
      color.fromBufferAttribute(ear.attributes.color,i).lerp(tips,amount)
      ear.attributes.color.setXYZ(i,color.r,color.g,color.b)
    }
    parts.push(ear)
    parts.push(triangle('#df6032',[side*0.255,1.80,0.056],[side*0.445,1.82,0.056],[side*0.44,2.10,0.056]))
    parts.push(triangle('#f5ac62',[side*0.29,1.815,0.061],[side*0.425,1.83,0.061],[side*0.419,1.98,0.061]))
    parts.push(tuft(fur.cream,[side*0.43,1.365,0.205],[0.065,0.25,0.12],[0,0,-side*1.32]))
    parts.push(tuft(fur.cream,[side*0.38,1.285,0.205],[0.060,0.21,0.12],[0,0,-side*1.83]))
    parts.push(tuft(fur.gold,[side*0.40,1.49,0.08],[0.07,0.19,0.11],[0,0,-side*1.3]))
  }
  return packed(parts).translate(0,headLift,0)
}

function vest(){
  const g=new THREE.LatheGeometry([[.28,1.04],[.277,1.10],[.30,1.32],[.355,1.53],[.33,1.61],[.20,1.70]]
    .map(([r,y])=>new THREE.Vector2(r,y)),16,.56,Math.PI*2-1.12)
  return painted(g,fur.teal,[0,0,-.008],[1,1,.82])
}

function torso(){
  const g=new THREE.LatheGeometry([[.10,.82],[.26,.89],[.275,.97],[.245,1.10],
    [.273,1.32],[.332,1.51],[.30,1.59],[.17,1.70],[.09,1.74]]
    .map(([r,y])=>new THREE.Vector2(r,y)),16)
  return painted(g,fur.gold,[0,0,0],[1,1,.8])
}

function makeBody(){
  const parts=[
    torso(),
    sphere(fur.cream,[0,1.33,.165],[.195,.34,.10],14,10),
    vest(),
    box(fur.tealShade,[-.18,1.50,.222],[.065,.29,.035],[0,0,-.18]),
    box(fur.teal,[.18,1.50,.222],[.065,.29,.035],[0,0,.18]),
    painted(new THREE.CylinderGeometry(.276,.28,.085,14),fur.leather,[0,1.035,0],[1,1,.84]),
    box(fur.brass,[.06,1.035,.244],[.15,.115,.045]),box(fur.leather,[.06,1.035,.270],[.084,.062,.015]),
    sphere(fur.leather,[-.29,.995,.035],[.135,.15,.135],10,8),
    box('#997044',[-.29,1.06,.155],[.21,.11,.045]),box(fur.brass,[-.29,.99,.183],[.043,.057,.018]),
    // Scarf has a folded triangular front and a short wind-swept end.
    painted(new THREE.TorusGeometry(.213,.064,5,16),fur.scarf,[0,1.70,.005],[1,1,1],[Math.PI/2,0,0]),
    triangle('#8c3d27',[-.26,1.715,.23],[.27,1.705,.23],[.07,1.46,.283]),
    triangle(fur.scarf,[-.27,1.75,.235],[.28,1.705,.25],[.09,1.505,.305]),
    triangle('#ba5a31',[-.27,1.75,.237],[.28,1.705,.253],[.01,1.645,.284]),
    triangle(fur.scarf,[.19,1.715,-.04],[.61,1.535,-.19],[.47,1.495,-.16]),
    triangle('#ba5a31',[.19,1.715,-.04],[.61,1.535,-.19],[.51,1.645,-.16]),
  ]
  parts.push(makeHead())
  return packed(parts)
}
function makeUpper(){
  const g=new THREE.LatheGeometry([[.08,-1],[.115,-.90],[.17,-.56],[.185,-.25],[.15,.02],[.06,.12]]
    .map(([r,y])=>new THREE.Vector2(r,y*NIRO.upperLeg)),12)
  return packed([painted(g,fur.gold,[0,0,-.008],[1,1,1.06]),
    sphere(fur.gold,[0,-NIRO.upperLeg,0],[.105,.105,.105],10,8),
    tuft(fur.sun,[-.08,-.12,.01],[.05,.15,.085],[0,0,.65])])
}
function makeLower(){
  const g=new THREE.LatheGeometry([[.065,-1.04],[.09,-.91],[.103,-.72],[.095,-.38],[.108,-.13],[.08,.05]]
    .map(([r,y])=>new THREE.Vector2(r,y*NIRO.lowerLeg)),12)
  const result=painted(g,fur.gold,[0,0,0]),c=new THREE.Color(),orange=new THREE.Color(fur.amber)
  for(let i=0;i<result.attributes.position.count;i++){
    const blend=THREE.MathUtils.smoothstep(-result.attributes.position.getY(i)/NIRO.lowerLeg,.20,.63)
    c.fromBufferAttribute(result.attributes.color,i).lerp(orange,blend)
    result.attributes.color.setXYZ(i,c.r,c.g,c.b)
  }
  return packed([result])
}
function makeFoot(){
  const parts=[sphere(fur.amber,[0,-.012,.055],[.15,.083,.207],12,8)]
  for(const x of [-.08,0,.08])parts.push(sphere('#be6c26',[x,-.025,.19],[.052,.067,.073],8,6))
  return packed(parts)
}
function makeArm(){return packed([
  painted(new THREE.CapsuleGeometry(.11,.22,4,10),fur.gold,[0,-.17,-.015],[1,1,1],[.10,0,0]),
  painted(new THREE.CapsuleGeometry(.106,.17,4,10),fur.amber,[0,-.455,.04],[1,1,1],[-.30,0,0]),
  sphere(fur.amber,[0,-.645,.105],[.12,.125,.11],10,8),
  sphere('#bd7026',[.086,-.61,.17],[.050,.067,.065],8,6),
  tuft(fur.sun,[-.07,-.055,-.005],[.06,.17,.08],[0,0,.65])])}
function makeEyes(){
  const parts:THREE.BufferGeometry[]=[]
  for(const side of [-1,1]){
    const x=side*0.205
    parts.push(sphere('#f3ead0',[x,0,0],[0.106,0.136,0.048],12,10))
    parts.push(sphere('#7d4b20',[x+0.011,-0.008,0.040],[0.071,0.103,0.023],12,8))
    parts.push(sphere('#302318',[x+0.014,-0.004,0.058],[0.044,0.079,0.013],10,8))
    parts.push(sphere('#fff5db',[x-0.007,0.040,0.071],[0.019,0.024,0.006],6,4))
  }
  return packed(parts)
}
function makeTail(){
  const curve=new THREE.CatmullRomCurve3([[0,0,0],[-.34,-.04,-.16],[-.74,.14,-.23],
    [-.86,.48,-.20],[-.73,.80,-.15],[-.60,.90,-.11]].map(p=>new THREE.Vector3(...p)))
  const g=new THREE.TubeGeometry(curve,18,1,10,false),positions=g.attributes.position
  const colors=new Float32Array(positions.count*3),gold=new THREE.Color(fur.gold),cream=new THREE.Color(fur.cream)
  for(let ring=0;ring<=18;ring++){
    const t=ring/18,centre=curve.getPointAt(t),r=.105+Math.sin(t*Math.PI)*.19-t*t*t*.085
    for(let side=0;side<=10;side++){
      const i=ring*11+side
      const edge=r*(1+Math.sin(side/10*Math.PI*6+t*7)*0.075)
      const irregular=Math.sin(side/10*Math.PI*4)*.045
      const tone=gold.clone().lerp(cream,THREE.MathUtils.smoothstep(t,.59+irregular,.77+irregular))
      positions.setXYZ(i,centre.x+(positions.getX(i)-centre.x)*edge,
        centre.y+(positions.getY(i)-centre.y)*edge,centre.z+(positions.getZ(i)-centre.z)*edge)
      colors.set([tone.r,tone.g,tone.b],i*3)
    }
  }
  g.deleteAttribute('uv');g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals()
  return packed([g,tuft(fur.cream,[-.67,.86,-.13],[.05,.19,.072],[0,0,-.65])])
}
export function createNiroGeometry(){return{body:makeBody(),upper:makeUpper(),lower:makeLower(),foot:makeFoot(),
  arm:makeArm(),eyes:makeEyes(),tail:makeTail()}}

export function NiroModel({rig}:{rig:NiroRig}){
  const geometry=useMemo(createNiroGeometry,[])
  const materials=useMemo(()=>({surface:new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.98,metalness:0}),
    eyes:new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false})}),[])
  useEffect(()=>()=>{Object.values(geometry).forEach(g=>g.dispose());Object.values(materials).forEach(m=>m.dispose())},[geometry,materials])
  return <group dispose={null}>
    <group ref={rig.torso}>
      <mesh geometry={geometry.body} material={materials.surface} castShadow receiveShadow>
        <Outlines color={fur.ink} thickness={0.012} screenspace transparent opacity={0.55} angle={0.08}/>
      </mesh>
      <group ref={rig.leftArm} position={[-.365,1.56,0]} rotation={[0,0,-.08]}><mesh geometry={geometry.arm} material={materials.surface} castShadow/></group>
      <group ref={rig.rightArm} position={[.365,1.56,0]} rotation={[0,0,.08]}><mesh geometry={geometry.arm} scale={[-1,1,1]} material={materials.surface} castShadow/></group>
      <group ref={rig.tail} position={[0,.86,-.24]}><mesh geometry={geometry.tail} material={materials.surface} castShadow/></group>
      <group ref={rig.eyes} position={[0,1.56+headLift,.328]}><mesh geometry={geometry.eyes} material={materials.eyes}/></group>
    </group>
    {([-1,1] as const).map(side=><group key={side} ref={side===-1?rig.leftHip:rig.rightHip} position={[side*NIRO.stanceWidth,NIRO.hipHeight,0]}>
      <mesh geometry={geometry.upper} material={materials.surface} castShadow/>
      <group ref={side===-1?rig.leftKnee:rig.rightKnee} position={[0,-NIRO.upperLeg,0]}>
        <mesh geometry={geometry.lower} material={materials.surface} castShadow/>
        <group ref={side===-1?rig.leftFoot:rig.rightFoot} position={[0,-NIRO.lowerLeg,0]}><mesh geometry={geometry.foot} rotation={[0,side*.10,0]} material={materials.surface} castShadow/></group>
      </group>
    </group>)}
  </group>
}
