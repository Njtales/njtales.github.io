import * as THREE from 'three';
import { ZONES, GATE_POSITION, type Zone } from '../data/zones';
import { ROAD_SEGMENTS, ROAD_WIDTH } from './roads';
import { createRoofIconTexture, createSignTexture } from './roofIcons';

// Shared with systems/collision.ts so the arch's solid legs actually block
// movement (and the opening between them doesn't).
export const GATE_BLOCK_WIDTH = 7.4;
export const GATE_BLOCK_DEPTH = 2.4;
export const GATE_OPENING_WIDTH = 4.2;

function shadeColor(hex: string, factor: number): THREE.Color {
  const c = new THREE.Color(hex);
  c.multiplyScalar(factor);
  return c;
}

// Daytime glass — a pale sky-blue tint reflecting the sky, not a lit-up warm
// glow (which read as nighttime lighting, out of place once the town moved
// to a daytime look).
const winMat = new THREE.MeshStandardMaterial({
  color: 0xbcd9e0,
  roughness: 0.3,
  metalness: 0.1,
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
const IDENTITY_SCALE = new THREE.Vector3(1, 1, 1);
const FACE_Z_ROTATION = new THREE.Quaternion(); // identity — kept for clarity at call sites
const FACE_X_ROTATION = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));

/**
 * Computes transforms for a grid of window instances on one vertical face of
 * a building, in WORLD space (originX/originZ is the building's position) —
 * these all get folded into one InstancedMesh for the whole town rather than
 * one Mesh object per window, since a dense town could otherwise mean
 * several hundred individual window meshes.
 *
 * `axis` is which world axis is the face's FIXED normal offset ('z' for the
 * south/front face, 'x' for the east/side face) — the along-face spread
 * always goes on the other axis. Getting this wrong (varying the wrong
 * coordinate while the offset stays fixed) is what made the side face's
 * windows float diagonally off the building instead of sitting flush on it.
 * `floorStartY` lets the caller keep the ground-floor band clear on faces
 * that also carry the door + signboard, so windows never overlap them.
 */
function computeWindowMatrices(
  originX: number,
  originZ: number,
  faceWidth: number,
  height: number,
  axis: 'z' | 'x',
  offset: number,
  floorStartY: number,
): THREE.Matrix4[] {
  const cols = Math.max(1, Math.floor(faceWidth / 1.4));
  const rows = Math.max(0, Math.floor((height - ROOF_MARGIN - floorStartY) / ROW_SPACING) + 1);
  // Randomly-dark windows read as "a few lights off" on a tall, dense
  // building, but just look broken on a small one with only a handful of
  // windows total — so only randomize once there's enough of a grid for it.
  const allowDarkWindows = rows * cols >= 6;
  const matrices: THREE.Matrix4[] = [];

  for (let y = floorStartY; y <= height - ROOF_MARGIN; y += ROW_SPACING) {
    for (let cCol = 0; cCol < cols; cCol++) {
      if (allowDarkWindows && Math.random() < 0.18) continue;
      const along = (cCol - (cols - 1) / 2) * 1.4;
      const position =
        axis === 'z'
          ? new THREE.Vector3(originX + along, y, originZ + offset)
          : new THREE.Vector3(originX + offset, y, originZ + along);
      const rotation = axis === 'z' ? FACE_Z_ROTATION : FACE_X_ROTATION;
      matrices.push(new THREE.Matrix4().compose(position, rotation, IDENTITY_SCALE));
    }
  }
  return matrices;
}

