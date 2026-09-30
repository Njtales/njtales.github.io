import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';

// Visual ground plane is deliberately bigger than the island itself so the
// surrounding open water still has something to render on, and the plane's
// physical edge stays beyond the fog's fully-opaque distance.
const SIZE = 340;
const SEGMENTS = 128;
// Widened from a 2-color (base/variant) blend to a 3-stop range — the old
// pair was too close in tone to read as the reference's bold painted
// light/dark patches; SHADOW/HIGHLIGHT give the macro-noise pass real
// swing to work with instead of a narrow band.
const SHADOW_COLOR = new THREE.Color('#3F7A28');
const BASE_COLOR = new THREE.Color('#7EC850');
const HIGHLIGHT_COLOR = new THREE.Color('#A8E070');
const DIRT_FLECK_COLOR = new THREE.Color('#8A7550');
const NOISE_FREQUENCY = 0.08;
const MAX_DISPLACEMENT = 0.4;

// --- Organic island shape ------------------------------------------------
// The world used to be an unbounded flat-ish plane fading into fog. This
// reshapes it into a single finite island sitting in open water — an
// irregular (not circular) coastline via a radius-by-angle function summing
// a few sine harmonics at different frequencies/phases, same "cheap and
// organic" spirit as the terrain noise. Amplitude is kept fairly gentle
// (small wobble, not a dramatic kidney shape) specifically so every
// building position (out to ~radius 18) stays comfortably inside the pure-
// land zone regardless of which angle it happens to sit at — a wilder
// coastline risks a building landing in a narrow cove and ending up on sand
// or in water.
const ISLAND_RADIUS = 36;
const COAST_WOBBLE = [
  { amp: 0.08, freq: 2, phase: 1.3 },
  { amp: 0.05, freq: 3, phase: 0.7 },
  { amp: 0.03, freq: 5, phase: 2.1 },
];
const BEACH_WIDTH = 5;
const SHORE_BAND = 3;
const WATER_DEPTH = -1.4;
const SAND_COLOR = new THREE.Color('#D4B483');
const FOAM_COLOR = new THREE.Color('#F0F5E8');
const WATER_NEAR_COLOR = new THREE.Color('#3AA8B0');
const WATER_FAR_COLOR = new THREE.Color('#1A6F7A');
const WATER_DARKEN_DIST = 60; // distance from shore over which water reaches its darkest

function coastRadiusAt(theta: number): number {
  let factor = 1;
  for (const w of COAST_WOBBLE) factor += w.amp * Math.sin(theta * w.freq + w.phase);
  return ISLAND_RADIUS * factor;
}

/** How far from the origin the character can walk at a given angle before
 * hitting wet sand/water — stops right at the shore band's inner edge, so
 * the player can stand anywhere on dry beach but never wade in. Exported
 * for NiroController's movement clamp, which needs the organic coastline's
 * actual shape rather than a fixed-radius circle or a square bound (a
 * square's corners would reach past the coastline at some angles). */
export function maxWalkableRadiusAt(theta: number): number {
  return coastRadiusAt(theta) - SHORE_BAND;
}

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

function landHeightAt(x: number, z: number): number {
  return (valueNoise(x * NOISE_FREQUENCY, z * NOISE_FREQUENCY) * 2 - 1) * MAX_DISPLACEMENT;
}

/** Terrain height at any world (x, z), including the island's coastline:
 * full land noise inside the island, flat open water beyond it, with a
 * sand-then-foam transition between. Shared by the mesh build and every
 * placement helper (buildings/paths/foliage/mountains all sample this to
 * sit level) — the character's own height instead comes from a real
 * raycast against the built mesh in NiroController, so it follows this
 * same shape by construction, no separate water-awareness needed there. */
