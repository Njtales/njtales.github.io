import * as THREE from 'three'
import {BuildingGeometryKit as Kit,villagePalette as P,type Point3} from './buildingGeometryKit'
import {house,footing,frame,wallWear,hangingSign,chimney,telescope,furnaceArch,type RoofPath} from './rusticBuildingDetails'

export type VillageBuildingId='cloud-forge'|'data-tower'|'learning-lab'|'hobbies-hut'|'signal-station'|'about-cottage'

function forge(){
  const k=new Kit(),roof:RoofPath=[[-2.42,3.55],[-1.86,3.42],[-1.03,3.88],[-.55,4.48],
    [.02,4.22],[.84,3.62],[1.72,3.31],[2.28,3.54]]
  footing(k,3.85,3.10);house(k,3.65,2.80,roof,1.40)
  k.roof(roof,3.38);frame(k,3.65,1.4,3.05,[-.55,4.48,0],-1.4);wallWear(k,3.65,1.4)
  k.opening([-.60,.88,1.43],1.35,1.54,false,0,'#a64a22',false)
  furnaceArch(k,-.60,.88,1.51,1.35,1.54)
  k.box([-.60,.84,1.58],[1.93,.19,.55],P.stoneShade)
  k.cylinder([-.65,1.04,1.57],.07,.07,.76,P.wood,7,[0,0,Math.PI/2])
  k.cylinder([-.38,1.14,1.56],.06,.06,.56,P.wood,7,[0,0,Math.PI/2])
  k.opening([1.10,.31,1.43],.70,2.02,true);k.steps(1.10,1.70)
  hangingSign(k,[2.03,2.93,1.65],'cloud')
  k.opening([-.55,3.35,1.42],.34,.59)
  k.box([-2.18,.19,.15],[1.26,.20,2.60],P.stoneShade)
  k.roof([[-2.85,2.48],[-2.18,2.42],[-1.70,2.88]],2.75,'#9c6139')
  for(const z of[-1.10,1.32])k.beam([-2.65,.25,z],[-2.65,2.45,z],.16)
  k.box([-2.20,1.05,.2],[1.04,.17,1.30])
  for(const z of[-.28,.68])k.beam([-2.55,.25,z],[-2.55,1.0,z],.13)
  k.profile([[-.36,0],[.33,0],[.20,.20],[.43,.32],[-.48,.32],[-.21,.17]],.34,[-2.20,1.15,.25],'#485557')
  // These anchors stay aligned with the existing lightweight smoke and fire.
  chimney(k,.94,-.78,4.02,5.285)
  k.opening([1.845,1.10,-.45],.44,.88,false,Math.PI/2)
  k.opening([.35,1.05,-1.43],.48,.95,false,Math.PI)
  return k.finish()
}

function dataTower(){
  const k=new Kit(),roof:RoofPath=[[-1.79,4.55],[-1.43,4.44],[-.72,5.05],[-.18,5.75],
    [.38,5.41],[1.20,4.64],[1.72,4.59],[1.86,4.77]]
  footing(k,2.90,2.78)
  k.profile([[-1.30,.31],[1.30,.31],[1.16,2.00],[-1.16,2.00]],2.40,[0,0,-1.2],P.plaster)
  k.box([-.04,2.76,-.035],[2.30,1.62,2.28],P.light)
  k.box([-.10,3.98,-.06],[2.19,.93,2.20],P.plaster)
  k.profile([[-1.20,4.40],[.98,4.40],[-.18,5.64]],2.20,[0,0,-1.16],P.light)
  for(const [y,w,d]of[[.58,2.68,2.55],[2.02,2.58,2.47],[3.54,2.46,2.42],[4.43,2.50,2.40]])
    k.box([-.05,y,-.02],[w,.22,d])
  for(const side of[-1,1]){
    k.beam([side*1.20,.40,1.24],[side*1.07,4.43,1.18],.19)
    k.beam([side*1.20,.40,-1.24],[side*1.07,4.43,-1.18],.16)
  }
  k.beam([-1.13,.65,1.25],[.40,1.93,1.25],.15)
  k.beam([1.27,2.12,-1.02],[1.20,3.43,.90],.14)
  k.opening([0,.32,1.24],.78,1.64,true);k.steps(0,1.65)
  k.opening([-.46,2.43,1.17],.38,.77)
  k.opening([.18,3.70,1.08],.34,.61)
  k.opening([1.19,2.30,-.1],.38,.86,false,Math.PI/2)
  k.opening([0,2.45,-1.22],.40,.80,false,Math.PI)
  k.roof(roof,2.85);frame(k,2.19,1.04,4.43,[-.18,5.75,0])
  wallWear(k,2.5,1.2);k.banner([.65,4.05,1.33],.48,1.04,P.teal,'ring')
  return k.finish()
}