function buildBuilding(zone: Zone): { group: THREE.Group; windowMatrices: THREE.Matrix4[] } {
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

  // Roof-mounted icon sign, matching the legend's symbol for this zone so
  // buildings are identifiable from above while exploring, not just once
  // the detail panel opens.
  const iconSize = Math.min(width, depth) * 0.55;
  const roofIcon = new THREE.Mesh(
    new THREE.PlaneGeometry(iconSize, iconSize),
    new THREE.MeshBasicMaterial({
      map: createRoofIconTexture(zone.id, zone.accentColor),
      transparent: true,
      depthWrite: false,
    }),
  );
  roofIcon.rotation.x = -Math.PI / 2;
  roofIcon.position.y = height + 0.362;
  group.add(roofIcon);

  // Windows on the two faces most visible from the fixed isometric angle.
  // The front face carries the door + signboard, so its windows start well
  // above them (3.0) instead of at ground level, or the two would overlap.
  const windowMatrices = [
    ...computeWindowMatrices(zone.position.x, zone.position.z, width, height, 'z', depth / 2 + 0.02, 3.0),
    ...computeWindowMatrices(zone.position.x, zone.position.z, depth, height, 'x', width / 2 + 0.02, 1.1),
  ];

  // Entrance door — dark inset at ground level on the south-facing wall.
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(1.1, width * 0.3), 1.7),
    new THREE.MeshStandardMaterial({ color: 0x120e17, roughness: 0.9 }),
  );
  door.position.set(0, 0.85, depth / 2 + 0.03);
  group.add(door);

  // Signboard — a small box (not a flat plane) that actually sticks out from
  // the wall above the door, with the zone's name lettered on its front face.
  const signWidth = Math.min(width * 0.9, 4.6);
  const signMat = new THREE.MeshStandardMaterial({ color: shadeColor(zone.accentColor, 0.55), roughness: 0.7 });
  const signFaceMat = new THREE.MeshBasicMaterial({ map: createSignTexture(zone.title, zone.accentColor) });
  // Face order: +x, -x, +y, -y, +z, -z — only the outward +z face gets the lettering.
  const sign = new THREE.Mesh(new THREE.BoxGeometry(signWidth, 0.68, 0.22), [
    signMat,
    signMat,
    signMat,
    signMat,
    signFaceMat,
    signMat,
  ]);
  sign.position.set(0, Math.min(height - 0.6, 2.6), depth / 2 + 0.17);
  sign.castShadow = true;
  group.add(sign);

  group.position.set(zone.position.x, 0, zone.position.z);
  group.userData.zoneId = zone.id;
  return { group, windowMatrices };
}

function buildLampPost(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x171019, roughness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), poleMat);
  pole.position.y = 1.6;
  pole.castShadow = true;
  group.add(pole);

  // Frosted glass, unlit — the lamp is off during the day. Its own point
  // light was dropped too: dozens of these across the town added up, and
  // a daytime scene doesn't need them lit anyway.
  const lampGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.6 }),
  );
  lampGlow.position.y = 3.25;
  group.add(lampGlow);

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

interface RockPlacement {
  x: number;
  z: number;
  scale: number;
}

/**
 * All rocks — ambient and roadside — collapse into one InstancedMesh instead
 * of one Mesh (and one unique geometry, previously) per rock, since a single
 * shared town could easily scatter 60-80 of them.
 */
function buildRockInstances(scene: THREE.Scene, placements: RockPlacement[]) {
  if (placements.length === 0) return;
  const geo = new THREE.IcosahedronGeometry(0.32, 0); // unit-ish; per-instance scale via the matrix
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95 });
  const mesh = new THREE.InstancedMesh(geo, mat, placements.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const color = new THREE.Color();
  const matrix = new THREE.Matrix4();
  placements.forEach((p, i) => {
    const rotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
    );
    matrix.compose(
      new THREE.Vector3(p.x, 0.15 * p.scale, p.z),
      rotation,
      new THREE.Vector3(p.scale, p.scale, p.scale),
    );
    mesh.setMatrixAt(i, matrix);
    color.setHex(ROCK_COLORS[Math.floor(Math.random() * ROCK_COLORS.length)]);
    mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
}

/** Ambient rocks scattered across the empty ground — otherwise a lot of flat,
 * empty space between zones that reads as bare rather than an intentionally
 * built town. */
function generateAmbientRocks(): RockPlacement[] {
  const clearPoints = [GATE_POSITION, ...ZONES.map((z) => z.position)];
  const placements: RockPlacement[] = [];
  let attempts = 0;
  while (placements.length < 45 && attempts < 900) {
    attempts++;
    const x = THREE.MathUtils.randFloat(-32, 34);
    const z = THREE.MathUtils.randFloat(-86, 8);
    if (distanceToNearestRoad(x, z) < 2.4) continue;
    if (clearPoints.some((p) => Math.hypot(x - p.x, z - p.z) < 7.5)) continue;
    placements.push({ x, z, scale: THREE.MathUtils.randFloat(0.6, 1.7) });
  }
  return placements;
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

// Tight enough that most road segments (many are only 15-25 units end to
// end) still fit at least two lamps — bunting connects consecutive lamps,
// so a segment with only one lamp gets no bunting at all.
const LAMP_SPACING = 6;
const BUNTING_HEIGHT = 3.6;
const BUNTING_FLAG_COUNT = 5;
const FLAG_COLORS = ZONES.map((z) => z.accentColor);

/** One sagging string of small triangular flags between two arbitrary ground points. */
function buildBuntingBetween(p0: { x: number; z: number }, p1: { x: number; z: number }): THREE.Group {
  const group = new THREE.Group();
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= BUNTING_FLAG_COUNT; i++) {
    const t = i / BUNTING_FLAG_COUNT;
    const sag = Math.sin(t * Math.PI) * 0.4;
    points.push(new THREE.Vector3(THREE.MathUtils.lerp(p0.x, p1.x, t), BUNTING_HEIGHT - sag, THREE.MathUtils.lerp(p0.z, p1.z, t)));
  }

  const rope = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x3a2a22 }),
  );
  group.add(rope);

  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.18, -0.24, 0, -0.18, -0.24, 0], 3));
  flagGeo.computeVertexNormals();
  const flagAngle = Math.atan2(p1.x - p0.x, p1.z - p0.z);

  for (let i = 0; i < BUNTING_FLAG_COUNT; i++) {
    const mid = points[i].clone().lerp(points[i + 1], 0.5);
    const color = FLAG_COLORS[i % FLAG_COLORS.length];
    const flag = new THREE.Mesh(
      flagGeo,
      new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.6 }),
    );
    flag.position.copy(mid);
    flag.rotation.y = flagAngle;
    group.add(flag);
  }

  return group;
}

