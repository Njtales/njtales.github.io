import * as THREE from 'three'

/** A tiny, fixed mask softens the existing shadow without another render pass. */
export function createContactShadowMask() {
  const size=32, data=new Uint8Array(size*size*4)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const radius=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1)
    const alpha=1-THREE.MathUtils.smoothstep(radius,.22,.98)
    const offset=(y*size+x)*4
    data.set([255,255,255,Math.round(alpha*255)],offset)
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat)
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter
  texture.generateMipmaps=false;texture.needsUpdate=true
  return texture
}
