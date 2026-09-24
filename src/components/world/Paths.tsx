import { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from '../../data/buildings';
import { terrainHeightAt } from './Terrain';
import { PAD_RADIUS } from './BuildingPad';

const PATH_WIDTH = 1.5;
const PATH_Y_OFFSET = 0.05;
const SPAWN = new THREE.Vector2(0, 0);

function seeded(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * One gently curved ribbon from spawn to a building's pad edge (not its
 * exact center — stopping short there is what keeps the path from visually
 * running underneath the building). Built as a CatmullRomCurve3 through a
 * single organically-offset midpoint, matching the World Overview's "loose
 * radial cluster... dirt paths" — a dead-straight line wouldn't need
 * Catmull-Rom at all. The curve is sampled in flat XZ, then each sample is
 * lifted to the actual terrain height beneath it (plus the 0.05 offset) so
 * the ribbon hugs the bumps instead of needing the terrain to flatten out
 * under it.
 */
function buildPathGeometry(targetXZ: THREE.Vector2, seedIndex: number): THREE.BufferGeometry {
  const dir = targetXZ.clone().sub(SPAWN);
  const length = dir.length();
  const trimmedEnd = SPAWN.clone().lerp(targetXZ, 1 - PAD_RADIUS / length);
  dir.normalize();
  const perp = new THREE.Vector2(-dir.y, dir.x);
  const bend = Math.min(length * 0.15, 4);
  const r = seeded(seedIndex) * 2 - 1;
  const mid = SPAWN.clone().lerp(trimmedEnd, 0.5).addScaledVector(perp, bend * r);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(SPAWN.x, 0, SPAWN.y),
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
    const segPerp = new THREE.Vector2(-segDir.y, segDir.x).multiplyScalar(PATH_WIDTH / 2);

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
  const geometries = useMemo(
    () => BUILDINGS.map((b, i) => buildPathGeometry(new THREE.Vector2(b.position[0], b.position[2]), i)),
    [],
  );

  return (
    <>
      {geometries.map((geo, i) => (
        <mesh key={BUILDINGS[i].id} geometry={geo} receiveShadow={false} name={`path-${BUILDINGS[i].id}`}>
          <meshLambertMaterial color="#C8A878" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}
