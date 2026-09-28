import { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from '../../data/buildings';
import { terrainHeightAt } from './Terrain';
import { getToonGradientMap } from '../../materials/toonGradient';
import { PalmTree } from './PalmTree';

const BUSH_COUNT = 50;
const ROCK_COUNT = 26;
const GRASS_CLUSTER_COUNT = 15;
const PALM_COUNT = 10;
// Scattered across roughly the walkable disc, not the full visual ground
// plane — keeps every instance somewhere the character will actually pass
// near, instead of wasting most of them out past the fog.
const SCATTER_RADIUS = 32;
const MIN_FROM_SPAWN = 5;
// Shrunk from 7 alongside the building/pad scale-down in Buildings.tsx and
// BuildingPad.tsx — that clearance was sized for the old, much bigger
// buildings and now left an oddly empty ring of bare grass around each one.
const MIN_FROM_BUILDING = 3.5;
// Trees read as bigger, more deliberate landmarks than rocks/bushes, so
// they get more breathing room around each building.
const MIN_FROM_BUILDING_TREE = 6.5;

// Warm, varied tones instead of a single flat gray-brown.
const ROCK_COLORS = ['#8B7355', '#7A8C6E', '#9B8B6A'];
// Most bushes are green (with hue/lightness variation like before); a
// minority get a colorful accent instead, matching the reference's
// scattered pink/red/purple bushes among mostly-green ones.
const BUSH_ACCENT_COLORS = ['#E8709A', '#D4401A', '#8B4AAC'];
const BUSH_ACCENT_CHANCE = 0.18;
const GRASS_COLOR = '#6FCC35';

function hash(n: number): number {
  const s = Math.sin(n * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

interface Prop {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color?: string;
}

/** Rejection-sampled points on the ground, kept clear of spawn and every
 * building's pad so scattered props read as ground clutter rather than
 * sprouting out of a doorway. */
function scatterPoints(count: number, seedOffset: number, minFromBuilding: number): { x: number; z: number }[] {
  const points: { x: number; z: number }[] = [];
  let seed = seedOffset;
  let attempts = 0;
  while (points.length < count && attempts < count * 25) {
    attempts++;
    const a = hash(seed++) * Math.PI * 2;
    const r = Math.sqrt(hash(seed++)) * SCATTER_RADIUS;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x, z) < MIN_FROM_SPAWN) continue;
    const tooCloseToBuilding = BUILDINGS.some((b) => Math.hypot(x - b.position[0], z - b.position[2]) < minFromBuilding);
    if (tooCloseToBuilding) continue;
    points.push({ x, z });
  }
  return points;
}

function scatterProps(count: number, seedOffset: number, minFromBuilding: number, build: (index: number, x: number, z: number) => Prop): Prop[] {
  return scatterPoints(count, seedOffset, minFromBuilding).map((p, i) => build(i, p.x, p.z));
}

/** One merged BufferGeometry of several vertical, randomly-rotated quads —
 * a whole grass cluster in a single draw call rather than one mesh per
 * blade. */
function buildGrassClusterGeometry(cx: number, cz: number, seed: number): THREE.BufferGeometry {
  const bladeCount = 5 + Math.floor(hash(seed * 3.3) * 4);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let b = 0; b < bladeCount; b++) {
    const bx = cx + (hash(seed * 5.1 + b) - 0.5) * 0.7;
    const bz = cz + (hash(seed * 7.7 + b) - 0.5) * 0.7;
    const angle = hash(seed * 9.9 + b) * Math.PI;
    const halfW = 0.15;
    const height = 0.6 + hash(seed * 11.1 + b) * 0.3;
    const dx = Math.cos(angle) * halfW;
    const dz = Math.sin(angle) * halfW;
    const groundY = terrainHeightAt(bx, bz);

    const base = positions.length / 3;
    positions.push(bx - dx, groundY, bz - dz, bx + dx, groundY, bz + dz, bx + dx, groundY + height, bz + dz, bx - dx, groundY + height, bz - dz);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Static, procedurally-scattered ground clutter — bushes, rocks, grass
 * clusters, and palm trees — gives the ground scale references and detail
 * that flat vertex-colored terrain alone can't. Plain declarative meshes
 * (not InstancedMesh) — at these counts the draw-call cost is trivial, and
 * it avoids InstancedMesh's imperative setMatrixAt lifecycle needing
 * careful re-sync under React StrictMode's double-mount in dev (hit a
 * reproducible solid-black rendering bug with it earlier in this project). */
export function Foliage() {
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  const bushes = useMemo(
    () =>
      scatterProps(BUSH_COUNT, 1, MIN_FROM_BUILDING, (i, x, z) => {
        const s = 0.45 + hash(i * 3.1) * 0.55;
        const isAccent = hash(i * 15.5) < BUSH_ACCENT_CHANCE;
        const color = isAccent
          ? BUSH_ACCENT_COLORS[Math.floor(hash(i * 17.2) * BUSH_ACCENT_COLORS.length)]
          : new THREE.Color().setHSL(0.28 + hash(i * 2.1) * 0.05, 0.42, 0.26 + hash(i * 4.4) * 0.12).getStyle();
        return {
          position: [x, terrainHeightAt(x, z) + s * 0.35, z],
          scale: [s, s * (0.8 + hash(i * 5.3) * 0.4), s],
          rotation: [0, hash(i * 7.7) * Math.PI * 2, 0],
          color,
        };
      }),
    [],
  );

  const rocks = useMemo(
    () =>
      scatterProps(ROCK_COUNT, 9001, MIN_FROM_BUILDING, (i, x, z) => {
        const s = 0.22 + hash(i * 9.3) * 0.32;
        return {
          position: [x, terrainHeightAt(x, z) + s * 0.4, z],
          scale: [s, s, s],
          rotation: [hash(i * 3.3) * Math.PI, hash(i * 6.6) * Math.PI, hash(i * 9.9) * Math.PI],
          color: ROCK_COLORS[Math.floor(hash(i * 4.4) * ROCK_COLORS.length)],
        };
      }),
    [],
  );

  const grassClusters = useMemo(
    () => scatterPoints(GRASS_CLUSTER_COUNT, 20001, MIN_FROM_BUILDING).map((p, i) => buildGrassClusterGeometry(p.x, p.z, i)),
    [],
  );

  const palms = useMemo(
    () =>
      scatterPoints(PALM_COUNT, 30001, MIN_FROM_BUILDING_TREE).map((p, i) => ({
        position: [p.x, terrainHeightAt(p.x, p.z), p.z] as [number, number, number],
        scale: 0.8 + hash(i * 6.2) * 0.5,
        seed: i,
      })),
    [],
  );

  return (
    <>
      {bushes.map((p, i) => (
        <mesh key={i} position={p.position} scale={p.scale} rotation={p.rotation} castShadow>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshToonMaterial color={p.color} gradientMap={gradientMap} />
        </mesh>
      ))}
      {rocks.map((p, i) => (
        <mesh key={i} position={p.position} scale={p.scale} rotation={p.rotation} castShadow>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshToonMaterial color={p.color} gradientMap={gradientMap} />
        </mesh>
      ))}
      {grassClusters.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshToonMaterial color={GRASS_COLOR} side={THREE.DoubleSide} gradientMap={gradientMap} />
        </mesh>
      ))}
      {palms.map((p, i) => (
        <PalmTree key={i} position={p.position} scale={p.scale} seed={p.seed} />
      ))}
    </>
  );
}
