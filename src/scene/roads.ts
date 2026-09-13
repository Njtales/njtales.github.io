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

export const ROAD_WIDTH = 3.2;
const OUTLINE_WIDTH = 0.12;

// Warm, muted tones close in value to both the fill and the maroon ground, so the
// road's edge reads as a soft border rather than a hard-contrast line.
// Warm sandy-dirt tones — read as a worn path cutting through the grass,
// rather than a paved grey road (which is what these were tuned for against
// the earlier maroon-soil ground).
const outlineMat = new THREE.MeshStandardMaterial({ color: 0x8a7355, roughness: 1, metalness: 0 });
const fillMat = new THREE.MeshStandardMaterial({ color: 0xc9a876, roughness: 1, metalness: 0 });
const paintMat = new THREE.MeshStandardMaterial({ color: 0xe8d9b0, roughness: 1, metalness: 0 });

function buildRoadBed(a: Point, b: Point): THREE.Group {
  const group = new THREE.Group();
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const midX = (a.x + b.x) / 2;
  const midZ = (a.z + b.z) / 2;

  // Flat matte fill with a slightly larger, darker underlay peeking out — a simple
  // "outline" effect without needing an edge-detection shader.
  const outline = new THREE.Mesh(
    new THREE.PlaneGeometry(length + OUTLINE_WIDTH * 2, ROAD_WIDTH + OUTLINE_WIDTH * 2),
    outlineMat,
  );
  outline.rotation.x = -Math.PI / 2;
  outline.rotation.z = -angle;
  outline.position.set(midX, 0.004, midZ);
  outline.receiveShadow = true;
  group.add(outline);

  const fill = new THREE.Mesh(new THREE.PlaneGeometry(length, ROAD_WIDTH), fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.rotation.z = -angle;
  fill.position.set(midX, 0.006, midZ);
  fill.receiveShadow = true;
  group.add(fill);

  // Rounded caps at both ends soften the rectangle's sharp corners, and blend
  // smoothly into each other where multiple road segments meet at a zone.
  for (const p of [a, b]) {
    const outlineCap = new THREE.Mesh(
      new THREE.CircleGeometry(ROAD_WIDTH / 2 + OUTLINE_WIDTH, 24),
      outlineMat,
    );
    outlineCap.rotation.x = -Math.PI / 2;
    outlineCap.position.set(p.x, 0.004, p.z);
    group.add(outlineCap);

    const fillCap = new THREE.Mesh(new THREE.CircleGeometry(ROAD_WIDTH / 2, 24), fillMat);
    fillCap.rotation.x = -Math.PI / 2;
    fillCap.position.set(p.x, 0.006, p.z);
    group.add(fillCap);
  }

  return group;
}

function buildLaneMarkings(a: Point, b: Point): THREE.Group {
  const group = new THREE.Group();
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const dirX = dx / length;
  const dirZ = dz / length;

  const tickLength = 0.9;
  const gap = 0.6;
  const step = tickLength + gap;
  const count = Math.floor(length / step);
  const tickGeo = new THREE.BoxGeometry(tickLength, 0.02, 0.14);

  for (let i = 0; i < count; i++) {
    const dist = i * step + tickLength / 2;
    const tick = new THREE.Mesh(tickGeo, paintMat);
    tick.position.set(a.x + dirX * dist, 0.02, a.z + dirZ * dist);
    tick.rotation.y = -angle;
    group.add(tick);
  }

  return group;
}

export function buildRoads(scene: THREE.Scene) {
  const group = new THREE.Group();
  for (const [a, b] of ROAD_SEGMENTS) {
    group.add(buildRoadBed(a, b));
    group.add(buildLaneMarkings(a, b));
  }
  scene.add(group);
}
