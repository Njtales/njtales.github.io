import { forwardRef, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

const FUR = '#E8701A';
const EAR_INNER = '#D4402A';
const CREAM = '#F5E6C8';
const TAIL_TIP = '#F5F0E8';
const DARK = '#2C1810';

const IDLE_TAIL_SWAY = THREE.MathUtils.degToRad(15);
const WALK_TAIL_RAISE = THREE.MathUtils.degToRad(20);
const TAIL_BASE_TILT = THREE.MathUtils.degToRad(40);
const EAR_FLATTEN = THREE.MathUtils.degToRad(25);

interface Props {
  /** Written every frame by NiroController as a plain ref (not a prop that
   * changes), same reasoning as the store's getState() pattern elsewhere —
   * a 60fps "am I moving" flag shouldn't force a React re-render just to
   * drive a walk cycle. */
  movingRef: React.RefObject<boolean>;
}

/**
 * A leg is a group pivoted at the hip (where it meets the body) with the
 * actual leg mesh offset downward inside it — rotating the group swings the
 * whole leg from the hip, rather than spinning the box around its own
 * center. Same "pivot via nested group" trick used for the wheels/blades in
 * the previous build.
 */
function Leg({ x, z, legRef }: { x: number; z: number; legRef: (el: THREE.Group | null) => void }) {
  return (
    <group ref={legRef} position={[x, 0.3, z]}>
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[0.13, 0.3, 0.13]} />
        <meshLambertMaterial color={FUR} />
      </mesh>
    </group>
  );
}

export const Niro = forwardRef<THREE.Group, Props>(function Niro({ movingRef }, ref) {
  const tailRef = useRef<THREE.Group>(null);
  const bodyBobRef = useRef<THREE.Group>(null);
  const legRefs = useRef<(THREE.Group | null)[]>([]);
  const earRefs = useRef<(THREE.Group | null)[]>([]);
  const age = useRef(0);

  useFrame((_state, delta) => {
    age.current += delta;
    const t = age.current;
    const moving = movingRef.current;

    // Tail: idle sway side to side, or raised + walking wiggle.
    if (tailRef.current) {
      if (moving) {
        tailRef.current.rotation.x = -(TAIL_BASE_TILT + WALK_TAIL_RAISE);
        tailRef.current.rotation.z = Math.sin(t * (Math.PI * 2) / 0.4) * 0.1;
      } else {
        tailRef.current.rotation.x = -TAIL_BASE_TILT;
        tailRef.current.rotation.z = Math.sin((t * Math.PI * 2) / 1.5) * IDLE_TAIL_SWAY;
      }
    }

    // Idle body bob — suppressed while walking, where the leg cycle itself
    // carries the sense of motion instead.
    if (bodyBobRef.current) {
      bodyBobRef.current.position.y = moving ? 0 : Math.sin((t * Math.PI * 2) / 2) * 0.02;
    }

    // Leg swing cycle, alternating front/back pairs, only while moving.
    legRefs.current.forEach((leg, i) => {
      if (!leg) return;
      if (moving) {
        const phase = i % 2 === 0 ? 0 : Math.PI;
        leg.rotation.x = Math.sin((t * Math.PI * 2) / 0.4 + phase) * 0.5;
      } else {
        leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, 0, 0.2);
      }
    });

    // Ears flatten slightly while walking.
    earRefs.current.forEach((ear) => {
      if (!ear) return;
      const target = moving ? -EAR_FLATTEN : 0;
      ear.rotation.x = THREE.MathUtils.lerp(ear.rotation.x, target, 0.15);
    });
  });

  return (
    <group ref={ref}>
      <Leg x={-0.16} z={-0.16} legRef={(el) => (legRefs.current[0] = el)} />
      <Leg x={0.16} z={-0.16} legRef={(el) => (legRefs.current[1] = el)} />
      <Leg x={-0.16} z={0.16} legRef={(el) => (legRefs.current[2] = el)} />
      <Leg x={0.16} z={0.16} legRef={(el) => (legRefs.current[3] = el)} />

      <group ref={bodyBobRef}>
        {/* Body */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.55, 0.5, 0.55]} />
          <meshLambertMaterial color={FUR} />
        </mesh>

        {/* Tail — pivoted at the base (back of the body), tilted forward/up. */}
        <group ref={tailRef} position={[0, 0.62, 0.28]} rotation={[-TAIL_BASE_TILT, 0, 0]}>
          <mesh position={[0, 0, 0.3]} castShadow>
            <coneGeometry args={[0.15, 0.6, 6]} />
            <meshLambertMaterial color={FUR} />
          </mesh>
          <mesh position={[0, 0, 0.58]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshLambertMaterial color={TAIL_TIP} />
          </mesh>
        </group>

        {/* Head — overlaps the body slightly at the top for a connected,
            oversized-head silhouette (per the earlier "~40% of total
            height" note) rather than sitting on a visible neck gap. */}
        <group position={[0, 0.95, -0.05]}>
          <mesh castShadow>
            <boxGeometry args={[0.48, 0.48, 0.48]} />
            <meshLambertMaterial color={FUR} />
          </mesh>

          <group ref={(el) => (earRefs.current[0] = el)} position={[-0.15, 0.24, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <coneGeometry args={[0.11, 0.24, 4]} />
              <meshLambertMaterial color={FUR} />
            </mesh>
            <mesh position={[0, 0.08, 0.04]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.06, 0.14, 4]} />
              <meshLambertMaterial color={EAR_INNER} />
            </mesh>
          </group>
          <group ref={(el) => (earRefs.current[1] = el)} position={[0.15, 0.24, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <coneGeometry args={[0.11, 0.24, 4]} />
              <meshLambertMaterial color={FUR} />
            </mesh>
            <mesh position={[0, 0.08, 0.04]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.06, 0.14, 4]} />
              <meshLambertMaterial color={EAR_INNER} />
            </mesh>
          </group>

          {/* Muzzle — front is local -Z, matching NiroController's facing
              convention. */}
          <mesh position={[0, -0.08, -0.28]} castShadow>
            <boxGeometry args={[0.22, 0.16, 0.15]} />
            <meshLambertMaterial color={CREAM} />
          </mesh>
          <mesh position={[0, -0.06, -0.36]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshLambertMaterial color={DARK} />
          </mesh>
          <mesh position={[-0.11, 0.04, -0.22]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshLambertMaterial color={DARK} />
          </mesh>
          <mesh position={[0.11, 0.04, -0.22]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshLambertMaterial color={DARK} />
          </mesh>
        </group>
      </group>

      <Billboard position={[0, 1.8, 0]}>
        <Text fontSize={0.3} color="#FFFFFF" outlineWidth={0.02} outlineColor="#000000" anchorX="center" anchorY="middle">
          Niro
        </Text>
      </Billboard>
    </group>
  );
});
