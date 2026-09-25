import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { createPainterlyGroundTexture } from '../../textures/canvasTextures';
import { getToonGradientMap } from '../../materials/toonGradient';

// Visual ground plane is deliberately bigger than the spec's stated 80x80
// world — the character's walkable area is still clamped to the intended
// ~60x60ish region (NiroController's WORLD_BOUND), but the plane's actual
// physical edge needs to stay beyond the fog's fully-opaque distance (see
// Scene.tsx) in the worst case, or the hard edge shows as a sharp line
// instead of a soft fade. Sized for the shallow-pitch FollowCamera, which
// can see much further across the ground than the old steep top-down tilt
// did (near-horizontal view rays travel far before hitting flat ground):
// worst case is the character at a WORLD_BOUND corner (~50 from origin)
// with the camera trailing another ~13 further out, plus the fog's ~100
// reach beyond that — comfortably inside this plane's ~170-unit radius.
const SIZE = 340;
const SEGMENTS = 64;
const BASE_COLOR = new THREE.Color('#7EC850');
const VARIANT_COLOR = new THREE.Color('#5DAA3A');
const DIRT_FLECK_COLOR = new THREE.Color('#8A7550');
const NOISE_FREQUENCY = 0.08;
const MAX_DISPLACEMENT = 0.4;

// Cheap hash-based value noise (bilinear-interpolated pseudo-random grid) —
// smooth and gentle at low frequency without pulling in a Perlin/simplex
// library for what's a small, subtle effect here.
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, u), THREE.MathUtils.lerp(c, d, u), v);
}

/** Terrain height at any world (x, z) — shared by the mesh build and the
 * pad-placement helpers (buildings sample this once to sit level). */
export function terrainHeightAt(x: number, z: number): number {
  return (valueNoise(x * NOISE_FREQUENCY, z * NOISE_FREQUENCY) * 2 - 1) * MAX_DISPLACEMENT;
}

/**
 * Rotation is baked into the geometry itself (not the mesh's own transform)
 * so it stays identity and every consumer (raycasting, noise sampling)
 * works in plain world-space X/Z without a rotation to account for.
 */
export const Terrain = forwardRef<THREE.Mesh>(function Terrain(_props, ref) {
  const groundTexture = useMemo(() => {
    const tex = createPainterlyGroundTexture();
    // ~5-unit tiles regardless of SIZE — nested between the macro noise's
    // ~28-unit features and the micro noise's ~2.5-unit features below, so
    // the baked brush-stroke grain reads as its own detail layer instead of
    // fighting either octave.
    const tileCount = SIZE / 5;
    tex.repeat.set(tileCount, tileCount);
    return tex;
  }, []);
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const normal = geo.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();
    const eps = 0.1;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, terrainHeightAt(x, z));

      // Analytic normal from the height field's own slope, not
      // computeVertexNormals()'s triangle-based average — PlaneGeometry
      // splits every quad along the same diagonal, and averaging real
      // triangle normals bakes that into a faint but regular diagonal grid
      // of shading facets across the whole terrain once it's displaced.
      const dx = (terrainHeightAt(x + eps, z) - terrainHeightAt(x - eps, z)) / (2 * eps);
      const dz = (terrainHeightAt(x, z + eps) - terrainHeightAt(x, z - eps)) / (2 * eps);
      const n = new THREE.Vector3(-dx, 1, -dz).normalize();
      normal.setXYZ(i, n.x, n.y, n.z);

      // Two octaves of the same value-noise field used for height, at very
      // different frequencies: a slow one for large mottled regions and a
      // fast one for close-up mottling — a single sine field read as flat,
      // regular "wallpaper" once you were standing on it. A sparse third
      // pass darkens toward a dirt-fleck color where the fine noise peaks,
      // for scattered patches of bare soil instead of pure grass-on-grass.
      const macro = valueNoise(x * 0.035, z * 0.035);
      const micro = valueNoise(x * 0.4, z * 0.4);
      const t = THREE.MathUtils.clamp(macro * 0.6 + micro * 0.4, 0, 1);
      color.copy(BASE_COLOR).lerp(VARIANT_COLOR, t * 0.7);
      if (micro > 0.86) color.lerp(DIRT_FLECK_COLOR, ((micro - 0.86) / 0.14) * 0.55);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh ref={ref} geometry={geometry} receiveShadow={false} name="terrain">
      <meshToonMaterial vertexColors map={groundTexture} gradientMap={gradientMap} />
    </mesh>
  );
});
