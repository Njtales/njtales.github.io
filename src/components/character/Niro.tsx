import { forwardRef } from 'react';
import * as THREE from 'three';

/**
 * Placeholder box body per the build order (step 3) — swapped for the real
 * low-poly fox once movement/camera/terrain are all working (step 10 in the
 * spec's order, though built procedurally rather than as an imported GLTF —
 * see the project-level note on why).
 */
export const Niro = forwardRef<THREE.Group>(function Niro(_props, ref) {
  return (
    <group ref={ref}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 1, 1]} />
        <meshLambertMaterial color="#E8701A" />
      </mesh>
    </group>
  );
});
