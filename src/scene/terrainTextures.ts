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

  return makeTexture(canvas, 7);
}

/** Draws one rounded cobblestone into a grid cell, jittered off-center and
 * randomly sized so the pattern reads as old hand-laid stone rather than a
 * perfect grid, plus a soft diagonal light/shadow gradient for a rounded,
 * worn-pebble look. Stamped at all 9 tile-wrap offsets, same as
 * paintSoftPatch, so the grid lines up seamlessly across the repeat. */
function paintCobblestone(
  ctx: CanvasRenderingContext2D,
  size: number,
  cx: number,
  cy: number,
  cellW: number,
  cellH: number,
  colors: string[],
) {
  for (const dx of [-size, 0, size]) {
    for (const dy of [-size, 0, size]) {
      const wx = cx + dx;
      const wy = cy + dy;
      if (wx + cellW < 0 || wx - cellW > size || wy + cellH < 0 || wy - cellH > size) continue;

      const w = cellW * (0.72 + Math.random() * 0.14);
      const h = cellH * (0.72 + Math.random() * 0.14);
      const jitterX = (Math.random() - 0.5) * cellW * 0.14;
      const jitterY = (Math.random() - 0.5) * cellH * 0.14;
      const x = wx + jitterX - w / 2;
      const y = wy + jitterY - h / 2;
      const r = Math.min(w, h) * 0.3;

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fill();

      ctx.save();
      ctx.clip();
      const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
      gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
  }
}

/** Old-town cobblestone street — small rounded stones set in mortar,
 * staggered row to row like real hand-laid paving. Aimed at the "1920s
 * street" reference: warm, worn stone tones rather than a flat dirt tint. */
export function createPathTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Mortar/grout base, visible in the gaps between stones.
  ctx.fillStyle = '#7d7160';
  ctx.fillRect(0, 0, size, size);

  const cols = 8;
  const rows = 8;
  const cellW = size / cols;
  const cellH = size / rows;
  const stoneColors = ['#b7a888', '#a89878', '#9c8d70', '#c2b494', '#ad9e7e', '#93876d'];

  for (let row = 0; row < rows; row++) {
    const rowOffset = row % 2 === 0 ? 0 : cellW / 2;
    for (let col = 0; col < cols; col++) {
      const cx = col * cellW + rowOffset + cellW / 2;
      const cy = row * cellH + cellH / 2;
      paintCobblestone(ctx, size, cx, cy, cellW, cellH, stoneColors);
    }
  }

  return makeTexture(canvas, 5);
}
