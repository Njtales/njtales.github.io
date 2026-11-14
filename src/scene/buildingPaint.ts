import * as THREE from 'three'

let paint:THREE.CanvasTexture|null=null

/** One small static pigment wash shared by every building, with mipmaps to
 * keep the painted surface stable as the camera moves. No animated noise. */
export function getBuildingPaint(){
  if(paint)return paint
  const size=256,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size
  const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(size,size)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*Math.PI*2,v=y/size*Math.PI*2
    const broad=Math.sin(u*3+Math.sin(v*2))*Math.cos(v*3-u)*.45
      +Math.sin(u*7+v*4+Math.cos(v*5))*.20+Math.cos(u*17-v*13)*.065
    const value=Math.round(233+broad*24),i=(y*size+x)*4
    pixels.data[i]=value;pixels.data[i+1]=value;pixels.data[i+2]=value;pixels.data[i+3]=255
  }
  ctx.putImageData(pixels,0,0)
  paint=new THREE.CanvasTexture(canvas);paint.colorSpace=THREE.SRGBColorSpace
  paint.wrapS=paint.wrapT=THREE.RepeatWrapping;paint.anisotropy=4
  return paint
}
