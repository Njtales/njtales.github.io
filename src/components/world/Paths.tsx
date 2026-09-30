import { useMemo } from 'react';
import * as THREE from 'three';
import { getBuilding } from '../../data/buildings';
import type { BuildingId } from '../../store/useStore';
import { terrainHeightAt } from './Terrain';
import { PAD_RADIUS } from './BuildingPad';
import { getToonGradientMap } from '../../materials/toonGradient';

const TRUNK_WIDTH = 1.8;
const BRANCH_WIDTH = 1.3;
const PATH_Y_OFFSET = 0.05;
// A wider, darker ribbon sits just underneath each path's fill ribbon and
// pokes out past its edges — the classic "wider silhouette behind" outline
// trick, borrowed here for a flat ribbon instead of a 3D mesh. This is what
// gives the reference's paths their painted ink-edge look instead of a
// soft, edgeless blend into the grass.
const EDGE_EXTRA_WIDTH = 0.4;
const EDGE_Y_OFFSET = PATH_Y_OFFSET - 0.015;
const EDGE_COLOR = '#5A4326';
const FILL_COLOR = '#C8A878';
const SPAWN = new THREE.Vector2(0, 0);
// Stopping exactly at the pad's own radius left zero gap between path and
// pad — and since the pad (#A89878) and path (#C8A878) are nearly the same
// warm tan, the two blended into one continuous mass with the building
// sitting right on top, reading as "the path runs under the building"
// rather than "the path leads you to a clearing the building sits in".
// This adds a real few units of visible grass between where the path ends
// and where the pad begins.
// Trimmed from +3 to +1.5 alongside the building layout's compression (see
// data/buildings.ts) — a couple of hub-to-building branches got short
// enough that +3 would have left near-zero (or negative) room for the
// curve's own midpoint bend.
const PAD_CLEARANCE = PAD_RADIUS + 1.5;

// Three junction points a short walk out from spawn, one per loose building
// cluster below — turns what used to be 7 independent spawn-to-building
// spokes (an obvious wheel from above) into a branching road: one trunk to
// each junction, then short branches off to the buildings in that cluster.
// Scaled by the same ~65% factor as the building positions.
const HUBS = {
  west: new THREE.Vector2(-5.85, 0.65),
  north: new THREE.Vector2(3.25, -4.55),
  south: new THREE.Vector2(1.3, 5.85),
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
 * The flat-XZ centerline samples for one segment, built as a
 * CatmullRomCurve3 through a single organically-offset midpoint — matching
 * the World Overview's "loose radial cluster... dirt paths" (a dead-straight
 * line wouldn't need Catmull-Rom at all). Factored out from ribbon-building
 * so the edge and fill ribbons of the same path can share an identical
 * curve instead of drifting apart.
 */
function buildCurveSamples(seg: Segment): THREE.Vector2[] {
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
  return curve.getPoints(16).map((p) => new THREE.Vector2(p.x, p.z));
}

/**
 * A flat ribbon of the given width along the centerline samples, each
 * sample lifted to the actual terrain height beneath it (plus `yOffset`) so
 * the ribbon hugs the bumps instead of needing the terrain to flatten out
 * under it.
 */
function buildRibbonGeometry(samples: THREE.Vector2[], width: number, yOffset: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const segDir = next.clone().sub(prev).normalize();
    const segPerp = new THREE.Vector2(-segDir.y, segDir.x).multiplyScalar(width / 2);

    const left = p.clone().sub(segPerp);
    const right = p.clone().add(segPerp);
    positions.push(
      left.x,
      terrainHeightAt(left.x, left.y) + yOffset,
      left.y,
      right.x,
      terrainHeightAt(right.x, right.y) + yOffset,
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
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const ribbons = useMemo(() => {
    const list: Segment[] = [];
    let seed = 0;

    (Object.keys(HUBS) as HubName[]).forEach((hub) => {
      list.push({ from: SPAWN, to: HUBS[hub], clearance: 0, width: TRUNK_WIDTH, seed: seed++ });
      for (const id of CLUSTERS[hub]) {
        const [x, , z] = getBuilding(id).position;
        list.push({ from: HUBS[hub], to: new THREE.Vector2(x, z), clearance: PAD_CLEARANCE, width: BRANCH_WIDTH, seed: seed++ });
      }
    });

    // Each segment becomes two ribbons sharing one curve: a wider, darker
    // "edge" underneath and the normal-width tan "fill" on top, so the edge
    // peeks out along both sides as a painted border instead of the fill
    // blending edgelessly into the grass.
    return list.flatMap((seg, segIndex) => {
      const samples = buildCurveSamples(seg);
      return [
        { key: `${segIndex}-edge`, geo: buildRibbonGeometry(samples, seg.width + EDGE_EXTRA_WIDTH * 2, EDGE_Y_OFFSET), color: EDGE_COLOR },
        { key: `${segIndex}-fill`, geo: buildRibbonGeometry(samples, seg.width, PATH_Y_OFFSET), color: FILL_COLOR },
      ];
    });
  }, []);

  return (
    <>
      {ribbons.map((r) => (
        <mesh key={r.key} geometry={r.geo} receiveShadow={false} name={`path-${r.key}`}>
          <meshToonMaterial color={r.color} side={THREE.DoubleSide} gradientMap={gradientMap} />
        </mesh>
      ))}
    </>
  );
}
