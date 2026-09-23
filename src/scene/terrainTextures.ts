import * as THREE from 'three';

/**
 * Paints one soft, feather-edged patch of color — a radial gradient fading
 * from a low-opacity center to fully transparent at the rim, no stroke or
 * outline. At low alpha and with many overlapping, no single patch's rim is
 * discernible on its own — the previous version made that rim visible by
 * running these through a canvas `filter: blur(...)` pass, which reads
 * cleaner in isolation but introduced its own faint tiling/blocking artifact
 * on this canvas 2D implementation. Plain overlapping gradients avoid that
 * entirely. Stamped at all 9 tile-wrap offsets so it still tiles seamlessly
 * (RepeatWrapping otherwise shows the repeat boundary as a hard seam).
 */
function paintSoftPatch(
  ctx: CanvasRenderingContext2D,
  size: number,
  baseX: number,
  baseY: number,
  color: string,
  radius: number,
  alpha: number,
) {
  for (const dx of [-size, 0, size]) {
    for (const dy of [-size, 0, size]) {
      const cx = baseX + dx;
      const cy = baseY + dy;
      if (cx + radius < 0 || cx - radius > size || cy + radius < 0 || cy - radius > size) continue;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
  }
  ctx.globalAlpha = 1;
}

function makeTexture(canvas: HTMLCanvasElement, repeat: number): THREE.Texture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Bright, clean cel-shaded grass — a saturated flat green base with a few
 * large, very low-contrast patches for gentle variation and nothing else.
 * Aimed at the Cat Quest III reference: color and the terrain's own gentle
 * shape carry the look, not surface texture detail. */
export function createGrassTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#78b34c';
  ctx.fillRect(0, 0, size, size);

  const lightColors = ['#89c05c', '#8ec464'];
  const darkColors = ['#5f9c3e', '#6aa646'];

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = lightColors[Math.floor(Math.random() * lightColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 90 + Math.random() * 90, 0.12 + Math.random() * 0.06);
  }
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = darkColors[Math.floor(Math.random() * darkColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 80 + Math.random() * 80, 0.1 + Math.random() * 0.06);
  }

  // A warmer sunlit-patch layer on top — the dappled highlight variation
  // visible in the reference's rolling hills. Same large-radius/low-alpha
  // recipe as the two layers above: a smaller, higher-contrast version of
  // this (radius ~30, alpha up to 0.22) is exactly what caused the original
  // "circles" bug — small + higher-alpha patches don't get enough overlap
  // to blend, so each one's rim stays individually visible.
  const warmColors = ['#a3c363', '#9fbf57'];
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = warmColors[Math.floor(Math.random() * warmColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 75 + Math.random() * 70, 0.06 + Math.random() * 0.05);
  }

  return makeTexture(canvas, 7);
}

/** Bright, clean sandy dirt trail — matching Cat Quest III's path look
 * rather than the old-town cobblestone tried earlier: a warm light-tan flat
 * base with the same soft, low-contrast overlapping-patch mottling as the
 * grass, no stones, no mortar, no crack lines. */
export function createPathTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e3c893';
  ctx.fillRect(0, 0, size, size);

  const lightColors = ['#ecd6a5', '#efdbae'];
  const darkColors = ['#d3b47d', '#c9a86e'];

  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = lightColors[Math.floor(Math.random() * lightColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 70 + Math.random() * 70, 0.14 + Math.random() * 0.07);
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = darkColors[Math.floor(Math.random() * darkColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 55 + Math.random() * 60, 0.12 + Math.random() * 0.07);
  }

  return makeTexture(canvas, 5);
}
