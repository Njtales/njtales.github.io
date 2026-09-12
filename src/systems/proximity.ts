import { ZONES, type Zone } from '../data/zones';

/** Returns the nearest zone whose trigger radius contains (x, z), or null if none. */
export function findActiveZone(x: number, z: number): Zone | null {
  let closest: Zone | null = null;
  let closestDist = Infinity;

  for (const zone of ZONES) {
    const dx = x - zone.position.x;
    const dz = z - zone.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= zone.triggerRadius && dist < closestDist) {
      closest = zone;
      closestDist = dist;
    }
  }
  return closest;
}