export function terrainHeightAt(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const theta = Math.atan2(z, x);
  const coastR = coastRadiusAt(theta);
  const beachStart = coastR - BEACH_WIDTH - SHORE_BAND;
  const shoreStart = coastR - SHORE_BAND;

  if (r <= beachStart) return landHeightAt(x, z);
  if (r >= coastR) return WATER_DEPTH;
  if (r < shoreStart) {
    // Beach: land height flattening down toward sea level.
    const t = (r - beachStart) / BEACH_WIDTH;
    return THREE.MathUtils.lerp(landHeightAt(x, z), 0, t);
  }
  // Shore/foam band: sea level down to full water depth.
  const t = (r - shoreStart) / SHORE_BAND;
  return THREE.MathUtils.lerp(0, WATER_DEPTH, t);
}

/** Same island zones as terrainHeightAt, but for vertex color — grass in
 * the land zone (existing macro/micro/dirt-fleck blend), sand on the
 * beach (blended in from grass at its inner edge so there's no hard
 * seam), then sand -> foam -> open water across the shore band, and a
 * distance-darkened water gradient beyond the coast. */
function terrainColorAt(x: number, z: number, out: THREE.Color): void {
  const r = Math.hypot(x, z);
  const theta = Math.atan2(z, x);
  const coastR = coastRadiusAt(theta);
  const beachStart = coastR - BEACH_WIDTH - SHORE_BAND;
  const shoreStart = coastR - SHORE_BAND;

  const macro = valueNoise(x * 0.035, z * 0.035);
  const micro = valueNoise(x * 0.4, z * 0.4);
  const gt = THREE.MathUtils.clamp(macro * 0.75 + micro * 0.25, 0, 1);
  if (gt < 0.5) out.copy(SHADOW_COLOR).lerp(BASE_COLOR, gt * 2);
  else out.copy(BASE_COLOR).lerp(HIGHLIGHT_COLOR, (gt - 0.5) * 2);
  if (micro > 0.84) out.lerp(DIRT_FLECK_COLOR, ((micro - 0.84) / 0.16) * 0.6);

  if (r <= beachStart) return; // pure grass, already set above

  if (r >= coastR) {
    const distFromShore = r - coastR;
    const t = THREE.MathUtils.clamp(distFromShore / WATER_DARKEN_DIST, 0, 1);
    out.copy(WATER_NEAR_COLOR).lerp(WATER_FAR_COLOR, t);
    return;
  }
  if (r < shoreStart) {
    const t = THREE.MathUtils.smoothstep(r, beachStart, shoreStart);
    out.lerp(SAND_COLOR, t);
    return;
  }
  const t = (r - shoreStart) / SHORE_BAND;
  if (t < 0.5) out.copy(SAND_COLOR).lerp(FOAM_COLOR, t * 2);
  else out.copy(FOAM_COLOR).lerp(WATER_NEAR_COLOR, (t - 0.5) * 2);
}

/**
 * Rotation is baked into the geometry itself (not the mesh's own transform)
 * so it stays identity and every consumer (raycasting, noise sampling)
 * works in plain world-space X/Z without a rotation to account for.
 */
export const Terrain = forwardRef<THREE.Mesh>(function Terrain(_props, ref) {
  // The painterly grass texture used before the island/water rework is
  // dropped for now — multiplying it (map * vertexColor) onto the new
  // water/sand zones muddies their color badly, and there's no cheap way
  // to mask it to land-only without a custom shader. Per the reference
  // spec's own Phase 1 allowance ("terrain can be flat/no texture at this
  // stage"), vertex color alone carries this checkpoint; texture detail is
  // a later refinement once the island shape itself is confirmed.

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

      // Grass (macro/micro/dirt-fleck blend) inside the island, sand/foam
      // across its coastline, open water beyond — see terrainColorAt.
      terrainColorAt(x, z, color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh ref={ref} geometry={geometry} receiveShadow name="terrain">
      {/* Switched from MeshToonMaterial to MeshStandardMaterial per a
          working reference on the same stack — flat toon bands read
          noticeably flatter/less grounded than real lit shading once
          shadows are actually received (receiveShadow was false before,
          silently making all that castShadow work on buildings/Niro a
          no-op here). No flatShading here: our analytic per-vertex normals
          already avoid PlaneGeometry's diagonal-triangulation artifact,
          and flatShading would derive flat per-face normals from the raw
          triangles instead, reintroducing it. */}
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
});
