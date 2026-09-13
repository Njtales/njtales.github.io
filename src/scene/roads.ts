import * as THREE from 'three';
import { GATE_POSITION, ZONES, getZone } from '../data/zones';
import { createPathTexture } from './terrainTextures';

type Point = { x: number; z: number };

const P = {
  gate: GATE_POSITION,
  about: getZone('about').position,
  arcade: getZone('arcade').position,
  sketch: getZone('sketch').position,
  work: getZone('work').position,
  projects: getZone('projects').position,
  skills: getZone('skills').position,
  contact: getZone('contact').position,
};

/** The branching road graph connecting every zone to the Gate. */
export const ROAD_SEGMENTS: [Point, Point][] = [
  [P.gate, P.about],
  [P.about, P.arcade],
  [P.arcade, P.sketch],
  [P.about, P.work],
  [P.work, P.skills],
  [P.work, P.projects],
  [P.projects, P.contact],
];

// A simple dirt footpath now, not a paved road — narrower, no lane paint, no
// hard outline border (a worn trail through grass doesn't have architectural
// edges the way a street does).
export const ROAD_WIDTH = 2.0;
const pathMat = new THREE.MeshStandardMaterial({ map: createPathTexture(), roughness: 1, metalness: 0 });

function seeded(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * A gently winding polyline between two points (Ghost of Tsushima's map was
 * the reference — paths that curve naturally through the terrain instead of
 * ruler-straight lines). Built as a Catmull-Rom curve through two organically
 * offset control points and sampled into a fixed number of segments;
 * deterministic per segment index so it's stable across reloads instead of
 * reshuffling every time (and so every consumer — rendering, road-distance
 * checks — sees the exact same curve).
 */
function buildCurvePoints(a: Point, b: Point, seedIndex: number): Point[] {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const dirX = dx / length;
  const dirZ = dz / length;
  const perpX = -dirZ;
  const perpZ = dirX;

  const bend = Math.min(length * 0.22, 7);
  const r1 = seeded(seedIndex * 7.13 + 1.7) * 2 - 1;
  const r2 = seeded(seedIndex * 7.13 + 3.1) * 2 - 1;

  const p1 = {
    x: a.x + dirX * length * 0.33 + perpX * bend * r1,
    z: a.z + dirZ * length * 0.33 + perpZ * bend * r1,
  };
  const p2 = {
    x: a.x + dirX * length * 0.66 + perpX * bend * r2,
    z: a.z + dirZ * length * 0.66 + perpZ * bend * r2,
  };

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(a.x, 0, a.z),
    new THREE.Vector3(p1.x, 0, p1.z),
    new THREE.Vector3(p2.x, 0, p2.z),
    new THREE.Vector3(b.x, 0, b.z),
  ]);
  return curve.getPoints(14).map((v) => ({ x: v.x, z: v.z }));
}

/** Every road's sampled curve, computed once and shared by rendering and every
 * distance-to-road query (rock placement, terrain flattening) so they all
 * agree on where the path actually is. */
export const ROAD_POLYLINES: Point[][] = ROAD_SEGMENTS.map(([a, b], i) => buildCurvePoints(a, b, i));

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

export function distanceToNearestRoad(x: number, z: number): number {
  let min = Infinity;
  for (const line of ROAD_POLYLINES) {
    for (let i = 0; i < line.length - 1; i++) {
      min = Math.min(min, distanceToSegment(x, z, line[i].x, line[i].z, line[i + 1].x, line[i + 1].z));
    }
  }
  return min;
}

/**
 * How far a path should stop short of this point if it's a building — the
 * path used to run all the way to each zone's exact center, the same point
 * the building itself is centered on, so visually it looked like the path
 * ran straight into (and disappeared under) the building instead of
 * stopping at its edge. The gate is deliberately excluded: the path should
 * continue fully through its archway, not stop short of it.
 */
function pullback(p: Point): number {
  if (p.x === GATE_POSITION.x && p.z === GATE_POSITION.z) return 0;
  const zone = ZONES.find((z) => z.position.x === p.x && z.position.z === p.z);
  return zone ? Math.max(zone.footprint.width, zone.footprint.depth) / 2 + 0.4 : 0;
}

function buildCurvedPath(a: Point, b: Point, points: Point[]): THREE.Group {
  const group = new THREE.Group();
  const clearA = pullback(a);
  const clearB = pullback(b);

  // Cumulative distance along the sampled curve from its start. Cutting by
  // this instead of raw distance-to-endpoint per segment guarantees a single
  // contiguous kept range: with a curvy path, a segment's midpoint can drift
  // back inside a building's clearance radius after already having left it,
  // which culled non-contiguous ranges and left an isolated "island" segment
  // (a lone quad + rounded joints) floating mid-path, disconnected from the
  // road on both sides.
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z));
  }
  const total = cum[cum.length - 1];
  const startCut = clearA;
  const endCut = total - clearB;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (cum[i + 1] <= startCut || cum[i] >= endCut) continue;

    const midX = (p0.x + p1.x) / 2;
    const midZ = (p0.z + p1.z) / 2;
    const dx = p1.x - p0.x;
    const dz = p1.z - p0.z;
    const segLength = Math.hypot(dx, dz);
    if (segLength < 0.01) continue;
    const angle = Math.atan2(dz, dx);

    // Slight length overlap so consecutive curve segments don't show hairline
    // gaps at the bend points, plus a small round joint to smooth the bend.
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(segLength + 0.15, ROAD_WIDTH), pathMat);
    fill.rotation.x = -Math.PI / 2;
    fill.rotation.z = -angle;
    fill.position.set(midX, 0.006, midZ);
    fill.receiveShadow = true;
    group.add(fill);

    const joint = new THREE.Mesh(new THREE.CircleGeometry(ROAD_WIDTH / 2, 16), pathMat);
    joint.rotation.x = -Math.PI / 2;
    joint.position.set(p1.x, 0.006, p1.z);
    group.add(joint);
  }

  return group;
}

export function buildRoads(scene: THREE.Scene) {
  const group = new THREE.Group();
  ROAD_SEGMENTS.forEach(([a, b], i) => {
    group.add(buildCurvedPath(a, b, ROAD_POLYLINES[i]));
  });
  scene.add(group);
}