function learningLab(){
  const k=new Kit(),roof:RoofPath=[[-1.94,2.82],[-1.51,2.74],[-.78,3.57],[-.36,4.44],
    [.14,4.18],[.84,3.19],[1.48,2.91],[1.77,3.04]]
  footing(k,3.25,2.94);house(k,2.86,2.62,roof,1.31)
  k.roof(roof,3.07);frame(k,2.86,1.31,2.65,[-.36,4.44,0],-1.31);wallWear(k,2.86,1.31)
  k.opening([-.30,.31,1.34],.86,1.98,true);k.steps(-.30,1.65)
  k.opening([-.40,3.29,1.34],.35,.61)
  k.opening([-1.46,1.1,-.25],.44,.89,false,-Math.PI/2)
  k.opening([-.10,1.1,-1.34],.45,.90,false,Math.PI)
  k.box([1.53,1.20,-.10],[1.20,1.80,2.12],P.plaster)
  k.box([1.53,.13,-.10],[1.30,.34,2.22],P.stoneShade)
  k.roof([[.80,2.72],[1.30,2.77],[1.80,2.31],[2.30,2.46]],2.57)
  k.beam([2.09,.31,1.0],[2.09,2.24,1.0],.17)
  k.opening([1.55,.78,.99],.40,.90)
  // A small shuttered attic supports a short telescope, rather than a glass dome.
  k.box([.94,3.22,.29],[.72,.75,1.13],P.wood)
  k.profile([[-.43,0],[.43,0],[0,.48]],1.18,[.94,3.60,-.29],P.plaster)
  k.roof([[.41,3.56],[.96,4.15],[1.49,3.60]],1.43)
  k.opening([.94,3.07,.89],.37,.57,false,0,P.ink,false)
  telescope(k,[.94,3.45,.92],[1.82,4.10,1.46])
  hangingSign(k,[1.83,2.93,1.43],'book')
  return k.finish()
}

function hobbies(){
  const k=new Kit(),roof:RoofPath=[[-2.04,2.39],[-1.58,2.44],[-.87,3.11],[-.35,3.78],
    [.09,3.41],[.65,2.60],[1.39,2.40],[1.93,2.58]]
  footing(k,3.48,2.80);house(k,3.16,2.48,roof,1.24,'#aa8451')
  k.roof(roof,2.98,'#b47a3c');frame(k,3.16,1.24,2.22,[-.35,3.78,0],-1.24)
  for(const x of[-1.16,-.65,-.10,.42,1.08])k.beam([x,.41,1.26],[x,2.20,1.26],.035,P.wood)
  k.opening([.68,.31,1.28],.73,1.87,true);k.steps(.68,1.55)
  k.opening([-.80,1.17,1.28],.46,.83)
  k.opening([1.60,.95,-.20],.40,.84,false,Math.PI/2)
  k.opening([-.15,1.1,-1.28],.42,.86,false,Math.PI)
  hangingSign(k,[1.45,2.57,1.53],'brush')
  chimney(k,-1.01,-.66,2.75,3.54)
  return k.finish()
}

function signal(){
  const k=new Kit(),roof:RoofPath=[[-1.98,2.33],[-1.39,2.25],[-.30,3.16],
    [.28,2.89],[1.40,2.23],[1.98,2.43]]
  footing(k,3.34,2.94);house(k,3.08,2.70,roof,1.35)
  k.roof(roof,3.22);frame(k,3.08,1.35,2.12,[-.30,3.16,0],-1.35);wallWear(k,3.08,1.35,2.2)
  k.opening([.50,.31,1.39],.72,1.70,true);k.steps(.50,1.52)
  k.opening([-.78,1.03,1.39],.43,.78)
  k.opening([-1.57,1.03,-.05],.35,.78,false,-Math.PI/2)
  // Open timber shaft: the extra height comes from structure, not stretched doors.
  for(const x of[-.51,.51])for(const z of[-.52,.52])k.beam([x,2.64,z],[x*.85,5.22,z*.85],.23)
  k.beam([-.50,3.05,.54],[.45,5.08,.48],.18)
  k.beam([.50,3.05,.54],[-.45,5.08,.48],.18)
  k.beam([-.50,3.05,-.54],[.45,5.08,-.48],.16)
  k.beam([.54,3.05,-.50],[.48,5.08,.45],.16)
  k.cylinder([0,5.18,0],1.43,.74,.38,P.wood,8)
  k.cylinder([0,5.40,0],1.48,1.43,.18,P.grain,8)
  for(const z of[-1.09,1.09])k.rail([-1.09,5.47,z],[1.09,5.47,z],.50)
  for(const x of[-1.09,1.09])k.rail([x,5.47,-1.09],[x,5.47,1.09],.50)
  for(const x of[-.83,.83])for(const z of[-.79,.79])k.beam([x,5.47,z],[x*.92,6.49,z],.20)
  k.roof([[-1.57,6.47],[-1.17,6.43],[-.20,7.16],[.42,6.94],[1.25,6.40],[1.58,6.55]],2.89)
  k.beam([.32,6.73,-.20],[.32,8.23,-.20],.105)
  k.box([.32,8.24,-.20],[.18,.15,.18],P.grain)
  for(const [y,length]of[[7.97,.78],[7.52,.63]])
    k.profile([[0,0],[length,-.06],[length-.16,-.16],[length+.03,-.25],[0,-.23]],.024,[.35,y,-.20],P.teal)
  chimney(k,-1.14,-.58,2.22,3.10)
  return k.finish()
}

