import { ZONES, GATE_POSITION } from '../data/zones';
import { ROAD_POLYLINES } from '../scene/roads';

const MARGIN = 10;

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  constructor(container: HTMLElement) {
    const wrapper = document.createElement('div');
    wrapper.id = 'minimap';
    this.canvas = document.createElement('canvas');
    this.canvas.width = 150;
    this.canvas.height = 150;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    wrapper.appendChild(this.canvas);
    container.appendChild(wrapper);

    this.ctx = this.canvas.getContext('2d')!;

    const xs = [GATE_POSITION.x, ...ZONES.map((z) => z.position.x)];
    const zs = [GATE_POSITION.z, ...ZONES.map((z) => z.position.z)];
    this.bounds = {
      minX: Math.min(...xs) - MARGIN,
      maxX: Math.max(...xs) + MARGIN,
      minZ: Math.min(...zs) - MARGIN,
      maxZ: Math.max(...zs) + MARGIN,
    };
  }

  private toCanvas(x: number, z: number): [number, number] {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    const px = ((x - minX) / (maxX - minX)) * this.canvas.width;
    const py = ((z - minZ) / (maxZ - minZ)) * this.canvas.height;
    return [px, py];
  }

  update(playerX: number, playerZ: number) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Roads, drawn beneath the zone dots so the map reads as a connected
    // network rather than a scatter of unrelated points. Follows the same
    // curved polylines as the actual 3D paths, not a straight-line guess.
    ctx.strokeStyle = 'rgba(245, 239, 230, 0.35)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const line of ROAD_POLYLINES) {
      ctx.beginPath();
      line.forEach((p, i) => {
        const [x, y] = this.toCanvas(p.x, p.z);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    const [gx, gy] = this.toCanvas(GATE_POSITION.x, GATE_POSITION.z);
    ctx.fillStyle = '#f2ac4a';
    ctx.beginPath();
    ctx.arc(gx, gy, 3, 0, Math.PI * 2);
    ctx.fill();

    for (const zone of ZONES) {
      const [x, y] = this.toCanvas(zone.position.x, zone.position.z);
      ctx.fillStyle = zone.accentColor;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const [px, py] = this.toCanvas(playerX, playerZ);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
