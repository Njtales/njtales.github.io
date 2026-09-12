import { ZONES, GATE_POSITION } from '../data/zones';
import { GATE_BLOCK_WIDTH, GATE_BLOCK_DEPTH, GATE_OPENING_WIDTH } from '../scene/town';

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

interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Half the character's footprint — how close its center can get to a solid edge. */
const CHARACTER_RADIUS = 0.4;

function buildSolidRects(): Rect[] {
  const rects: Rect[] = ZONES.map((zone) => ({
    minX: zone.position.x - zone.footprint.width / 2 - CHARACTER_RADIUS,
    maxX: zone.position.x + zone.footprint.width / 2 + CHARACTER_RADIUS,
    minZ: zone.position.z - zone.footprint.depth / 2 - CHARACTER_RADIUS,
    maxZ: zone.position.z + zone.footprint.depth / 2 + CHARACTER_RADIUS,
  }));

  // The India Gate arch is one solid mass with an archway hole through the
  // middle — model it as its two solid "legs" either side of the opening,
  // so the road can still pass freely through the gap between them.
  const legHalfWidth = (GATE_BLOCK_WIDTH / 2 - GATE_OPENING_WIDTH / 2) / 2;
  const legCenterOffset = GATE_OPENING_WIDTH / 2 + legHalfWidth;
  const legHalfDepth = GATE_BLOCK_DEPTH / 2 + CHARACTER_RADIUS;
  for (const side of [-1, 1]) {
    rects.push({
      minX: GATE_POSITION.x + side * legCenterOffset - legHalfWidth - CHARACTER_RADIUS,
      maxX: GATE_POSITION.x + side * legCenterOffset + legHalfWidth + CHARACTER_RADIUS,
      minZ: GATE_POSITION.z - legHalfDepth,
      maxZ: GATE_POSITION.z + legHalfDepth,
    });
  }

  return rects;
}

const SOLID_RECTS = buildSolidRects();

/**
 * Pushes (x, z) out to the nearest edge of any solid rectangle (a building
 * footprint or a gate leg) it currently overlaps. Simple point-vs-AABB
 * resolution — fine for a small, static set of rectangles checked once a
 * frame; there's no need for anything more general in a town this size.
 */
export function resolveBuildingCollisions(x: number, z: number): { x: number; z: number } {
  for (const rect of SOLID_RECTS) {
    if (x <= rect.minX || x >= rect.maxX || z <= rect.minZ || z >= rect.maxZ) continue;

    const distLeft = x - rect.minX;
    const distRight = rect.maxX - x;
    const distTop = z - rect.minZ;
    const distBottom = rect.maxZ - z;
    const closest = Math.min(distLeft, distRight, distTop, distBottom);

    if (closest === distLeft) x = rect.minX;
    else if (closest === distRight) x = rect.maxX;
    else if (closest === distTop) z = rect.minZ;
    else z = rect.maxZ;
  }
  return { x, z };
}
