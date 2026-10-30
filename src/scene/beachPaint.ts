import { grassContour, sandContour, pointInContour } from './groundContours'

// Small, fixed groups leave the pier approach and most of the shore clear.
const shells = [
  [-18,12.1,.85,-.35],[-17.5,12.25,.58,.5],[-7,14.5,.73,-.6],
  [7.8,13.8,.82,.35],[8.28,14.02,.58,-.75],[21.5,9.3,.78,1.1],
]
const driftwood = [[5.4,14,1,-.32],[-15.5,13.4,.82,.72]]

function dryBeach(x:number,z:number,margin:number) {
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4,px=x+Math.cos(a)*margin,pz=z+Math.sin(a)*margin
    if(!pointInContour(px,pz,sandContour)||pointInContour(px,pz,grassContour))return false
  }
  return true
}

/** Painted once into the existing sand map: no meshes, textures or frame work. */
export function paintBeachDetails(context:CanvasRenderingContext2D) {
  for(const [index,[x,z,scale,angle]]of shells.entries()) {
    if(!dryBeach(x,z,.4*scale))continue
    context.save();context.translate(x,z);context.rotate(angle);context.scale(scale,scale)
    // A faint settling shadow is included in the paint, not a separate layer.
    context.fillStyle='rgba(100,87,61,0.12)'
    context.beginPath();context.ellipse(.025,.045,.32,.21,0,0,Math.PI*2);context.fill()
    context.beginPath();context.moveTo(0,.19);context.lineTo(-.28,0)
    for(let lobe=0;lobe<6;lobe++) {
      const a=Math.PI+lobe*Math.PI/6,b=a+Math.PI/6,mid=(a+b)/2
      context.quadraticCurveTo(Math.cos(mid)*.34,Math.sin(mid)*.32,Math.cos(b)*.28,Math.sin(b)*.28)
    }
    context.closePath()
    const glaze=context.createLinearGradient(-.2,-.3,.15,.2)
    glaze.addColorStop(0,index%3===1?'#ecd7bd':'#eee0c2')
    glaze.addColorStop(1,index%3===1?'#c7a58b':'#bba780')
    context.fillStyle=glaze;context.fill()
    context.strokeStyle='rgba(133,112,80,0.42)';context.lineWidth=.018;context.stroke()
    context.strokeStyle='rgba(255,242,214,0.64)';context.lineWidth=.018
    for(let rib=1;rib<6;rib++) {
      const a=Math.PI+rib*Math.PI/6,tx=Math.cos(a)*.25,tz=Math.sin(a)*.25
      context.beginPath();context.moveTo(0,.14)
      context.quadraticCurveTo(tx*.6,tz*.45,tx,tz);context.stroke()
    }
    context.restore()
  }
  for(const [x,z,scale,angle]of driftwood) {
    if(!dryBeach(x,z,.9*scale))continue
    context.save();context.translate(x,z);context.rotate(angle);context.scale(scale,scale)
    context.lineCap='round';context.lineJoin='round'
    context.beginPath();context.moveTo(-.70,.04);context.lineTo(.68,.10)
    context.strokeStyle='rgba(97,84,60,0.14)';context.lineWidth=.23;context.stroke()
    // A short split branch and one tapered, weathered body.
    context.beginPath();context.moveTo(.10,.02);context.lineTo(.40,-.29)
    context.strokeStyle='#9c8a68';context.lineWidth=.13;context.stroke()
    context.beginPath();context.moveTo(-.74,-.04);context.lineTo(-.47,-.12)
    context.lineTo(.16,-.09);context.lineTo(.73,-.015);context.lineTo(.61,.10)
    context.lineTo(.14,.13);context.lineTo(-.51,.075);context.closePath()
    const grain=context.createLinearGradient(0,-.12,0,.13)
    grain.addColorStop(0,'#c2ad83');grain.addColorStop(.45,'#a69270');grain.addColorStop(1,'#82765c')
    context.fillStyle=grain;context.fill()
    context.strokeStyle='rgba(103,90,66,0.60)';context.lineWidth=.024
    context.beginPath();context.moveTo(-.56,.005);context.bezierCurveTo(-.2,-.045,.20,.045,.59,.025);context.stroke()
    context.strokeStyle='rgba(235,214,169,0.55)';context.lineWidth=.028
    context.beginPath();context.moveTo(-.47,-.065);context.quadraticCurveTo(-.1,-.085,.36,-.035);context.stroke()
    context.restore()
  }
}
