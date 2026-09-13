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

/**
 * Scatters many tiny short strokes in randomized colors/angles — the
 * fine-grained, blade-like detail that separates a "painted texture" from a
 * flat tint. Individually near-invisible, but in bulk they read as the
 * close-up grain a reference painterly ground texture has, without ever
 * resolving into a repeating shape the way circles/clumps did.
 */
function paintStrokes(
  ctx: CanvasRenderingContext2D,
  size: number,
  count: number,
  colors: string[],
  length: number,
  alphaRange: [number, number],
) {
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const angle = Math.random() * Math.PI * 2;
    const len = length * (0.6 + Math.random() * 0.8);
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.lineWidth = 1 + Math.random();
    ctx.globalAlpha = alphaRange[0] + Math.random() * (alphaRange[1] - alphaRange[0]);
    ctx.beginPath();
    ctx.moveTo(x - dx / 2, y - dy / 2);
    ctx.lineTo(x + dx / 2, y + dy / 2);
    ctx.stroke();
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

/** Decent, understated green grass built up in layers of decreasing scale —
 * broad soft mottling for overall color variation, a mid layer that adds
 * warmer sunlit/olive hues, then fine blade-like strokes and grain for
 * close-up detail — closer to a painted reference texture than a flat tint. */
export function createGrassTexture(): THREE.Texture {
  const size = 768;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6f9450';
  ctx.fillRect(0, 0, size, size);

  // Broad, soft mottling — the base color variation.
  const lightColors = ['#7c9f5a', '#82a35e'];
  const darkColors = ['#628647', '#5d8043'];
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = lightColors[Math.floor(Math.random() * lightColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 80 + Math.random() * 80, 0.2 + Math.random() * 0.1);
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = darkColors[Math.floor(Math.random() * darkColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 65 + Math.random() * 75, 0.16 + Math.random() * 0.1);
  }

  // Mid layer — smaller, warmer olive/sunlit patches for richer variation,
  // like the dappled highlights in the reference field.
  const warmColors = ['#93a94f', '#a3ab5a', '#547a3f'];
  for (let i = 0; i < 55; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = warmColors[Math.floor(Math.random() * warmColors.length)];
    paintSoftPatch(ctx, size, x, y, color, 20 + Math.random() * 30, 0.16 + Math.random() * 0.12);
  }

  // Fine blade-like strokes — the close-up grain that reads as individual
  // tufts of grass rather than a smooth gradient.
  paintStrokes(ctx, size, 2200, ['#547a3f', '#6f9450', '#87a85c', '#9db65f'], 6, [0.12, 0.28]);

  // Tiny speckle grain on top, very low opacity.
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.globalAlpha = 0.05 + Math.random() * 0.07;
    ctx.fillStyle = Math.random() < 0.5 ? '#4f7038' : '#b8d17e';
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
