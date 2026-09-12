import { ZONES, GATE_POSITION } from '../data/zones';

/** Soft rectangular bounds derived from every zone position, with a margin. Free-roam within it. */
function computeBounds() {
  const margin = 10;
  const xs = [GATE_POSITION.x, ...ZONES.map((z) => z.position.x)];
  const zs = [GATE_POSITION.z, ...ZONES.map((z) => z.position.z)];
  return {
    minX: Math.min(...xs) - margin,
    maxX: Math.max(...xs) + margin,
    minZ: Math.min(...zs) - margin,
    maxZ: Math.max(...zs) + margin,
  };
}

const BOUNDS = computeBounds();

export function clampToTownBounds(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, x)),
    z: Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, z)),
  };
}
