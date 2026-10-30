import * as THREE from 'three'
import { BuildingGeometryKit, villagePalette as P, type Point3 } from './buildingGeometryKit'

export type VillageBuildingId='cloud-forge'|'data-tower'|'learning-lab'|'hobbies-hut'|'signal-station'|'about-cottage'

function forge(){
  const k=new BuildingGeometryKit()
  k.foundation(3.85,3.10)
  k.box([0,1.70,0],[3.65,2.78,2.80],P.plaster);k.masonry(3.65,2.8,2.9)
  const roof:[number,number][]=[[-2.53,3.44],[-1.74,3.72],[-.68,4.25],[.07,4.02],[.85,3.53],[1.68,3.15],[2.27,3.22]]
  k.profile([[-1.825,3.0],[1.825,3.0],[1.825,3.13],[1.68,3.09],[.85,3.47],[.07,3.96],[-.68,4.19],[-1.74,3.66],[-1.825,3.61]],2.80,[0,0,-1.4],P.plaster)
  k.roof(roof,3.38,P.teal)
  // The workbench keeps the anvil motif; the roof remains one clean surface.
  k.beam([-1.60,2.74,1.48],[-1.60,.35,1.48],.18,'#475051')
  k.beam([.46,2.74,1.48],[.46,.35,1.48],.18,'#475051')
  k.opening([-.60,.88,1.43],1.35,1.54,false,0,'#a94c20',false)
  k.box([-.60,.84,1.58],[1.93,.19,.55],'#4a5050')
  k.cylinder([-.65,1.04,1.57],.07,.07,.76,P.wood,7,[0,0,Math.PI/2])
  k.cylinder([-.38,1.14,1.56],.06,.06,.56,P.wood,7,[0,0,Math.PI/2])
  k.box([-.60,2.66,1.53],[2.18,.21,.28],'#455356')
  k.opening([1.10,.31,1.43],.70,2.02,true);k.steps(1.10,1.70)
  k.banner([.99,3.27,1.63],.58,.92,P.teal,'cloud')
  // Low open workshop bay, a single workbench and a stout capped chimney.
  k.box([-2.18,.19,.15],[1.26,.20,2.60],P.stoneShade)
  k.roof([[-2.85,2.34],[-2.14,2.56],[-1.72,2.85]],2.75,P.teal)
  for(const z of [-1.10,1.32])k.beam([-2.65,.25,z],[-2.65,2.40,z],.13)
  k.box([-2.20,1.05,.2],[1.04,.17,1.30])
  for(const z of [-.28,.68])k.beam([-2.55,.25,z],[-2.55,1.0,z],.10)
  k.profile([[-.36,0],[.33,0],[.20,.20],[.43,.32],[-.48,.32],[-.21,.17]],.34,[-2.20,1.15,.25],'#485557')
  k.box([.94,4.23,-.78],[.56,1.92,.58],P.stoneShade)
  k.box([.94,5.22,-.78],[.73,.16,.74],'#475354');k.box([.94,5.31,-.78],[.40,.025,.42],P.ink)
  k.opening([1.845,1.10,-.45],.44,.88,false,Math.PI/2)
  k.opening([.35,1.05,-1.43],.48,.95,false,Math.PI)
  return k.finish()
}

