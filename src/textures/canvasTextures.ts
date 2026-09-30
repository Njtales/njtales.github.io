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
