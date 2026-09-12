import * as THREE from 'three';
import { GATE_POSITION, getZone } from '../data/zones';
import { createAsphaltTexture } from './textures';

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

const ROAD_WIDTH = 3.2;
const CURB_WIDTH = 0.25;
const asphaltTexture = createAsphaltTexture();

function buildRoadBed(a: Point, b: Point): THREE.Group {
  const group = new THREE.Group();
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const midX = (a.x + b.x) / 2;
  const midZ = (a.z + b.z) / 2;

  const tex = asphaltTexture.clone();
  tex.needsUpdate = true;
  tex.repeat.set(length / 3, ROAD_WIDTH / 3);
  const bedMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(length, ROAD_WIDTH), bedMat);
  bed.rotation.x = -Math.PI / 2;
  bed.rotation.z = -angle;
  bed.position.set(midX, 0.005, midZ);
  bed.receiveShadow = true;
  group.add(bed);

  const curbMat = new THREE.MeshStandardMaterial({ color: 0x352b3f, roughness: 0.8 });
  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(length, 0.18, CURB_WIDTH), curbMat);
    const offsetX = -Math.sin(angle) * (ROAD_WIDTH / 2 + CURB_WIDTH / 2);
    const offsetZ = Math.cos(angle) * (ROAD_WIDTH / 2 + CURB_WIDTH / 2);
    curb.rotation.y = -angle;
    curb.position.set(midX + offsetX * side, 0.09, midZ + offsetZ * side);
    curb.castShadow = true;
    group.add(curb);
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
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf2ac4a,
    emissive: new THREE.Color(0xf2ac4a),
    emissiveIntensity: 0.9,
  });
  const tickGeo = new THREE.BoxGeometry(tickLength, 0.03, 0.14);

  for (let i = 0; i < count; i++) {
    const dist = i * step + tickLength / 2;
    const tick = new THREE.Mesh(tickGeo, mat);
    tick.position.set(a.x + dirX * dist, 0.03, a.z + dirZ * dist);
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