function cottage(){
  const k=new Kit(),roof:RoofPath=[[-2.01,3.83],[-1.57,3.74],[-.81,4.48],[-.23,5.19],
    [.31,4.87],[1.11,4.00],[1.78,3.77],[1.98,3.93]]
  footing(k,3.60,2.94)
  house(k,3.30,2.62,roof,1.31)
  k.box([-.02,2.44,0],[3.46,.23,2.77]);k.roof(roof,3.04)
  frame(k,3.30,1.31,3.62,[-.23,5.19,0],-1.31);wallWear(k,3.30,1.31)
  k.beam([-1.51,2.57,1.38],[-.36,3.54,1.38],.14)
  k.beam([-1.69,.55,-1.05],[-1.69,2.25,.95],.14)
  k.opening([-.20,.31,1.35],.80,1.97,true);k.steps(-.20,1.68)
  k.opening([-1.06,1.03,1.35],.37,.83)
  k.opening([1.05,1.09,1.35],.40,.88)
  k.opening([1.68,.95,-.20],.40,.95,false,Math.PI/2)
  k.opening([-.65,1.02,-1.34],.42,.90,false,Math.PI)
  k.opening([.58,2.66,1.35],.58,1.13,true)
  k.opening([-.27,4.04,1.35],.38,.66)
  k.opening([1.68,2.77,-.20],.34,.76,false,Math.PI/2)
  k.opening([-.35,2.80,-1.34],.40,.80,false,Math.PI)
  k.box([.63,2.55,1.62],[1.89,.20,1.03])
  k.rail([-.29,2.65,2.10],[1.55,2.65,2.10],.52)
  k.rail([1.55,2.65,1.12],[1.55,2.65,2.10],.52)
  k.rail([-.29,2.65,1.12],[-.29,2.65,2.10],.52)
  for(const x of[.30,1.52]){
    k.beam([x,.32,1.91],[x,2.50,1.91],.17)
    k.beam([x,1.85,1.36],[x,2.50,1.99],.13)
  }
  chimney(k,-.92,-.65,4.30,5.61)
  return k.finish()
}

const quirks:Record<VillageBuildingId,{height:number;lean:number;sway:number;tilt:number}>={
  'cloud-forge':{height:5.4,lean:-.13,sway:.06,tilt:-.025},
  'data-tower':{height:5.9,lean:.17,sway:.07,tilt:.035},
  'learning-lab':{height:4.6,lean:-.13,sway:.06,tilt:-.025},
  'hobbies-hut':{height:3.9,lean:.09,sway:.07,tilt:.035},
  'signal-station':{height:8.4,lean:.25,sway:.07,tilt:-.025},
  'about-cottage':{height:5.8,lean:-.17,sway:.06,tilt:.035},
}

/** Architecture and effects share the same small baked construction lean. */
export function buildingPoint(id:VillageBuildingId,x:number,y:number,z:number):Point3{
  const q=quirks[id],t=THREE.MathUtils.clamp((y-.35)/(q.height-.35),0,1)
  return[x+q.lean*t*t+Math.sin(t*Math.PI)*q.sway,
    y+q.tilt*x*THREE.MathUtils.smoothstep(y,1.8,3.4),z+Math.sin(x*.8)*q.sway*t]
}

export function makeVillageBuilding(id:VillageBuildingId){
  const model=({'cloud-forge':forge,'data-tower':dataTower,'learning-lab':learningLab,'hobbies-hut':hobbies,
    'signal-station':signal,'about-cottage':cottage})[id]()
  for(const geometry of Object.values(model))if(geometry){
    const p=geometry.attributes.position
    for(let i=0;i<p.count;i++)p.setXYZ(i,...buildingPoint(id,p.getX(i),p.getY(i),p.getZ(i)))
    p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere()
  }
  return model
}
