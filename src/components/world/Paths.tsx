import { useMemo } from 'react';
import * as THREE from 'three';
import { getBuilding } from '../../data/buildings';
import type { BuildingId } from '../../store/useStore';
import { terrainHeightAt } from './Terrain';
import { PAD_RADIUS } from './BuildingPad';

const TRUNK_WIDTH = 1.8;
const BRANCH_WIDTH = 1.3;
const PATH_Y_OFFSET = 0.05;
const SPAWN = new THREE.Vector2(0, 0);
// Stopping exactly at the pad's own radius left zero gap between path and
// pad — and since the pad (#A89878) and path (#C8A878) are nearly the same
// warm tan, the two blended into one continuous mass with the building
// sitting right on top, reading as "the path runs under the building"
// rather than "the path leads you to a clearing the building sits in".
// This adds a real few units of visible grass between where the path ends
// and where the pad begins.
const PAD_CLEARANCE = PAD_RADIUS + 3;

// Three junction points a short walk out from spawn, one per loose building
// cluster below — turns what used to be 7 independent spawn-to-building
// spokes (an obvious wheel from above) into a branching road: one trunk to
// each junction, then short branches off to the buildings in that cluster.
const HUBS = {
  west: new THREE.Vector2(-9, 1),
  north: new THREE.Vector2(5, -7),
  south: new THREE.Vector2(2, 9),
} as const;

type HubName = keyof typeof HUBS;

const CLUSTERS: Record<HubName, BuildingId[]> = {
  west: ['techstack', 'hobbies'],
  north: ['projects', 'experience'],
  south: ['learning', 'about', 'contact'],
};

function seeded(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

interface Segment {
  from: THREE.Vector2;
  to: THREE.Vector2;
  /** Units to pull the `to` end back by — 0 for a hub junction (the ribbon
   * should reach it exactly, so branches visually meet), PAD_CLEARANCE for
   * a building (so the ribbon stops short of the pad, per the note above). */
  clearance: number;
  width: number;
  seed: number;
}

/**
 * One gently curved ribbon between two points, built as a CatmullRomCurve3
 * through a single organically-offset midpoint — matching the World
 * Overview's "loose radial cluster... dirt paths" (a dead-straight line
 * wouldn't need Catmull-Rom at all). Sampled in flat XZ, then each sample is
 * lifted to the actual terrain height beneath it (plus the 0.05 offset) so
 * the ribbon hugs the bumps instead of needing the terrain to flatten out
 * under it.
 */
function buildPathGeometry(seg: Segment): THREE.BufferGeometry {
  const dir = seg.to.clone().sub(seg.from);
  const length = dir.length();
  const trimmedEnd = seg.clearance > 0 ? seg.from.clone().lerp(seg.to, 1 - seg.clearance / length) : seg.to;
  dir.normalize();
  const perp = new THREE.Vector2(-dir.y, dir.x);
  const bend = Math.min(length * 0.2, 4.5);
  const r = seeded(seg.seed) * 2 - 1;
  const mid = seg.from.clone().lerp(trimmedEnd, 0.5).addScaledVector(perp, bend * r);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(seg.from.x, 0, seg.from.y),
    new THREE.Vector3(mid.x, 0, mid.y),
    new THREE.Vector3(trimmedEnd.x, 0, trimmedEnd.y),
  ]);
  const samples = curve.getPoints(16).map((p) => new THREE.Vector2(p.x, p.z));

  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const segDir = next.clone().sub(prev).normalize();
    const segPerp = new THREE.Vector2(-segDir.y, segDir.x).multiplyScalar(seg.width / 2);

    const left = p.clone().sub(segPerp);
    const right = p.clone().add(segPerp);
    positions.push(
      left.x,
      terrainHeightAt(left.x, left.y) + PATH_Y_OFFSET,
      left.y,
      right.x,
      terrainHeightAt(right.x, right.y) + PATH_Y_OFFSET,
      right.y,
    );

    if (i > 0) {
      const a = (i - 1) * 2;
      const b = a + 1;
      const c = i * 2;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function Paths() {
  const segments = useMemo(() => {
    const list: Segment[] = [];
    let seed = 0;

    (Object.keys(HUBS) as HubName[]).forEach((hub) => {
      list.push({ from: SPAWN, to: HUBS[hub], clearance: 0, width: TRUNK_WIDTH, seed: seed++ });
      for (const id of CLUSTERS[hub]) {
        const [x, , z] = getBuilding(id).position;
        list.push({ from: HUBS[hub], to: new THREE.Vector2(x, z), clearance: PAD_CLEARANCE, width: BRANCH_WIDTH, seed: seed++ });
      }
    });

    return list.map((seg) => buildPathGeometry(seg));
  }, []);

  return (
    <>
      {segments.map((geo, i) => (
        <mesh key={i} geometry={geo} receiveShadow={false} name={`path-${i}`}>
          <meshLambertMaterial color="#C8A878" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}