/**
 * Evenly-spaced lamp posts alongside every road, alternating sides, with
 * bunting zigzagging between each CONSECUTIVE real lamp post. Bunting used
 * to span a fixed perpendicular width at each interval instead — since
 * lamps alternate sides, only one end of that span ever landed near an
 * actual post, leaving the other end visibly floating in empty space.
 * Connecting real, consecutive lamp positions guarantees both ends anchor
 * to something, at the cost of a natural zigzag instead of a straight
 * crossing — which reads as more authentic market bunting anyway.
 */
function placeStreetLampsAndBunting(scene: THREE.Scene) {
  for (const [a, b] of ROAD_SEGMENTS) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const dirX = dx / length;
    const dirZ = dz / length;
    const perpX = -dirZ;
    const perpZ = dirX;
    const offset = ROAD_WIDTH / 2 + 0.7;

    const count = Math.floor(length / LAMP_SPACING);
    const lampPositions: { x: number; z: number }[] = [];
    for (let i = 1; i < count; i++) {
      const t = i * LAMP_SPACING;
      const side = i % 2 === 0 ? 1 : -1;
      const pos = { x: a.x + dirX * t + perpX * offset * side, z: a.z + dirZ * t + perpZ * offset * side };
      scene.add(buildLampPost(pos.x, pos.z));
      lampPositions.push(pos);
    }

    for (let i = 0; i < lampPositions.length - 1; i++) {
      scene.add(buildBuntingBetween(lampPositions[i], lampPositions[i + 1]));
    }
  }
}

/** A scattering of small rocks just off the road edges, distinct from the
 * general ambient rocks (which deliberately avoid roads) — these hug the
 * street the way loose stones would in a real market town. */
function generateRoadsideRocks(): RockPlacement[] {
  const clearPoints = [GATE_POSITION, ...ZONES.map((z) => z.position)];
  const placements: RockPlacement[] = [];
  for (const [a, b] of ROAD_SEGMENTS) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    if (length < 6) continue;
    const dirX = dx / length;
    const dirZ = dz / length;
    const perpX = -dirZ;
    const perpZ = dirX;

    const count = Math.round(length / 6);
    for (let i = 0; i < count; i++) {
      const t = THREE.MathUtils.randFloat(3, length - 3);
      const side = Math.random() < 0.5 ? -1 : 1;
      const off = THREE.MathUtils.randFloat(ROAD_WIDTH / 2 + 0.35, ROAD_WIDTH / 2 + 1.7);
      const x = a.x + dirX * t + perpX * off * side;
      const z = a.z + dirZ * t + perpZ * off * side;
      if (clearPoints.some((p) => Math.hypot(x - p.x, z - p.z) < 5)) continue;
      placements.push({ x, z, scale: THREE.MathUtils.randFloat(0.4, 1.0) });
    }
  }
  return placements;
}

/**
 * The town entrance, styled after India Gate: a single monumental sandstone
 * mass with a true arched opening punched through it (not two separate
 * pillars under a floating lintel), with small corner chhatris and a
 * glowing beacon on top. The character spawns standing directly beneath
 * the arch.
 */