function dataTower(){
  const k=new BuildingGeometryKit()
  k.foundation(2.96,2.96,true)
  k.cylinder([0,1.91,0],1.20,1.39,3.20,P.plaster,14)
  for(const y of [.60,2.72,3.50])k.cylinder([0,y,0],1.30,1.36,.16,P.wood,14)
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4,x=Math.sin(a),z=Math.cos(a)
    k.beam([x*1.33,.40,z*1.33],[x*1.20,3.46,z*1.20],.10)
    if(i%2===0)k.box([x*1.33,.80,z*1.33],[.27,.22,.20],P.stone,[0,a,0])
  }
  k.opening([0,.32,1.39],.78,2.02,true);k.steps(0,1.65)
  k.opening([.78,1.45,1.07],.34,.81,false,.50)
  k.opening([-.77,1.45,1.08],.34,.81,false,-.50)
  k.opening([0,1.25,-1.33],.42,1.10,false,Math.PI)
  // F's wide open astrolabe roof, with a timber bowl and exposed instrument disc.
  k.cylinder([0,3.87,0],1.89,1.20,.69,P.wood,16)
  k.cylinder([0,4.24,0],1.92,1.92,.18,P.brass,24)
  k.cylinder([0,4.36,0],1.78,1.78,.11,P.teal,24)
  k.ring([0,4.43,0],1.62,.043,P.gold,[Math.PI/2,0,0],32)
  k.ring([0,4.44,0],.96,.035,P.gold,[Math.PI/2,0,0],28)
  k.ring([0,4.45,0],.46,.025,P.gold,[Math.PI/2,0,0],20)
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,x=Math.sin(a),z=Math.cos(a)
    k.beam([x*1.30,3.54,z*1.30],[x*1.94,4.23,z*1.94],.11,P.grain)
    k.beam([x*1.85,4.29,z*1.85],[x*1.85,4.78,z*1.85],.07,P.brass)
    k.beam([x*.38,4.45,z*.38],[x*1.53,4.45,z*1.53],.026,P.gold)
  }
  k.ring([0,4.79,0],1.85,.055,P.brass,[Math.PI/2,0,0],32)
  k.sphere([0,4.66,0],[.23,.23,.23],P.gold)
  k.banner([.68,3.54,1.32],.48,.83,P.teal,'ring')
  k.profile([[-2.05,.30],[-.90,.30],[-.90,2.24],[-1.40,2.16],[-2.05,1.78]],1.55,[0,0,-.675],P.plaster)
  k.roof([[-2.20,1.73],[-1.40,2.22],[-.85,2.31]],1.85,P.roof)
  return k.finish()
}

function learningLab(){
  const k=new BuildingGeometryKit()
  k.foundation(3.25,2.94)
  k.box([-.15,1.43,0],[2.86,2.26,2.62],P.plaster);k.masonry(2.86,2.62,2.4)
  k.opening([-.30,.31,1.34],.86,2.15,true);k.steps(-.30,1.65)
  k.opening([-1.60,1.00,-.10],.45,.95,false,-Math.PI/2)
  k.opening([-.10,1.1,-1.34],.50,1.0,false,Math.PI)
  // B's stepped base, wraparound terrace and copper observatory dome.
  k.cylinder([-.28,3.24,-.16],1.13,1.24,1.40,P.plaster,16)
  k.cylinder([-.28,2.58,-.16],1.37,1.38,.20,P.stone,16)
  k.cylinder([-.28,3.98,-.16],1.38,1.29,.20,P.brass,20)
  k.add(new THREE.SphereGeometry(1.31,20,8,0,Math.PI*2,0,Math.PI/2), '#b17843',[-.28,4.05,-.16])
  for(let rib=0;rib<8;rib++)for(let part=0;part<5;part++){
    const a=rib/8*Math.PI*2,t0=part/5*Math.PI/2,t1=(part+1)/5*Math.PI/2
    k.beam([-.28+Math.sin(t0)*Math.cos(a)*1.325,4.05+Math.cos(t0)*1.325,-.16+Math.sin(t0)*Math.sin(a)*1.325],
      [-.28+Math.sin(t1)*Math.cos(a)*1.325,4.05+Math.cos(t1)*1.325,-.16+Math.sin(t1)*Math.sin(a)*1.325],.042,P.brass)
  }
  k.opening([-.28,2.99,1.02],.40,.76)
  k.opening([-1.42,2.99,-.16],.40,.76,false,-Math.PI/2)
  // Telescope uses one continuous axis, bronze cuffs and an opaque cyan lens.
  const from=new THREE.Vector3(.33,4.75,.22),to=new THREE.Vector3(1.60,5.63,.70)
  const axis=to.clone().sub(from),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis.clone().normalize())
  const tube=new THREE.CylinderGeometry(.17,.23,axis.length(),12);tube.applyQuaternion(q)
  k.add(tube,P.brass,from.clone().add(to).multiplyScalar(.5).toArray() as Point3)
  for(const t of [.15,.73,1]){
    const g=new THREE.CylinderGeometry(.245,.245,.11,12);g.applyQuaternion(q)
    k.add(g,t===1?P.gold:P.wood,from.clone().lerp(to,t).toArray() as Point3)
  }
  const lens=new THREE.CircleGeometry(.19,16)
  lens.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis.clone().normalize()))
  k.add(lens,P.glass,to.clone().addScaledVector(axis.normalize(),.062).toArray() as Point3,[0,0,0],true)
  k.box([1.55,1.38,-.25],[1.40,2.15,2.02],P.plaster)
  k.box([1.46,2.56,.22],[1.68,.17,2.64],P.stone)
  k.rail([.78,2.65,1.48],[2.25,2.65,1.48],.57)
  k.rail([2.25,2.65,-1.02],[2.25,2.65,1.48],.57)
  k.opening([1.58,.74,.79],.43,1.11)
  k.banner([1.70,2.60,1.54],.48,.92,'#315f83','star')
  k.banner([-1.11,2.60,1.39],.38,.78,'#315f83','star')
  k.roof([[-1.83,2.40],[-1.18,2.60],[-.82,2.74]],1.43,P.roof,0,.13)
  return k.finish()
}

