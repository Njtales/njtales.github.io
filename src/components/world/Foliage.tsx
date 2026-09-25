import { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from '../../data/buildings';
import { terrainHeightAt } from './Terrain';
import { getToonGradientMap } from '../../materials/toonGradient';

const BUSH_COUNT = 50;
const ROCK_COUNT = 26;
// Scattered across roughly the walkable disc, not the full visual ground
// plane — keeps every instance somewhere the character will actually pass
// near, instead of wasting most of them out past the fog.
const SCATTER_RADIUS = 32;
const MIN_FROM_SPAWN = 5;
// Shrunk from 7 alongside the building/pad scale-down in Buildings.tsx and
// BuildingPad.tsx — that clearance was sized for the old, much bigger
// buildings and now left an oddly empty ring of bare grass around each one.
const MIN_FROM_BUILDING = 3.5;

const ROCK_COLOR = '#8A8478';

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
 * building's pad so bushes/rocks read as scattered ground clutter rather
 * than sprouting out of a doorway. */
function scatterProps(count: number, seedOffset: number, build: (index: number, x: number, z: number) => Prop): Prop[] {
  const props: Prop[] = [];
  let seed = seedOffset;
  let attempts = 0;
  while (props.length < count && attempts < count * 25) {
    attempts++;
    const a = hash(seed++) * Math.PI * 2;
    const r = Math.sqrt(hash(seed++)) * SCATTER_RADIUS;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x, z) < MIN_FROM_SPAWN) continue;
    const tooCloseToBuilding = BUILDINGS.some((b) => Math.hypot(x - b.position[0], z - b.position[2]) < MIN_FROM_BUILDING);
    if (tooCloseToBuilding) continue;
    props.push(build(props.length, x, z));
  }
  return props;
}

/** Static, procedurally-scattered bushes and rocks give the ground scale
 * references and close-up texture that flat vertex-colored terrain alone
 * can't. Plain declarative meshes (not InstancedMesh) — at these counts the
 * draw-call cost is trivial, and it avoids InstancedMesh's imperative
 * setMatrixAt lifecycle needing careful re-sync under React StrictMode's
 * double-mount in dev. */
export function Foliage() {
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const bushes = useMemo(
    () =>
      scatterProps(BUSH_COUNT, 1, (i, x, z) => {
        const s = 0.45 + hash(i * 3.1) * 0.55;
        return {
          position: [x, terrainHeightAt(x, z) + s * 0.35, z],
          scale: [s, s * (0.8 + hash(i * 5.3) * 0.4), s],
          rotation: [0, hash(i * 7.7) * Math.PI * 2, 0],
          color: new THREE.Color().setHSL(0.28 + hash(i * 2.1) * 0.05, 0.42, 0.26 + hash(i * 4.4) * 0.12).getStyle(),
        };
      }),
    [],
  );

  const rocks = useMemo(
    () =>
      scatterProps(ROCK_COUNT, 9001, (i, x, z) => {
        const s = 0.22 + hash(i * 9.3) * 0.32;
        return {
          position: [x, terrainHeightAt(x, z) + s * 0.4, z],
          scale: [s, s, s],
          rotation: [hash(i * 3.3) * Math.PI, hash(i * 6.6) * Math.PI, hash(i * 9.9) * Math.PI],
        };
      }),
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
          <meshToonMaterial color={ROCK_COLOR} gradientMap={gradientMap} />
        </mesh>
      ))}
    </>
  );
}
