import * as THREE from 'three';
import { ZONES, GATE_POSITION, type Zone } from '../data/zones';

function shadeColor(hex: string, factor: number): THREE.Color {
  const c = new THREE.Color(hex);
  c.multiplyScalar(factor);
  return c;
}

/** A row of small emissive window quads on one vertical face of a building. */
function addWindows(
  group: THREE.Group,
  faceWidth: number,
  height: number,
  rotationY: number,
  offset: number,
) {
  const rows = Math.max(1, Math.floor((height - 1.5) / 1.6));
  const cols = Math.max(1, Math.floor(faceWidth / 1.4));
  const winMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c9,
    emissive: new THREE.Color(0xffcf7a),
    emissiveIntensity: 1.4,
  });
  const winGeo = new THREE.PlaneGeometry(0.55, 0.7);

  for (let r = 0; r < rows; r++) {
    for (let cCol = 0; cCol < cols; cCol++) {
      if (Math.random() < 0.18) continue; // a few dark windows for variety
      const win = new THREE.Mesh(winGeo, winMat);
      const x = (cCol - (cols - 1) / 2) * 1.4;
      const y = 1.1 + r * 1.6;
      win.position.set(x, y, offset);
      win.rotation.y = rotationY;
      group.add(win);
    }
  }
}

function buildBuilding(zone: Zone): THREE.Group {
  const group = new THREE.Group();
  const { width, depth, height } = zone.footprint;

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const top = new THREE.MeshStandardMaterial({ color: shadeColor(zone.accentColor, 1.1), roughness: 0.65 });
  const side = new THREE.MeshStandardMaterial({ color: shadeColor(zone.accentColor, 0.5), roughness: 0.8 });
  const sideDark = new THREE.MeshStandardMaterial({ color: shadeColor(zone.accentColor, 0.36), roughness: 0.85 });

  // Face order: +x, -x, +y (top), -y (bottom), +z, -z
  const materials = [side, sideDark, top, sideDark, side, sideDark];
  const body = new THREE.Mesh(geometry, materials);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Roof parapet — a slightly larger, darker slab capping the building.
  const parapet = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.4, 0.35, depth + 0.4),
    new THREE.MeshStandardMaterial({ color: shadeColor(zone.accentColor, 0.3), roughness: 0.9 }),
  );
  parapet.position.y = height + 0.18;
  parapet.castShadow = true;
  group.add(parapet);

  // Windows on the two faces most visible from the fixed isometric angle.
  addWindows(group, width, height, 0, depth / 2 + 0.02);
  addWindows(group, depth, height, Math.PI / 2, width / 2 + 0.02);

  // Entrance door — dark inset at ground level on the south-facing wall.
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(1.1, width * 0.3), 1.7),
    new THREE.MeshStandardMaterial({ color: 0x120e17, roughness: 0.9 }),
  );
  door.position.set(0, 0.85, depth / 2 + 0.03);
  group.add(door);

  // Signboard — a small accent-colored plaque above the door, market-street style.
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(width * 0.7, 3.4), 0.6),
    new THREE.MeshStandardMaterial({
      color: shadeColor(zone.accentColor, 1.3),
      emissive: new THREE.Color(zone.accentColor),
      emissiveIntensity: 0.35,
    }),
  );
  sign.position.set(0, Math.min(height - 0.6, 2.6), depth / 2 + 0.03);
  group.add(sign);

  // Beacon glow above the roof — brighter for the Station and the Skill Tower landmark.
  const beaconIntensity = zone.id === 'contact' ? 1.4 : zone.id === 'skills' ? 1.1 : 0.5;
  const beacon = new THREE.PointLight(zone.accentColor, beaconIntensity, zone.id === 'skills' ? 40 : 14);
  beacon.position.y = height + 1.8;
  group.add(beacon);

  const beaconDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    new THREE.MeshBasicMaterial({ color: zone.accentColor }),
  );
  beaconDot.position.y = height + 1.8;
  group.add(beaconDot);

  group.position.set(zone.position.x, 0, zone.position.z);
  group.userData.zoneId = zone.id;
  return group;
}

function buildLampPost(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x171019, roughness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), poleMat);
  pole.position.y = 1.6;
  pole.castShadow = true;
  group.add(pole);

  const lampGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffcf7a }),
  );
  lampGlow.position.y = 3.25;
  group.add(lampGlow);

  const light = new THREE.PointLight(0xffb877, 0.6, 8);
  light.position.y = 3.25;
  group.add(light);

  group.position.set(x, 0, z);
  return group;
}

function buildTree(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 1.1, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.9 }),
  );
  trunk.position.y = 0.55;
  trunk.castShadow = true;
  group.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.75, 1.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x2f5c46, roughness: 0.85 }),
  );
  canopy.position.y = 1.6;
  canopy.castShadow = true;
  group.add(canopy);

  group.position.set(x, 0, z);
  return group;
}

export function buildTown(scene: THREE.Scene) {
  const groundGeo = new THREE.PlaneGeometry(140, 140);
  // Light matte maroon — flat, no texture, no shine.
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xdcb0a7, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, -35);
  ground.receiveShadow = true;
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

    // A couple of street props flanking each building for life, offset off the road.
    const side = zone.footprint.width / 2 + 2.2;
    scene.add(buildLampPost(zone.position.x + side, zone.position.z + 1.5));
    scene.add(buildTree(zone.position.x - side, zone.position.z - 1.2));
  }
}
