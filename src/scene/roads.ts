import * as THREE from 'three';
import { GATE_POSITION, getZone } from '../data/zones';

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

function buildPathSegment(a: Point, b: Point): THREE.Group {
  const group = new THREE.Group();
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const midX = (a.x + b.x) / 2;
  const midZ = (a.z + b.z) / 2;

  const fill = new THREE.Mesh(new THREE.PlaneGeometry(length, ROAD_WIDTH), pathMat);
  fill.rotation.x = -Math.PI / 2;
  fill.rotation.z = -angle;
  fill.position.set(midX, 0.006, midZ);
  fill.receiveShadow = true;
  group.add(fill);

  // Rounded caps at both ends so segments blend smoothly where several meet
  // at a zone, instead of showing sharp rectangular corners.
  for (const p of [a, b]) {
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
