import * as THREE from 'three';
import { ZONES, GATE_POSITION, type Zone } from '../data/zones';
import { ROAD_SEGMENTS } from './roads';

function shadeColor(hex: string, factor: number): THREE.Color {
  const c = new THREE.Color(hex);
  c.multiplyScalar(factor);
  return c;
}

const winMat = new THREE.MeshStandardMaterial({
  color: 0xecd0a0,
  emissive: new THREE.Color(0xe0a868),
  emissiveIntensity: 0.75,
});
const winGeo = new THREE.PlaneGeometry(0.55, 0.7);

const ROW_SPACING = 1.6;
const ROOF_MARGIN = 0.65;

/**
 * A grid of small emissive window quads on one vertical face of a building.
 * `axis` is which world axis is the face's FIXED normal offset ('z' for the
 * south/front face, 'x' for the east/side face) — the along-face spread
 * always goes on the other axis. Getting this wrong (varying the wrong
 * coordinate while the offset stays fixed) is what made the side face's
 * windows float diagonally off the building instead of sitting flush on it.
 * `floorStartY` lets the caller keep the ground-floor band clear on faces
 * that also carry the door + signboard, so windows never overlap them.
 */
function addWindows(
  group: THREE.Group,
  faceWidth: number,
  height: number,
  axis: 'z' | 'x',
  offset: number,
  floorStartY: number,
) {
  const cols = Math.max(1, Math.floor(faceWidth / 1.4));
  const rows = Math.max(0, Math.floor((height - ROOF_MARGIN - floorStartY) / ROW_SPACING) + 1);
  // Randomly-dark windows read as "a few lights off" on a tall, dense
  // building, but just look broken on a small one with only a handful of
  // windows total — so only randomize once there's enough of a grid for it.
  const allowDarkWindows = rows * cols >= 6;

  for (let y = floorStartY; y <= height - ROOF_MARGIN; y += ROW_SPACING) {
    for (let cCol = 0; cCol < cols; cCol++) {
      if (allowDarkWindows && Math.random() < 0.18) continue;
      const win = new THREE.Mesh(winGeo, winMat);
      const along = (cCol - (cols - 1) / 2) * 1.4;
      if (axis === 'z') {
        win.position.set(along, y, offset);
        win.rotation.y = 0;
      } else {
        win.position.set(offset, y, along);
        win.rotation.y = Math.PI / 2;
      }
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
  // The front face carries the door + signboard, so its windows start well
  // above them (3.0) instead of at ground level, or the two would overlap.
  addWindows(group, width, height, 'z', depth / 2 + 0.02, 3.0);
  addWindows(group, depth, height, 'x', width / 2 + 0.02, 1.1);

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

const ROCK_COLORS = [0xb08f86, 0x9c7d74, 0xc4a196, 0xa88a7f];

function buildRock(x: number, z: number, scale: number): THREE.Mesh {
  const color = ROCK_COLORS[Math.floor(Math.random() * ROCK_COLORS.length)];
  const rock = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32 * scale, 0),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
  );
  rock.position.set(x, 0.15 * scale, z);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

/** Scatters small rocks across the empty ground — otherwise a lot of flat, empty
 * space between zones that reads as bare rather than an intentionally built town. */
function scatterRocks(scene: THREE.Scene) {
  const clearPoints = [GATE_POSITION, ...ZONES.map((z) => z.position)];
  let placed = 0;
  let attempts = 0;
  while (placed < 45 && attempts < 900) {
    attempts++;
    const x = THREE.MathUtils.randFloat(-32, 34);
    const z = THREE.MathUtils.randFloat(-86, 8);
    if (distanceToNearestRoad(x, z) < 2.4) continue;
    if (clearPoints.some((p) => Math.hypot(x - p.x, z - p.z) < 7.5)) continue;
    scene.add(buildRock(x, z, THREE.MathUtils.randFloat(0.6, 1.7)));
    placed++;
  }
}

const ROAD_CLEARANCE = 1.9; // half road width (1.6) + outline + a small margin

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function distanceToNearestRoad(x: number, z: number): number {
  let min = Infinity;
  for (const [a, b] of ROAD_SEGMENTS) {
    min = Math.min(min, distanceToSegment(x, z, a.x, a.z, b.x, b.z));
  }
  return min;
}

/**
 * Picks offsets around a zone for street props, ranked by clearance from
 * every road segment — a fixed left/right split (the earlier approach) put
 * Arcade Corner's lamp post almost exactly on the road, since it didn't
 * account for which direction the connecting roads actually run.
 */
function pickPropOffsets(zone: Zone, count: number): { x: number; z: number }[] {
  const clearance = Math.max(zone.footprint.width, zone.footprint.depth) / 2 + 2.2;
  const candidates = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const x = Math.cos(rad) * clearance;
    const z = Math.sin(rad) * clearance;
    return { x, z, dist: distanceToNearestRoad(zone.position.x + x, zone.position.z + z) };
  });
  candidates.sort((a, b) => b.dist - a.dist);
  return candidates.filter((c) => c.dist >= ROAD_CLEARANCE).slice(0, count);
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

    // Street props flanking each building, placed wherever is clearest of the roads.
    const [lampOffset, treeOffset] = pickPropOffsets(zone, 2);
    if (lampOffset) scene.add(buildLampPost(zone.position.x + lampOffset.x, zone.position.z + lampOffset.z));
    if (treeOffset) scene.add(buildTree(zone.position.x + treeOffset.x, zone.position.z + treeOffset.z));
  }

  scatterRocks(scene);
}
