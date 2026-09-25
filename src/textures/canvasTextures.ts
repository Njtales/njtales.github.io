import * as THREE from 'three';

/**
 * Bakes a small strip of N discrete flat gray bands (not a smooth ramp) for
 * use as a MeshToonMaterial's gradientMap. NearestFilter + no mipmaps is
 * required here — with linear filtering the GPU blends the bands back into
 * a smooth gradient and toon shading silently degenerates into Lambert.
 */
export function createToonGradientMap(steps = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = steps;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < steps; i++) {
    const v = Math.round((i / Math.max(1, steps - 1)) * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(i, 0, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/**
 * Bakes a tileable ground texture: a sunny green base plus a couple hundred
 * soft overlapping color blobs (faking brush-stroke blotches) and a fine
 * speckle pass for grain. Each blob is drawn 9x, offset by the canvas size
 * in a 3x3 tile, so anything crossing an edge wraps around seamlessly when
 * the material repeats it.
 */
export function createPainterlyGroundTexture(): THREE.CanvasTexture {
  const SIZE = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7EC850';
  ctx.fillRect(0, 0, SIZE, SIZE);

  const blobColors = ['#8FD65E', '#6FBD42', '#5DAA3A', '#9AD968', '#4F9A32'];
  const BLOB_COUNT = 220;
  for (let i = 0; i < BLOB_COUNT; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const r = 30 + Math.random() * 90;
    const color = blobColors[Math.floor(Math.random() * blobColors.length)];
    const alpha = 0.12 + Math.random() * 0.22;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = x + dx * SIZE;
        const cy = y + dy * SIZE;
        if (cx < -r || cx > SIZE + r || cy < -r || cy > SIZE + r) continue;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, hexToRgba(color, alpha));
        gradient.addColorStop(1, hexToRgba(color, 0));
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    }
  }

  const SPECKLE_COUNT = 4000;
  for (let i = 0; i < SPECKLE_COUNT; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const shade = Math.random() > 0.5 ? '255,255,255' : '40,60,20';
    ctx.fillStyle = `rgba(${shade},${0.03 + Math.random() * 0.05})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
