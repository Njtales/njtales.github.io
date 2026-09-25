import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { getToonGradientMap } from '../../materials/toonGradient';

const FUR = '#E8701A';
const EAR_INNER = '#D4402A';
const CREAM = '#F5E6C8';
const TAIL_TIP = '#F5F0E8';
const DARK = '#2C1810';

const IDLE_TAIL_SWAY = THREE.MathUtils.degToRad(15);
const WALK_TAIL_RAISE = THREE.MathUtils.degToRad(20);
const TAIL_BASE_TILT = THREE.MathUtils.degToRad(40);
const EAR_FLATTEN = THREE.MathUtils.degToRad(25);

// Chibi proportions: a big, clearly-dominant head (~55-60% of total height)
// over a small body and short legs, in place of the original near-1:1
// head/body split. Values below are laid out bottom-up (hip -> body top ->
// head) so each stays consistent with what it sits on.
const LEG_LENGTH = 0.18;
const HIP_Y = LEG_LENGTH; // top of the leg = where it meets the body
const BODY_SIZE: [number, number, number] = [0.42, 0.36, 0.42];
const BODY_CENTER_Y = HIP_Y + BODY_SIZE[1] / 2;
const HEAD_SIZE = 0.62;
// Slight overlap with the body top for a connected silhouette (same idea as
// before), not a visible neck gap.
const HEAD_CENTER_Y = HIP_Y + BODY_SIZE[1] - 0.08 + HEAD_SIZE / 2;

interface Props {
  /** Written every frame by NiroController as a plain ref (not a prop that
   * changes), same reasoning as the store's getState() pattern elsewhere —
   * a 60fps "am I moving" flag shouldn't force a React re-render just to
   * drive a walk cycle. */
  movingRef: React.RefObject<boolean>;
}

/** Every material in this file shares one toon gradient map so Niro reads
 * with the same lighting language as the rest of the (now toon-shaded)
 * world, instead of each mesh's material re-deriving its own. */
function Mat({ color }: { color: string }) {
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  return <meshToonMaterial color={color} gradientMap={gradientMap} />;
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
    <group ref={legRef} position={[x, HIP_Y, z]}>
      <mesh position={[0, -LEG_LENGTH / 2, 0]} castShadow>
        <boxGeometry args={[0.14, LEG_LENGTH, 0.14]} />
        <Mat color={FUR} />
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
      <Leg x={-0.13} z={-0.13} legRef={(el) => (legRefs.current[0] = el)} />
      <Leg x={0.13} z={-0.13} legRef={(el) => (legRefs.current[1] = el)} />
      <Leg x={-0.13} z={0.13} legRef={(el) => (legRefs.current[2] = el)} />
      <Leg x={0.13} z={0.13} legRef={(el) => (legRefs.current[3] = el)} />

      <group ref={bodyBobRef}>
        {/* Body — small relative to the head, chibi-style. */}
        <mesh position={[0, BODY_CENTER_Y, 0]} castShadow>
          <boxGeometry args={BODY_SIZE} />
          <Mat color={FUR} />
        </mesh>

        {/* Tail — pivoted at the base (back of the body), tilted forward/up. */}
        <group ref={tailRef} position={[0, BODY_CENTER_Y + 0.06, 0.2]} rotation={[-TAIL_BASE_TILT, 0, 0]}>
          <mesh position={[0, 0, 0.24]} castShadow>
            <coneGeometry args={[0.14, 0.48, 6]} />
            <Mat color={FUR} />
          </mesh>
          <mesh position={[0, 0, 0.47]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <Mat color={TAIL_TIP} />
          </mesh>
        </group>

        {/* Head — big and dominant, per chibi proportions above. Slightly
            back-offset like the body for a connected silhouette. */}
        <group position={[0, HEAD_CENTER_Y, -0.04]}>
          <mesh castShadow>
            <boxGeometry args={[HEAD_SIZE, HEAD_SIZE, HEAD_SIZE]} />
            <Mat color={FUR} />
          </mesh>

          <group ref={(el) => (earRefs.current[0] = el)} position={[-0.19, 0.31, 0]}>
            <mesh position={[0, 0.13, 0]} castShadow>
              <coneGeometry args={[0.14, 0.3, 4]} />
              <Mat color={FUR} />
            </mesh>
            <mesh position={[0, 0.1, 0.05]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.08, 0.17, 4]} />
              <Mat color={EAR_INNER} />
            </mesh>
          </group>
          <group ref={(el) => (earRefs.current[1] = el)} position={[0.19, 0.31, 0]}>
            <mesh position={[0, 0.13, 0]} castShadow>
              <coneGeometry args={[0.14, 0.3, 4]} />
              <Mat color={FUR} />
            </mesh>
            <mesh position={[0, 0.1, 0.05]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.08, 0.17, 4]} />
              <Mat color={EAR_INNER} />
            </mesh>
          </group>

          {/* Muzzle — kept modest (not scaled up as much as the head) so the
              big eyes read as the focal point, per chibi convention. Front
              is local -Z, matching NiroController's facing convention. */}
          <mesh position={[0, -0.09, -0.32]} castShadow>
            <boxGeometry args={[0.24, 0.17, 0.14]} />
            <Mat color={CREAM} />
          </mesh>
          <mesh position={[0, -0.075, -0.4]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <Mat color={DARK} />
          </mesh>
          {/* Big, close-set forward eyes — the main chibi "cuteness" lever. */}
          <mesh position={[-0.14, 0.05, -0.29]}>
            <sphereGeometry args={[0.085, 10, 10]} />
            <Mat color={DARK} />
          </mesh>
          <mesh position={[0.14, 0.05, -0.29]}>
            <sphereGeometry args={[0.085, 10, 10]} />
            <Mat color={DARK} />
          </mesh>
        </group>
      </group>

      <Billboard position={[0, 1.65, 0]}>
        <Text fontSize={0.3} color="#FFFFFF" outlineWidth={0.02} outlineColor="#000000" anchorX="center" anchorY="middle">
          Niro
        </Text>
      </Billboard>
    </group>
  );
});
