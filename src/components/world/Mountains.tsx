import { useMemo } from 'react';
import * as THREE from 'three';
import { getToonGradientMap } from '../../materials/toonGradient';
import { terrainHeightAt } from './Terrain';

const MOUNTAIN_COUNT = 20;
const RING_RADIUS_MIN = 72;
const RING_RADIUS_MAX = 85;
const HEIGHT_MIN = 18;
const HEIGHT_MAX = 30;
// Cooler, desaturated palette than the sunny near-ground greens — reads as
// atmospheric-perspective haze on a distant backdrop.
const COLOR_NEAR = '#8FA8C4';
const COLOR_FAR = '#5E7A9E';

function hash(n: number): number {
  const s = Math.sin(n * 91.345) * 47453.123;
  return s - Math.floor(s);
}

/** A jittered low-poly cone — horizontal radius perturbed per vertex (more
 * jitter near the base, tapering off toward the apex) so it reads as a
 * craggy peak silhouette instead of a traffic cone. MeshToonMaterial has no
 * `flatShading` property (unlike Lambert/Standard/Phong), so the faceted
 * look instead comes from `toNonIndexed()` — duplicating vertices per
 * triangle before computing normals, so no vertex is shared between faces
 * and each triangle gets a genuinely flat normal instead of an averaged one. */
function createPeakGeometry(seed: number): THREE.BufferGeometry {
  const radialSegments = 6 + Math.floor(hash(seed * 3.1) * 3);
  const geo = new THREE.ConeGeometry(1, 1, radialSegments, 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const heightFrac = y + 0.5; // 0 at base, 1 at apex
    const jitter = 1 + (hash(seed * 13.7 + i * 1.31) - 0.5) * 0.4 * (1 - heightFrac * 0.6);
    pos.setX(i, x * jitter);
    pos.setZ(i, z * jitter);
  }
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}

/**
 * A ring of low-poly mountains framing the play area — an unreachable
 * backdrop (the character's movement stays well inside the ring) that gives
 * the world a sense of scale the flat horizon didn't have. Radius/height
 * are tuned against Scene.tsx's fog-far distance so the ring reads as a
 * hazy, partially-fogged silhouette rather than being fully invisible or
 * fully sharp — see the fog-far comment in Scene.tsx for the math.
 */
export function Mountains() {
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  const peaks = useMemo(
    () =>
      Array.from({ length: MOUNTAIN_COUNT }, (_, i) => {
        const angle = (i / MOUNTAIN_COUNT) * Math.PI * 2 + (hash(i * 5.1) - 0.5) * 0.35;
        const radius = RING_RADIUS_MIN + hash(i * 2.3) * (RING_RADIUS_MAX - RING_RADIUS_MIN);
        const height = HEIGHT_MIN + hash(i * 7.9) * (HEIGHT_MAX - HEIGHT_MIN);
        const baseRadius = height * (0.55 + hash(i * 4.4) * 0.25);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = terrainHeightAt(x, z) + height / 2;
        const rotationY = hash(i * 9.9) * Math.PI * 2;
        const color = new THREE.Color(COLOR_FAR).lerp(new THREE.Color(COLOR_NEAR), hash(i * 6.6)).getStyle();
        return {
          geometry: createPeakGeometry(i),
          position: [x, y, z] as [number, number, number],
          scale: [baseRadius, height, baseRadius] as [number, number, number],
          rotationY,
          color,
        };
      }),
    [],
  );

  return (
    <>
      {peaks.map((p, i) => (
        <mesh key={i} geometry={p.geometry} position={p.position} scale={p.scale} rotation={[0, p.rotationY, 0]}>
          <meshToonMaterial color={p.color} gradientMap={gradientMap} />
        </mesh>
      ))}
    </>
  );
}
