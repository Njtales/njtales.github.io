import * as THREE from 'three';

function canvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return { canvas: c, ctx: c.getContext('2d')! };
}

/** Mottled dark ground texture — subtle noise so the plaza doesn't read as a flat fill. */
export function createGroundTexture(): THREE.Texture {
  const { canvas: c, ctx } = canvas(256);
  ctx.fillStyle = '#1a1420';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const shade = Math.random() * 14 - 7;
    const base = 0x1a + shade;
    ctx.fillStyle = `rgba(${base + 8}, ${base + 4}, ${base + 12}, ${Math.random() * 0.25})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Dark asphalt texture with faint grain for the road beds. */
export function createAsphaltTexture(): THREE.Texture {
  const { canvas: c, ctx } = canvas(128);
  ctx.fillStyle = '#211a28';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const v = Math.random() * 0.15;
    ctx.fillStyle = `rgba(0,0,0,${v})`;
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
