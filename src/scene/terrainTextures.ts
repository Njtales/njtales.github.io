import * as THREE from 'three';

/**
 * Paints one soft, feather-edged patch of color — a radial gradient fading
 * from a low-opacity center to fully transparent at the rim, no stroke or
 * outline. Layering many of these in close, low-contrast hues is what gives
 * a subtle painterly mottling instead of either flat-dot circles or
 * cartoon-outlined clumps. Stamped at all 9 tile-wrap offsets so it still
 * tiles seamlessly (RepeatWrapping otherwise shows the repeat boundary as a
 * hard seam).
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

/** Decent, understated green grass with soft, low-contrast mottling — close
 * variations on the base color blended in with feathered edges rather than
 * distinct shapes, so it reads as a subtle natural texture, not a pattern. */
export function createGrassTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6f9450';
  ctx.fillRect(0, 0, size, size);

  const lightColors = ['#7c9f5a', '#82a35e'];
  const darkColors = ['#628647', '#5d8043'];

  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = lightColors[Math.floor(Math.random() * lightColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 55 + Math.random() * 55, 0.22 + Math.random() * 0.1);
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = darkColors[Math.floor(Math.random() * darkColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 45 + Math.random() * 50, 0.18 + Math.random() * 0.1);
  }

  // A little fine-grain speckle for close-up texture, very low opacity so it
  // reads as grain rather than dots.
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.globalAlpha = 0.05 + Math.random() * 0.06;
    ctx.fillStyle = Math.random() < 0.5 ? '#4f7038' : '#9ab76a';
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;

  return makeTexture(canvas, 7);
}

/** Worn dirt footpath — a soft tan base with gentle, low-contrast mottling.
 * No hard clump outlines or crack lines, just enough variation to avoid
 * reading as a flat color fill. */
export function createPathTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c3a578';
  ctx.fillRect(0, 0, size, size);

  const lightColors = ['#cdb086', '#d0b78f'];
  const darkColors = ['#b4966a', '#a98a5f'];

  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = lightColors[Math.floor(Math.random() * lightColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 60 + Math.random() * 60, 0.2 + Math.random() * 0.1);
  }
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = darkColors[Math.floor(Math.random() * darkColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 50 + Math.random() * 55, 0.18 + Math.random() * 0.1);
  }

  for (let i = 0; i < 300; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.globalAlpha = 0.05 + Math.random() * 0.06;
    ctx.fillStyle = Math.random() < 0.5 ? '#8a6f4a' : '#e0c69a';
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;

  return makeTexture(canvas, 5);
}
