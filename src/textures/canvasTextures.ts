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

/** Draws one soft radial blob, replicated across a 3x3 tile (offset by the
 * canvas size each way) so anything crossing an edge wraps seamlessly when
 * the material repeats this texture. Shared by every layer below. */
function paintTiledBlob(ctx: CanvasRenderingContext2D, size: number, x: number, y: number, r: number, colorStops: [number, string][]) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cx = x + dx * size;
      const cy = y + dy * size;
      if (cx < -r || cx > size + r || cy < -r || cy > size + r) continue;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      for (const [stop, color] of colorStops) gradient.addColorStop(stop, color);
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }
}

/**
 * Bakes a tileable painted-meadow ground texture in three layers, cheapest
 * (broadest) to most detailed:
 *  1. Big, bold tonal wash patches — the large light/dark regions that read
 *     as brushstrokes from a distance. The original version only had a
 *     small-blob layer at fairly low contrast, which read as fine "noise"
 *     rather than the reference's bold painted patchwork.
 *  2. Smaller, higher-contrast color blobs on top, in a wider palette
 *     (warm olive/khaki mixed with the greens, not just green-on-green)
 *     for closer-up texture.
 *  3. Fine speckle grain, as before.
 * Every blob is drawn via paintTiledBlob for seamless wraparound.
 */
export function createPainterlyGroundTexture(): THREE.CanvasTexture {
  const SIZE = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7EC850';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Layer 1: broad tonal washes — big, soft, bold patches.
  const washColors = ['#93D866', '#4E8F32', '#6FBD42', '#5DAA3A'];
  const WASH_COUNT = 26;
  for (let i = 0; i < WASH_COUNT; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const r = 140 + Math.random() * 220;
    const color = washColors[Math.floor(Math.random() * washColors.length)];
    paintTiledBlob(ctx, SIZE, x, y, r, [
      [0, hexToRgba(color, 0.5)],
      [0.7, hexToRgba(color, 0.28)],
      [1, hexToRgba(color, 0)],
    ]);
  }

  // Layer 2: closer-up color blobs, wider palette (warm olive/khaki mixed
  // with greens) and bolder alpha than the original pass.
  const blobColors = ['#8FD65E', '#6FBD42', '#5DAA3A', '#9AD968', '#4F9A32', '#A9B458', '#7C8F3E'];
  const BLOB_COUNT = 260;
  for (let i = 0; i < BLOB_COUNT; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const r = 26 + Math.random() * 80;
    const color = blobColors[Math.floor(Math.random() * blobColors.length)];
    const alpha = 0.22 + Math.random() * 0.32;
    paintTiledBlob(ctx, SIZE, x, y, r, [
      [0, hexToRgba(color, alpha)],
      [1, hexToRgba(color, 0)],
    ]);
  }

  // Layer 3: fine speckle grain.
  const SPECKLE_COUNT = 4500;
  for (let i = 0; i < SPECKLE_COUNT; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const shade = Math.random() > 0.5 ? '255,255,255' : '35,55,18';
    ctx.fillStyle = `rgba(${shade},${0.04 + Math.random() * 0.06})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Bakes a soft, alpha-blended cloud puff — a cluster of overlapping white
 * radial gradients on a transparent canvas — for use as a billboarded
 * sprite. No external image needed; the soft edges come from the gradient
 * stops fading to zero alpha rather than a hard circle.
 */
export function createCloudPuffTexture(): THREE.CanvasTexture {
  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  const lobes = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < lobes; i++) {
    const cx = SIZE * (0.3 + Math.random() * 0.4);
    const cy = SIZE * (0.4 + Math.random() * 0.3);
    const r = SIZE * (0.18 + Math.random() * 0.16);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
