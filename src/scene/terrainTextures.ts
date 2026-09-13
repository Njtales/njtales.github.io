import * as THREE from 'three';

/**
 * Paints one organic "clump" — several overlapping circles fused into a
 * single filled shape (not a checklist of perfect circles), with a slightly
 * larger copy painted first in an edge color as a halo so the clump reads as
 * outlined, cartoon-game-tile style, instead of the polka-dot look plain
 * radial-gradient circles gave. Stamped at all 9 tile-wrap offsets so it
 * still tiles seamlessly (RepeatWrapping otherwise shows the repeat
 * boundary as a hard seam).
 */
function paintClump(
  ctx: CanvasRenderingContext2D,
  size: number,
  baseX: number,
  baseY: number,
  fillColor: string,
  edgeColor: string,
  scale: number,
) {
  const bumps = 5;
  const baseR = (10 + Math.random() * 16) * scale;
  const angles = Array.from({ length: bumps }, () => Math.random() * Math.PI * 2);
  const radii = Array.from({ length: bumps }, () => baseR * (0.55 + Math.random() * 0.4));
  const centerR = baseR * 0.65;
  const extent = baseR * 1.9;

  const paintAt = (cx: number, cy: number, mult: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let b = 0; b < bumps; b++) {
      const bx = cx + Math.cos(angles[b]) * baseR * 0.5;
      const by = cy + Math.sin(angles[b]) * baseR * 0.5;
      const r = radii[b] * mult;
      ctx.moveTo(bx + r, by);
      ctx.arc(bx, by, r, 0, Math.PI * 2);
    }
    const rc = centerR * mult;
    ctx.moveTo(cx + rc, cy);
    ctx.arc(cx, cy, rc, 0, Math.PI * 2);
    ctx.fill();
  };

  for (const dx of [-size, 0, size]) {
    for (const dy of [-size, 0, size]) {
      const cx = baseX + dx;
      const cy = baseY + dy;
      if (cx + extent < 0 || cx - extent > size || cy + extent < 0 || cy - extent > size) continue;
      paintAt(cx, cy, 1.18, edgeColor);
      paintAt(cx, cy, 1.0, fillColor);
    }
  }
}

function makeTexture(canvas: HTMLCanvasElement, repeat: number): THREE.Texture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Mossy, clumpy grass — outlined color clumps over a flat base, closer to a
 * painted stylized game tile than a photo-real texture. */
export function createGrassTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6fae4a';
  ctx.fillRect(0, 0, size, size);

  const edgeColor = '#3f6b2e';
  const clumpColors = ['#5f9a3f', '#7dbb57', '#67a844', '#8bc465'];
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = clumpColors[Math.floor(Math.random() * clumpColors.length)];
    paintClump(ctx, size, x, y, color, edgeColor, 0.9 + Math.random() * 1.1);
  }

  return makeTexture(canvas, 7);
}

/** Cracked-earth dirt path — same clumpy-outlined-tile approach, warm tones,
 * plus a few thin darker crack lines for texture. */
export function createPathTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c9a876';
  ctx.fillRect(0, 0, size, size);

  const edgeColor = '#8a6f4a';
  const clumpColors = ['#b8935f', '#d4b483', '#a67f4e', '#c2a06e'];
  for (let i = 0; i < 34; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const color = clumpColors[Math.floor(Math.random() * clumpColors.length)];
    paintClump(ctx, size, x, y, color, edgeColor, 1.3 + Math.random() * 1.4);
  }

  ctx.strokeStyle = 'rgba(107, 79, 45, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segments = 3 + Math.floor(Math.random() * 3);
    for (let s = 0; s < segments; s++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return makeTexture(canvas, 5);
}
