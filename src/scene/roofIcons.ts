import * as THREE from 'three';
import type { ZoneId } from '../data/zones';

/** Draws the same silhouette used in the legend, rasterized for a roof-mounted sign. */
function drawIcon(ctx: CanvasRenderingContext2D, id: ZoneId, size: number) {
  const c = size / 14; // legend icons were authored on a 14-unit grid
  ctx.save();
  ctx.scale(c, c);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (id) {
    case 'about': // storefront
      ctx.beginPath();
      ctx.moveTo(1.5, 5);
      ctx.lineTo(2.5, 1.5);
      ctx.lineTo(11.5, 1.5);
      ctx.lineTo(12.5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(2, 6.5, 10, 5.5);
      break;
    case 'arcade': { // game controller
      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };
      roundRect(1, 4.5, 12, 5.5, 2.5);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(9.4, 6.3, 0.9, 0, Math.PI * 2);
      ctx.arc(11, 7.8, 0.9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sketch': // pencil
      ctx.beginPath();
      ctx.moveTo(2, 12);
      ctx.lineTo(2.8, 9);
      ctx.lineTo(9.5, 2.3);
      ctx.lineTo(11.7, 4.5);
      ctx.lineTo(4.9, 11.2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'work': // briefcase
      ctx.fillRect(1, 5, 12, 7);
      ctx.beginPath();
      ctx.moveTo(5, 5);
      ctx.lineTo(5, 3.3);
      ctx.arcTo(5, 2.3, 6, 2.3, 1);
      ctx.lineTo(8, 2.3);
      ctx.arcTo(9, 2.3, 9, 3.3, 1);
      ctx.lineTo(9, 5);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = ctx.fillStyle as string;
      ctx.stroke();
      break;
    case 'projects': { // wrench
      ctx.beginPath();
      ctx.arc(7.9, 3.1, 2.2, Math.PI * 1.15, Math.PI * 2.55);
      ctx.arc(3.5, 8.5, 2, Math.PI * 0.25, Math.PI * 1.6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'skills': // tower
      ctx.fillRect(6, 1.5, 2, 2);
      ctx.beginPath();
      ctx.moveTo(5, 3.5);
      ctx.lineTo(9, 3.5);
      ctx.lineTo(10, 11.5);
      ctx.lineTo(4, 11.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(3, 11.5, 8, 1.3);
      break;
    case 'contact': // map pin
      ctx.beginPath();
      ctx.moveTo(7, 1);
      ctx.bezierCurveTo(4.8, 1, 3, 2.8, 3, 5);
      ctx.bezierCurveTo(3, 8.2, 7, 13, 7, 13);
      ctx.bezierCurveTo(7, 13, 11, 8.2, 11, 5);
      ctx.bezierCurveTo(11, 2.8, 9.2, 1, 7, 1);
      ctx.closePath();
      ctx.fill();
      break;
  }
  ctx.restore();
}

/** A roof-mounted icon sign, matching the legend's per-zone symbol so buildings are identifiable from above. */
export function createRoofIconTexture(id: ZoneId, color: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  const margin = size * 0.18;
  ctx.translate(margin, margin);
  drawIcon(ctx, id, size - margin * 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A shop-sign texture: the zone's title in dark lettering on its accent color. */
export function createSignTexture(title: string, accentColor: string): THREE.Texture {
  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#171019';
  ctx.font = 'bold 60px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, height / 2 + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
