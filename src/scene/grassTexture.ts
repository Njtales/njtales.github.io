import * as THREE from 'three';

/** Procedural mottled grass — soft overlapping color blotches instead of a flat
 * fill, so the ground reads as organic grass rather than a solid green plane.
 * Each blotch is stamped up to 9 times (shifted by ±size) so it wraps
 * seamlessly across the tile edge — without that, RepeatWrapping makes the
 * repeat boundary visible as a grid of hard seams. */
export function createGrassTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6fae4a';
  ctx.fillRect(0, 0, size, size);

  const blotchColors = ['#5f9a3f', '#7dbb57', '#67a844', '#8bc465', '#5a8f3a'];
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 14 + Math.random() * 46;
    const color = blotchColors[Math.floor(Math.random() * blotchColors.length)];
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const cx = x + dx;
        const cy = y + dy;
        if (cx + r < 0 || cx - r > size || cy + r < 0 || cy - r > size) continue;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
