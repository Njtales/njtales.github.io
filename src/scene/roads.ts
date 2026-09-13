import * as THREE from 'three';
import { GATE_POSITION, ZONES, getZone } from '../data/zones';

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
  [P.work, P.projects],
  [P.work, P.skills],
  [P.skills, P.contact],
];

// A simple dirt footpath now, not a paved road — narrower, no lane paint, no
// hard outline border (a worn trail through grass doesn't have architectural
// edges the way a street does).
export const ROAD_WIDTH = 2.0;
const pathMat = new THREE.MeshStandardMaterial({ color: 0xc9a876, roughness: 1, metalness: 0 });

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

function buildPathSegment(a: Point, b: Point): THREE.Group {
  const group = new THREE.Group();
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const dirX = dx / length;
  const dirZ = dz / length;

  const pullA = pullback(a);
  const pullB = pullback(b);
  const start = { x: a.x + dirX * pullA, z: a.z + dirZ * pullA };
  const end = { x: b.x - dirX * pullB, z: b.z - dirZ * pullB };
  const trimmedLength = length - pullA - pullB;
  if (trimmedLength <= 0.5) return group; // buildings too close together to leave a visible path

  const angle = Math.atan2(dz, dx);
  const midX = (start.x + end.x) / 2;
  const midZ = (start.z + end.z) / 2;

  const fill = new THREE.Mesh(new THREE.PlaneGeometry(trimmedLength, ROAD_WIDTH), pathMat);
  fill.rotation.x = -Math.PI / 2;
  fill.rotation.z = -angle;
  fill.position.set(midX, 0.006, midZ);
  fill.receiveShadow = true;
  group.add(fill);

  // Rounded caps at both (trimmed) ends so segments blend smoothly where
  // several meet at a zone, instead of showing sharp rectangular corners.
  for (const p of [start, end]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(ROAD_WIDTH / 2, 24), pathMat);
    cap.rotation.x = -Math.PI / 2;
    cap.position.set(p.x, 0.006, p.z);
    group.add(cap);
  }

  return group;
}

export function buildRoads(scene: THREE.Scene) {
  const group = new THREE.Group();
  for (const [a, b] of ROAD_SEGMENTS) {
    group.add(buildPathSegment(a, b));
  }
  scene.add(group);
}
