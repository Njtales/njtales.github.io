import * as THREE from 'three'
import { createSmoothRoof } from './smoothRoof'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type Point = [number, number, number]
const palette = {
  plaster: '#dfc99b', light: '#edd9ae', stone: '#b9aa88', stoneShade: '#928c76',
  timber: '#795033', edge: '#4a392b', grain: '#a77b49', roof: '#b65336',
  tile: '#d16d42', tileLight: '#de8650', teal: '#397c7c', brass: '#bd9450',
}

/** A few merged, vertex-painted surfaces; construction detail costs no draw calls. */
export function makeClocktowerGeometry() {
  const pieces: THREE.BufferGeometry[] = []
  const panes: THREE.BufferGeometry[] = []
  function paint(g: THREE.BufferGeometry, color: string, p: Point = [0,0,0], r: Point = [0,0,0]) {
    const pigment = new THREE.Color(color), colors = new Float32Array(g.attributes.position.count * 3)
    for (let i = 0; i < g.attributes.position.count; i++) {
      const shade = 0.91 + Math.max(0,g.attributes.normal.getY(i)) * 0.09
      colors.set([pigment.r * shade,pigment.g * shade,pigment.b * shade],i * 3)
    }
    if (!g.index) g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i))
    g.deleteAttribute('uv'); g.setAttribute('color',new THREE.BufferAttribute(colors,3))
    g.rotateX(r[0]); g.rotateY(r[1]); g.rotateZ(r[2]); g.translate(...p)
    return g
  }
  function box(p: Point, size: Point, color = palette.timber, r: Point = [0,0,0]) {
    pieces.push(paint(new THREE.BoxGeometry(...size),color,p,r))
  }
  function beam(a: Point,b: Point,width = 0.13,color = palette.timber,depth = width) {
    const start = new THREE.Vector3(...a),end = new THREE.Vector3(...b),direction = end.clone().sub(start)
    const g = new THREE.BoxGeometry(width,direction.length(),depth)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()))
    pieces.push(paint(g,color,start.add(end).multiplyScalar(0.5).toArray() as Point))
  }
  function profile(points: [number,number][], depth: number, p: Point, color: string) {
    const shape = new THREE.Shape(points.map(v=>new THREE.Vector2(...v)))
    pieces.push(paint(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:1}),color,p))
  }
  function quad(points: Point[],color: string) {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,2,1,0,3,2])
    g.computeVertexNormals();pieces.push(paint(g,color))
  }
  function arch(width: number,height: number) {
    const s = new THREE.Shape()
    s.moveTo(-width/2,0);s.lineTo(width/2,0);s.lineTo(width/2,height-width/2)
    s.absarc(0,height-width/2,width/2,0,Math.PI,false);s.closePath()
    return s
  }
  function opening(p: Point,width: number,height: number,rotation = 0,door = false) {
    const outer = arch(width + 0.19,height + 0.13),inner = arch(width,height)
    const frame = new THREE.ExtrudeGeometry(outer,{depth:0.065,bevelEnabled:true,
      bevelSize:0.025,bevelThickness:0.015,bevelSegments:1,curveSegments:6})
    pieces.push(paint(frame,palette.stone,p,[0,rotation,0]))
    const offset = (x:number,y:number,z:number):Point =>
      [p[0]+Math.cos(rotation)*x+Math.sin(rotation)*z,p[1]+y,p[2]-Math.sin(rotation)*x+Math.cos(rotation)*z]
    pieces.push(paint(new THREE.ShapeGeometry(inner,6),palette.edge,offset(0,0.045,0.095),[0,rotation,0]))
    const inset = arch(width*0.76,height*0.89)
    const panel = paint(new THREE.ShapeGeometry(inset,6),door?'#725236':'#dfb863',offset(0,0.095,0.102),[0,rotation,0])
    ;(door?pieces:panes).push(panel)
    const vertical = height*0.81
    beam(offset(0,0.10,0.12),offset(0,vertical,0.12),door?0.025:0.045,door?palette.grain:palette.timber,0.035)
    if (door) {
      for (const x of [-0.24,-0.12,0.12,0.24])
        beam(offset(x,0.12,0.12),offset(x,height*0.65,0.12),0.012,palette.edge,0.008)
      for(const y of [0.44,1.18]) beam(offset(-width*0.35,y,0.13),offset(width*0.35,y,0.13),0.055,palette.edge,0.035)
      pieces.push(paint(new THREE.TorusGeometry(0.055,0.014,4,10),palette.brass,offset(width*0.26,0.85,0.16),[0,rotation,0]))
    } else {
      beam(offset(-width*0.38,height*0.43,0.13),offset(width*0.38,height*0.43,0.13),0.045)
      box(offset(0,-0.02,0.11),[width+0.28,0.10,0.22],palette.timber,[0,rotation,0])
    }
  }
  function ring(p: Point,radius: number,tube: number,color: string) {
    pieces.push(paint(new THREE.TorusGeometry(radius,tube,6,40),color,p))
  }

  // Broad, slightly crooked masonry, with a sunk plinth rather than a floating base.
  profile([[-1.13,-0.05],[1.13,-0.05],[1.11,2.35],[0.92,4.30],[0.98,6.66],
    [-1.04,6.66],[-0.94,3.7],[-1.07,1.6]],1.8,[0,0,-0.9],palette.plaster)
  box([0,0.10,0],[2.45,0.25,2.06],palette.stoneShade)
  box([0,0.30,0],[2.28,0.19,1.96],palette.stone)
  // Restrained broad stone patches and corner blocks; no modeled mortar grid.
  for(let row=0;row<8;row++) {
    for(const side of [-1,1]) {
      const x=side*(row>3?0.87:0.98),y=0.61+row*0.72
      box([x,y,0.928],[0.29+(row%2)*0.12,0.23,0.075],row%3?palette.stone:palette.light)
      box([side*1.105,y,side*0.62],[0.05,0.24,0.37],palette.stone)
    }
  }
  for(const [x,y,w] of [[-0.46,2.4,0.44],[0.35,3.1,0.32],[-0.45,4.2,0.48],[0.38,6.25,0.32]])
    box([x,y,0.911],[w,0.18,0.018],palette.light)
  // The arch used to meet the 2.32-high timber band at z=1.02 exactly.
  // Give the doorway its own depth so the two surfaces cannot z-fight.
  opening([-.22,0.28,0.99],0.77,1.93,0,true)
  for(const [x,y,z,w,h,angle] of [[0.36,2.75,0.94,0.36,0.86,0],[-1.06,1.9,0.15,0.4,1.0,-Math.PI/2],
    [1.025,4.4,-0.1,0.39,0.95,Math.PI/2]]) opening([x,y,z],w,h,angle)
  for(const [y,width] of [[2.32,2.30],[4.06,2.14],[6.60,2.37]]) {
    box([-.04,y,0],[width,0.19,2.04]);box([-.04,y+0.12,1.035],[width,0.055,0.045],palette.grain)
  }
  for(const side of [-1,1]) beam([side*1.03,2.38,0.98],[side*0.95,6.6,0.98],0.13)
  beam([-.95,4.16,0.99],[.93,6.48,0.99],0.10)
  // Rear elevations remain readable when walking behind the landmark.
  for(const side of [-1,1]) {
    beam([side*1.03,.40,-.94],[side*.96,6.6,-.94],.12)
    for(let row=0;row<4;row++)box([side*.87,.78+row*.63,-.932],[.32,.21,.07],palette.stone)
  }
  opening([-.12,.95,-.95],.42,1.02,Math.PI)
  opening([-.08,4.72,-.95],.43,1.05,Math.PI)
  beam([-.95,2.45,-.97],[.92,3.95,-.97],.095)
  // Low front steps; the collision outline also covers their solid footprint.
  box([-.22,0.08,1.43],[1.28,0.16,0.76],palette.stoneShade)
  box([-.22,0.18,1.27],[1.12,0.16,0.60],palette.stone)

  // Oversized projecting clock, dark silhouette + two warm bevels.
  pieces.push(paint(new THREE.CylinderGeometry(1.13,1.13,0.23,40),palette.edge,[-.16,5.22,1.07],[Math.PI/2,0,0]))
  ring([-.16,5.22,1.23],1.075,0.10,palette.timber)
  ring([-.16,5.22,1.30],1.01,0.035,palette.brass)
  ring([-.16,5.22,1.28],1.16,0.034,palette.grain)
  beam([-.98,4.05,1.01],[-.82,4.45,1.30],0.16)
  beam([.74,4.05,1.01],[.54,4.45,1.30],0.16)
  for(const a of [0.4,1.4,2.4,3.4,4.4,5.4])
    pieces.push(paint(new THREE.SphereGeometry(0.037,6,4),palette.brass,
      [-.16+Math.sin(a)*1.09,5.22+Math.cos(a)*1.09,1.335]))

  // Keep the swept silhouette with a continuous, closed roof and finished eaves.
  const roofPath:[number,number][]=[[-1.55,6.76],[-1.26,6.90],[-0.83,7.40],[-0.53,7.96],
    [-0.37,8.37],[-0.14,8.04],[0.40,7.51],[1.05,7.08],[1.61,6.98],[1.73,7.09]]
  profile([[-1.16,6.57],[1.19,6.57],[-.37,8.28]],1.91,[0,0,-.96],palette.light)
  const roof=createSmoothRoof(roofPath,2.52)
  pieces.push(paint(roof.surface,palette.roof,[0,0,.015]))
  pieces.push(paint(roof.fascia,palette.timber,[0,0,.015]))
  for(const [x,y]of [roofPath[0],roofPath[roofPath.length-1]])
    beam([x,y-.035,-1.27],[x,y-.035,1.30],.13,palette.timber)
  beam([-.37,8.40,-1.33],[-.37,8.40,1.40],0.17,palette.tileLight)
  beam([-.37,8.40,1.40],[-.50,8.65,1.44],0.14,palette.timber)
  // Exposed front gable timbers and a small teal dormer.
  beam([-.98,6.72,1.02],[-.40,8.08,1.03],0.12)
  beam([1.0,6.72,1.02],[-.35,8.12,1.03],0.12)
  beam([-.35,6.73,1.05],[-.35,8.12,1.05],0.10)
  beam([-.98,6.72,-.98],[-.40,8.08,-.98],.11)
  beam([1.0,6.72,-.98],[-.35,8.12,-.98],.11)
  beam([-.35,6.73,-1.0],[-.35,8.12,-1.0],.10)
  opening([-.40,6.98,1.04],0.32,0.68)
  box([.60,7.47,.42],[.57,.85,.68],palette.plaster)
  profile([[-.40,0],[.42,0],[.02,.40]],.90,[.60,7.89,.02],palette.roof)
  opening([.60,7.42,.78],.27,.43)
  beam([.22,7.90,.95],[.62,8.30,.95],.07,palette.timber)
  beam([.62,8.30,.95],[1.01,7.90,.95],.07,palette.timber)
  box([.38,8.10,-.66],[.34,1.03,.38],palette.stone)
  box([.38,8.62,-.66],[.46,.13,.48],palette.roof)
  box([.38,8.69,-.66],[.30,.018,.32],palette.edge)

  // Small right porch and a staggered upper balcony, clear of the front door.
  box([1.53,.16,.75],[1.33,.20,1.68],palette.stoneShade)
  box([1.53,.30,.75],[1.38,.13,1.69])
  for(const [x,z] of [[2.13,1.48],[2.13,.07]]) {
    beam([x,.32,z],[x,2.45,z],.14)
    beam([x,.85,z],[x-.38,.43,z],.09)
  }
  for(const z of [.22,.59,.96,1.31]) beam([2.13,.37,z],[2.13,.93,z],.075)
  beam([2.13,.96,.08],[2.13,.96,1.49],.11)
  quad([[.95,2.80,-.12],[2.37,2.34,-.12],[2.37,2.34,1.65],[.95,2.80,1.65]],palette.roof)
  beam([2.37,2.34,-.18],[2.37,2.34,1.71],.12)
  beam([.95,2.80,1.69],[2.37,2.34,1.69],.12)
  box([1.35,3.58,-.12],[1.13,.17,1.22])
  beam([.96,2.87,.40],[1.89,3.50,.40],.13)
  for(const x of [1.02,1.39,1.86]) beam([x,3.65,.45],[x,4.20,.45],.075)
  beam([.98,4.23,.45],[1.92,4.23,.45],.10)
  beam([1.88,3.65,-.68],[1.88,4.20,-.68],.075)
  beam([1.88,4.23,-.68],[1.88,4.23,.45],.10)

  // One hoist, a quiet teal pennant and warm lanterns; no animated chains or lights.
  beam([-1.02,6.38,.48],[-1.72,7.34,.48],.11)
  beam([-.50,7.29,.48],[-1.83,7.38,.48],.14)
  beam([-1.70,7.35,.48],[-1.70,6.48,.48],.026,palette.edge)
  function lantern(p:Point) {
    for(const x of [-.085,.085])for(const z of [-.085,.085])
      box([p[0]+x,p[1],p[2]+z],[.035,.32,.035],palette.edge)
    panes.push(paint(new THREE.BoxGeometry(.125,.23,.125),'#f3c771',p))
    box([p[0],p[1]+.19,p[2]],[.25,.06,.25],palette.timber)
    box([p[0],p[1]-.19,p[2]],[.22,.06,.22],palette.timber)
  }
  lantern([-1.70,6.28,.48]);lantern([.42,1.79,1.07])
  beam([1.05,5.78,-.20],[2.02,5.94,-.20],.045,palette.timber)
  profile([[0,0],[.62,-.07],[.47,-.24],[.71,-.31],[0,-.25]],.025,[1.39,5.90,-.2],palette.teal)
  // Compact leaf clumps soften the balcony and base without realistic ivy simulation.
  for(const [x,y,z] of [[1.05,3.77,.51],[1.28,3.73,.53],[1.06,3.28,.53],[1.05,2.95,.65],[-.99,.35,.91],[-1.2,.23,.76]])
    pieces.push(paint(new THREE.IcosahedronGeometry(.15,0),'#66813a',[x,y,z]))

  function merge(parts:THREE.BufferGeometry[]) {
    const result=mergeGeometries(parts,false)
    parts.forEach(g=>g.dispose())
    if(!result)throw new Error('Clocktower geometry attributes must match')
    result.computeBoundingBox();result.computeBoundingSphere();return result
  }
  return {body:merge(pieces),panes:merge(panes)}
}
