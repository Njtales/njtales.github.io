import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';

const SIZE = 80;
const SEGMENTS = 64;
const BASE_COLOR = new THREE.Color('#7EC850');
const VARIANT_COLOR = new THREE.Color('#5DAA3A');

/**
 * Flat for now, per the build order — height displacement gets added once
 * movement/camera/height-sampling are all verified working, so a terrain
 * bug can't be confused with a movement bug. Rotation is baked into the
 * geometry itself (not the mesh's own transform) so it stays identity and
 * every consumer (raycasting, later noise displacement) works in plain
 * world-space X/Z without a rotation to account for.
 */
export const Terrain = forwardRef<THREE.Mesh>(function Terrain(_props, ref) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Cheap patchy variation from a couple of layered sine waves — no
      // noise library needed for a subtle color-only pattern like this.
      const patch = Math.sin(x * 0.15) * Math.cos(z * 0.17) + Math.sin(x * 0.05 + z * 0.08) * 0.6;
      const t = THREE.MathUtils.clamp(patch * 0.4 + 0.5, 0, 1);
      color.copy(BASE_COLOR).lerp(VARIANT_COLOR, t * 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh ref={ref} geometry={geometry} receiveShadow={false} name="terrain">
      <meshLambertMaterial vertexColors />
    </mesh>
  );
});