function buildGateArch(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xaa5f3d, roughness: 0.92 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xe8d3ab, roughness: 0.8 });
  const blockWidth = GATE_BLOCK_WIDTH;
  const blockHeight = 9.5;
  const blockDepth = GATE_BLOCK_DEPTH;
  const openingWidth = GATE_OPENING_WIDTH; // comfortably wider than the 3.2-wide road
  const archSpringHeight = 5.6; // where the straight sides end and the curve begins

  // The main mass, with a true arched hole punched through it via an
  // extruded shape rather than an assembly of separate pillar/lintel boxes —
  // this is what actually reads as "an arch" instead of "two posts".
  const outline = new THREE.Shape();
  outline.moveTo(-blockWidth / 2, 0);
  outline.lineTo(blockWidth / 2, 0);
  outline.lineTo(blockWidth / 2, blockHeight);
  outline.lineTo(-blockWidth / 2, blockHeight);
  outline.closePath();

  const archHole = new THREE.Path();
  archHole.moveTo(-openingWidth / 2, 0);
  archHole.lineTo(-openingWidth / 2, archSpringHeight);
  archHole.absarc(0, archSpringHeight, openingWidth / 2, Math.PI, 0, true);
  archHole.lineTo(openingWidth / 2, 0);
  archHole.lineTo(-openingWidth / 2, 0);
  outline.holes.push(archHole);

  const blockGeo = new THREE.ExtrudeGeometry(outline, { depth: blockDepth, bevelEnabled: false });
  blockGeo.translate(0, 0, -blockDepth / 2);
  const block = new THREE.Mesh(blockGeo, stoneMat);
  block.castShadow = true;
  block.receiveShadow = true;
  group.add(block);

  const topY = blockHeight;

  // Cream cornice band wrapping the top edge.
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(blockWidth + 0.3, 0.4, blockDepth + 0.3), trimMat);
  cornice.position.y = topY - 0.2;
  cornice.castShadow = true;
  group.add(cornice);

  // Small domed chhatris at the two front top corners — the small-pavilion
  // silhouette detail that reads as distinctly Indian-monument rather than
  // a generic triumphal arch.
  for (const side of [-1, 1]) {
    const chhatriX = side * (blockWidth / 2 - 0.6);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.25, 12), trimMat);
    base.position.set(chhatriX, topY + 0.12, 0);
    group.add(base);
    for (const p of [-0.22, 0.22]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), trimMat);
      pillar.position.set(chhatriX + p, topY + 0.37, 0);
      group.add(pillar);
    }
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), stoneMat);
    dome.position.set(chhatriX, topY + 0.62, 0);
    group.add(dome);
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), trimMat);
    finial.position.set(chhatriX, topY + 0.62 + 0.24, 0);
    group.add(finial);
  }

  // A small eternal-flame-style beacon at the centre top, echoing India
  // Gate's Amar Jawan Jyoti — warm and glowing, consistent with the town's
  // lantern mood.
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.19, 0.24, 12), trimMat);
  bowl.position.set(0, topY + 0.32, 0);
  group.add(bowl);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffc36b }),
  );
  flame.position.set(0, bowl.position.y + 0.19, 0);
  group.add(flame);

  const flameLight = new THREE.PointLight(0xffab5c, 1.6, 20);
  flameLight.position.copy(flame.position);
  group.add(flameLight);

  return group;
}

export function buildTown(scene: THREE.Scene) {
  const groundGeo = new THREE.PlaneGeometry(140, 140);
  // Vibrant grass green for the daytime look — still a flat matte color, not
  // a texture map (a texture wouldn't cause render problems on its own, but
  // flat keeps the look consistent with the rest of the palette and simpler
  // to keep matte). The roads already read as the distinct "walking area"
  // cutting through the grass, so no extra path geometry is needed.
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x6fae4a, roughness: 0.95, metalness: 0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, -35);
  ground.receiveShadow = true;
  scene.add(ground);

  // The India Gate arch itself is the spawn-point landmark now — the flat
  // amber ring used to sit at the same height as the road's lane-paint ticks
  // right where the road meets the gate, causing z-fighting/flicker there.
  const gateArch = buildGateArch();
  gateArch.position.set(GATE_POSITION.x, 0, GATE_POSITION.z);
  scene.add(gateArch);

  const allWindowMatrices: THREE.Matrix4[] = [];
  for (const zone of ZONES) {
    const { group, windowMatrices } = buildBuilding(zone);
    scene.add(group);
    allWindowMatrices.push(...windowMatrices);

    // Street props flanking each building, placed wherever is clearest of the roads.
    const [lampOffset, treeOffset] = pickPropOffsets(zone, 2);
    if (lampOffset) scene.add(buildLampPost(zone.position.x + lampOffset.x, zone.position.z + lampOffset.z));
    if (treeOffset) scene.add(buildTree(zone.position.x + treeOffset.x, zone.position.z + treeOffset.z));
  }

  // All windows across every building collapse into one InstancedMesh —
  // a dense town could otherwise mean several hundred individual window
  // meshes (one building alone can have 50+), each its own draw call.
  if (allWindowMatrices.length > 0) {
    const windowMesh = new THREE.InstancedMesh(winGeo, winMat, allWindowMatrices.length);
    allWindowMatrices.forEach((m, i) => windowMesh.setMatrixAt(i, m));
    windowMesh.instanceMatrix.needsUpdate = true;
    scene.add(windowMesh);
  }

  buildRockInstances(scene, [...generateAmbientRocks(), ...generateRoadsideRocks()]);
  placeStreetLampsAndBunting(scene);
}