function hobbies(){
  const k=new BuildingGeometryKit()
  k.foundation(3.48,2.80)
  const wall:[number,number][]=[[-1.58,.29],[1.57,.29],[1.57,2.67],[1.10,2.54],[.48,2.69],[-.18,3.11],[-.80,3.34],[-1.30,3.21],[-1.58,3.02]]
  k.profile(wall,2.48,[0,0,-1.24],'#a77944')
  for(let i=0;i<9;i++){
    const x=-1.46+i*.36,top=x<-.6?2.7:x<.3?2.56:2.27
    k.box([x,(top+.3)/2,1.267],[.025,top-.3,.028],P.wood)
  }
  k.roof([[-2.05,2.34],[-1.78,2.87],[-1.30,3.28],[-.80,3.41],[-.18,3.18],[.48,2.76],[1.10,2.61],[1.78,2.81],[2.01,3.04]],2.96,'#c7833e')
  k.roundWindow([-.79,1.63,1.29],.43)
  k.opening([.68,.31,1.28],.73,2.00,true);k.steps(.68,1.55)
  k.roundWindow([1.59,1.43,-.13],.34,Math.PI/2)
  k.roundWindow([-.15,1.60,-1.28],.34,Math.PI)
  for(const x of [-1.55,1.55])k.beam([x,.3,1.31],[x,x<0?2.55:2.46,1.31],.13)
  k.box([0,.45,-1.30],[3.05,.15,.15])
  return k.finish()
}

function signal(){
  const k=new BuildingGeometryKit()
  k.foundation(2.55,2.55,true)
  k.cylinder([0,2.10,0],.61,.94,3.65,P.plaster,12)
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,x=Math.sin(a),z=Math.cos(a)
    k.beam([x*.91,.45,z*.91],[x*.62,3.85,z*.62],.095,P.stone)
  }
  k.opening([0,.31,.96],.67,1.92,true);k.steps(0,1.26)
  k.cylinder([0,4.11,0],1.48,.62,.72,P.wood,16)
  k.cylinder([0,4.50,0],1.52,1.52,.16,P.brass,16)
  k.cylinder([0,5.15,0],1.43,1.50,.15,P.wood,16)
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2,b=(i+1)/12*Math.PI*2
    k.quad([[Math.sin(a)*1.44,4.58,Math.cos(a)*1.44],[Math.sin(b)*1.44,4.58,Math.cos(b)*1.44],
      [Math.sin(b)*1.39,5.10,Math.cos(b)*1.39],[Math.sin(a)*1.39,5.10,Math.cos(a)*1.39]],i%3===0?'#54aaa9':P.glass,true)
    k.beam([Math.sin(a)*1.46,4.53,Math.cos(a)*1.46],[Math.sin(a)*1.42,5.13,Math.cos(a)*1.42],.075,P.wood)
  }
  k.add(new THREE.LatheGeometry([[1.72,5.24],[1.57,5.23],[1.31,5.36],[.96,5.58],[.45,5.80],[.18,5.88]]
    .map(([r,y])=>new THREE.Vector2(r,y)),16),P.roof)
  k.ring([0,5.24,0],1.70,.06,P.wood,[Math.PI/2,0,0],24)
  k.cylinder([0,5.91,0],.14,.28,.12,P.brass,12)
  k.beam([0,5.91,0],[0,6.42,0],.07,P.brass)
  k.sphere([0,6.44,0],[.13,.13,.13],P.gold,true)
  k.banner([.44,3.17,.83],.39,.75,P.teal,'star')
  k.opening([-.76,1.82,-.1],.29,.69,false,-Math.PI/2)
  return k.finish()
}

