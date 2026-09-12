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

const ROAD_WIDTH = 3.2;

function buildRoadBed(a: Point, b: Point): THREE.Mesh {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);

  const geometry = new THREE.PlaneGeometry(length, ROAD_WIDTH);
  const material = new THREE.MeshStandardMaterial({ color: 0x211a28, roughness: 0.95 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -angle;
  mesh.position.set((a.x + b.x) / 2, 0.005, (a.z + b.z) / 2);
  return mesh;
}

function buildLaneMarking(a: Point, b: Point): THREE.Line {
  const points = [new THREE.Vector3(a.x, 0.03, a.z), new THREE.Vector3(b.x, 0.03, b.z)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: 0xf2ac4a,
    dashSize: 0.9,
    gapSize: 0.6,
    transparent: true,
    opacity: 0.7,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
}

export function buildRoads(scene: THREE.Scene) {
  const group = new THREE.Group();
  for (const [a, b] of ROAD_SEGMENTS) {
    group.add(buildRoadBed(a, b));
    group.add(buildLaneMarking(a, b));
  }
  scene.add(group);
}
