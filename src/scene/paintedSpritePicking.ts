import * as THREE from 'three'

/** Match the visible silhouette, so empty corners don't capture ground clicks. */
export function createAlphaSpriteRaycast(alpha:Uint8Array,width:number,height:number,cutoff:number):THREE.Sprite['raycast']{
  const hits:THREE.Intersection[]=[]
  return function(this:THREE.Sprite,raycaster,intersections){
    hits.length=0;THREE.Sprite.prototype.raycast.call(this,raycaster,hits)
    for(const hit of hits){
      if(!hit.uv)continue
      const x=THREE.MathUtils.clamp(Math.floor(hit.uv.x*width),0,width-1)
      const y=THREE.MathUtils.clamp(Math.floor((1-hit.uv.y)*height),0,height-1)
      if(alpha[y*width+x]/255>=cutoff)intersections.push(hit)
    }
  }
}