function cottage(){
  const k=new BuildingGeometryKit()
  k.foundation(3.60,2.94)
  k.box([0,1.43,0],[3.30,2.25,2.62],P.plaster);k.masonry(3.30,2.62,2.4)
  // Selected two-storey cottage: an offset upper room and a small front balcony.
  k.box([-.15,3.27,-.10],[2.98,1.56,2.42],P.plaster)
  k.box([-.15,2.52,-.10],[3.20,.20,2.63],P.wood)
  k.profile([[-1.64,4.0],[1.34,4.0],[1.34,4.51],[.72,5.16],[.04,5.52],[-.61,5.38],[-1.17,4.96],[-1.64,4.42]],2.42,[0,0,-1.31],P.light)
  k.roof([[-2.05,4.07],[-1.67,4.45],[-1.17,5.01],[-.61,5.43],[.04,5.57],[.72,5.21],[1.42,4.50],[1.87,4.34]],2.98,P.roof)
  k.opening([-.20,.31,1.34],.80,2.13,true);k.steps(-.2,1.68)
  k.opening([-1.06,1.10,1.34],.42,.92)
  k.roundWindow([1.05,1.55,1.34],.34)
  k.opening([1.68,1.08,0],.43,.95,false,Math.PI/2)
  k.opening([-.65,1.10,-1.34],.48,.97,false,Math.PI)
  k.roundWindow([-.81,3.34,1.14],.29)
  k.opening([.58,2.72,1.14],.62,1.25,true)
  k.opening([1.36,2.90,-.20],.38,.80,false,Math.PI/2)
  k.opening([-.35,2.93,-1.34],.45,.85,false,Math.PI)
  k.box([.63,2.62,1.62],[1.89,.17,1.03])
  k.rail([-.29,2.71,2.10],[1.55,2.71,2.10],.58)
  k.rail([1.55,2.71,1.12],[1.55,2.71,2.10],.58)
  k.rail([-.29,2.71,1.12],[-.29,2.71,2.10],.58)
  for(const x of [.30,1.52]){
    k.beam([x,.32,1.91],[x,2.58,1.91],.12)
    k.beam([x,1.80,1.36],[x,2.55,1.99],.10)
  }
  for(const x of [-1.56,1.25])k.beam([x,2.60,1.15],[x,4.07,1.15],.12)
  k.box([-.94,5.53,-.66],[.38,1.42,.45],P.stone)
  k.box([-.94,6.25,-.66],[.53,.15,.59],P.roof)
  k.box([-.94,6.34,-.66],[.28,.02,.33],P.ink)
  k.beam([-1.61,.32,1.37],[-1.61,2.62,1.37],.13)
  k.beam([1.61,.32,1.37],[1.61,2.73,1.37],.13)
  return k.finish()
}

const quirks:Record<VillageBuildingId,{height:number;lean:number;sway:number;tilt:number}>={
  'cloud-forge':{height:5.4,lean:-.19,sway:.075,tilt:-.035},
  'data-tower':{height:4.9,lean:.20,sway:.07,tilt:.085},
  'learning-lab':{height:5.9,lean:-.22,sway:.08,tilt:-.04},
  'hobbies-hut':{height:3.5,lean:.08,sway:.10,tilt:.055},
  'signal-station':{height:6.6,lean:.29,sway:.09,tilt:-.055},
  'about-cottage':{height:6.4,lean:-.24,sway:.09,tilt:.055},
}

// Effects and architecture share this transform so chimney smoke and fire
// remain attached to the hand-shaped building rather than its unbent template.
export function buildingPoint(id:VillageBuildingId,x:number,y:number,z:number):Point3{
  const q=quirks[id],t=THREE.MathUtils.clamp((y-.35)/(q.height-.35),0,1)
  return[x+q.lean*t*t+Math.sin(t*Math.PI)*q.sway,
    y+q.tilt*x*THREE.MathUtils.smoothstep(y,1.8,3.4),z+Math.sin(x*.8)*q.sway*t]
}

export function makeVillageBuilding(id:VillageBuildingId){
  const model=({'cloud-forge':forge,'data-tower':dataTower,'learning-lab':learningLab,'hobbies-hut':hobbies,
    'signal-station':signal,'about-cottage':cottage})[id]()
  // Small construction quirks, baked once. Openings and trim follow the walls;
  // ground-level foundations and entrance footprints keep their exact placement.
  for(const geometry of Object.values(model))if(geometry){
    const p=geometry.attributes.position
    for(let i=0;i<p.count;i++){
      p.setXYZ(i,...buildingPoint(id,p.getX(i),p.getY(i),p.getZ(i)))
    }
    p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere()
  }
  return model
}
