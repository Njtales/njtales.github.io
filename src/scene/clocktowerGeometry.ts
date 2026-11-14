import * as THREE from 'three'
import {BuildingGeometryKit as Kit,villagePalette as P,type Point3} from './buildingGeometryKit'
import {footing,wallWear,type RoofPath} from './rusticBuildingDetails'

export function clocktowerPoint(x:number,y:number,z:number):Point3 {
  const t=THREE.MathUtils.clamp((y-.35)/10.3,0,1)
  return[x+.30*t*t+.32*Math.sin(t*Math.PI*2),y,z+.025*Math.sin(t*Math.PI)]
}
export const CLOCK_DIAL={position:clocktowerPoint(-.06,7.15,1.10),radius:.59}

/** Tall crooked bell-and-clock landmark, sharing the village's two mesh layers. */
export function makeClocktowerGeometry(){
  const k=new Kit()
  footing(k,3.03,2.22)
  k.profile([[-1.38,.30],[1.38,.30],[1.28,2.40],[1.06,4.75],[1.14,8.29],
    [-1.19,8.29],[-1.08,4.75],[-1.28,2.40]],1.85,[0,0,-.925],P.plaster)
  for(const side of[-1,1])for(const z of[-.97,.98]){
    k.beam([side*1.32,.40,z],[side*1.12,4.75,z],.25)
    k.beam([side*1.12,4.75,z],[side*1.18,8.29,z],.25)
  }
  for(const [y,w]of[[2.42,2.25],[4.75,2.05],[6.28,2.12],[8.29,2.47]])
    k.box([-.02,y,0],[w*1.24,.29,2.10])
  for(let row=0;row<8;row++)for(const side of[-1,1]){
    const y=.64+row*.91,x=side*(row<3?1.25:1.03)
    k.stoneBlock([x,y,.94],[row%2?.34:.43,.34,.17],row%3?P.stone:P.light,[0,0,side*.025])
  }
  wallWear(k,2.05,.925,8.1)
  k.beam([-1.08,4.94,1.02],[1.08,6.10,1.02],.22)
  k.beam([-.89,2.62,-1.0],[.82,4.62,-1.0],.14)
  k.opening([-.22,.30,1.04],.77,1.88,true)
  k.steps(-.22,1.43)
  k.opening([.25,3.04,.96],.34,.80)
  k.opening([-1.30,1.38,.05],.37,.94,false,-Math.PI/2)
  k.opening([1.16,5.10,-.1],.35,.90,false,Math.PI/2)
  k.opening([-.15,3.04,-.96],.38,.83,false,Math.PI)
  k.opening([-.04,6.92,-.96],.38,.90,false,Math.PI)

  // A small, nearly inset clock replaces the old projecting oversized disc.
  k.cylinder([-.06,7.15,1.00],.69,.69,.12,P.ink,24,[Math.PI/2,0,0])
  k.ring([-.06,7.15,1.08],.65,.055,P.grain,[0,0,0],24)

  // The added height is an open bell section above the masonry shaft.
  k.stoneBlock([-.02,8.43,0],[2.98,.25,2.30],P.stone)
  for(const x of[-1.08,1.08])for(const z of[-.77,.77]){
    k.beam([x,8.49,z],[x*.91,9.69,z],.26)
    k.beam([x,9.22,z],[x*.58,9.65,z],.12)
  }
  k.beam([-1.08,9.60,.05],[1.08,9.60,.05],.23)
  k.beam([-.02,9.60,.05],[-.02,9.20,.05],.055,P.ink)
  k.cylinder([-.02,8.98,.05],.13,.37,.55,P.gold,10)
  k.ring([-.02,8.70,.05],.36,.045,P.brass,[Math.PI/2,0,0],16)
  k.cylinder([-.02,8.66,.05],.055,.08,.19,P.ink,8)
  const roof:RoofPath=[[-1.54,9.92],[-1.20,9.64],[-.62,10.04],[-.22,10.62],
    [.32,10.31],[1.00,9.69],[1.50,9.83]]
  k.roof(roof.map(([x,y])=>[x*1.23,y]),2.80)

  // Small rooflets and one side porch break up the tall shaft's silhouette.
  k.box([1.52,.26,.75],[1.31,.18,1.65],P.stoneShade)
  for(const z of[.10,1.43])k.beam([2.08,.35,z],[2.08,2.58,z],.17)
  k.rail([2.08,.35,.10],[2.08,.35,1.43],.48)
  k.roof([[.83,3.08],[1.48,2.65],[2.29,2.69]],1.89,P.roof,0,.72)
  k.roof([[-1.27,5.08],[-.85,4.76],[-.15,4.79]],.88,P.roof,0,1.10)
  k.beam([1.0,5.49,-.20],[1.80,5.54,-.20],.065)
  k.profile([[0,0],[.64,-.07],[.45,-.22],[.66,-.29],[0,-.25]],.025,[1.19,5.52,-.20],P.teal)
  const model=k.finish()
  for(const geometry of Object.values(model))if(geometry){
    const points=geometry.attributes.position
    for(let i=0;i<points.count;i++)points.setXYZ(i,...clocktowerPoint(points.getX(i),points.getY(i),points.getZ(i)))
    geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere()
  }
  return model
}
