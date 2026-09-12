import * as THREE from 'three';
import { ZONES, GATE_POSITION, type Zone } from '../data/zones';

function shadeColor(hex: string, factor: number): THREE.Color {
  const c = new THREE.Color(hex);
  c.multiplyScalar(factor);
  return c;
}

function buildBuilding(zone: Zone): THREE.Group {
  const group = new THREE.Group();
  const { width, depth, height } = zone.footprint;

  const geometry = new THREE.BoxGeometry(width, height, depth);
  // Face order in BoxGeometry: +x, -x, +y (top), -y (bottom), +z, -z
  const top = new THREE.MeshStandardMaterial({ color: shadeColor(zone.accentColor, 1.15), roughness: 0.6 });
  const side = new THREE.MeshStandardMaterial({ color: shadeColor(zone.accentColor, 0.55), roughness: 0.75 });
  const sideDark = new THREE.MeshStandardMaterial({ color: shadeColor(zone.accentColor, 0.4), roughness: 0.8 });

  const materials = [side, sideDark, top, sideDark, side, sideDark];
  const mesh = new THREE.Mesh(geometry, materials);
  mesh.position.y = height / 2;
  mesh.castShadow = false;
  group.add(mesh);

  // Beacon glow above the roof — brighter for the Station and the Skill Tower landmark.
  const beaconIntensity = zone.id === 'contact' ? 1.4 : zone.id === 'skills' ? 1.1 : 0.5;
  const beacon = new THREE.PointLight(zone.accentColor, beaconIntensity, zone.id === 'skills' ? 40 : 14);
  beacon.position.y = height + 1.5;
  group.add(beacon);

  const beaconDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    new THREE.MeshBasicMaterial({ color: zone.accentColor }),
  );
  beaconDot.position.y = height + 1.5;
  group.add(beaconDot);

  group.position.set(zone.position.x, 0, zone.position.z);
  group.userData.zoneId = zone.id;
  return group;
}

export function buildTown(scene: THREE.Scene) {
  const groundGeo = new THREE.PlaneGeometry(140, 140);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1420, roughness: 1 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, -35);
  scene.add(ground);

  // Gate marker — a simple ring on the ground at the spawn point, no building.
  const gateRing = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.8, 32),
    new THREE.MeshBasicMaterial({ color: 0xf2ac4a, side: THREE.DoubleSide, transparent: true, opacity: 0.6 }),
  );
  gateRing.rotation.x = -Math.PI / 2;
  gateRing.position.set(GATE_POSITION.x, 0.02, GATE_POSITION.z);
  scene.add(gateRing);

  for (const zone of ZONES) {
    scene.add(buildBuilding(zone));
  }
}
