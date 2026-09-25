import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Door } from './shared';
import { getToonGradientMap } from '../../materials/toonGradient';

const ACCENT = '#E8A020';
const PALETTE_COLORS = ['#FF4444', '#4444FF', '#44FF44'];

/** A quirky artist's studio — an asymmetric roof (one side steeper), a
 * color-cycling porthole window, paint-palette quads on the wall, and a
 * wind vane that speeds up and slows down rather than spinning uniformly. */
export function HobbiesHut({ position }: { position: [number, number, number] }) {
  const portholeMatRef = useRef<THREE.MeshToonMaterial>(null);
  const vaneRef = useRef<THREE.Group>(null);
  const vaneAngle = useRef(0);
  const hue = useRef(0);
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  useFrame((_state, delta) => {
    const clock = _state.clock;
    const t = clock.getElapsedTime();
    // Sine-varying angular speed, per spec, rather than a constant spin.
    const speed = Math.sin(t * 0.5) * 2 + 1;
    vaneAngle.current += speed * delta;
    if (vaneRef.current) vaneRef.current.rotation.y = vaneAngle.current;

    hue.current = (hue.current + delta * 0.05) % 1;
    if (portholeMatRef.current) {
      portholeMatRef.current.color.setHSL(hue.current, 0.6, 0.7);
      portholeMatRef.current.emissive.setHSL(hue.current, 0.6, 0.7);
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <roundedBoxGeometry args={[4, 3.6, 4, 2, 0.28]} />
        <meshToonMaterial color={ACCENT} gradientMap={gradientMap} />
      </mesh>
      <Door position={[0, 1.1, 2.03]} size={[1.0, 1.9]} />

      <mesh position={[0, 2.6, 2.03]}>
        <circleGeometry args={[0.7, 16]} />
        <meshToonMaterial ref={portholeMatRef} color="#88DDFF" emissive="#88DDFF" emissiveIntensity={0.4} gradientMap={gradientMap} />
      </mesh>

      {PALETTE_COLORS.map((color, i) => (
        <mesh key={color} position={[-1.7 + i * 0.5, 3.2, 2.03]} rotation={[0, 0, (i - 1) * 0.2]}>
          <boxGeometry args={[0.3, 0.3, 0.04]} />
          <meshToonMaterial color={color} gradientMap={gradientMap} />
        </mesh>
      ))}

      {/* Asymmetric roof — two independent sloped planes, one steeper. */}
      <mesh position={[-0.6, 4.2, 0]} rotation={[0, 0, 0.55]} castShadow>
        <boxGeometry args={[3.2, 0.15, 4.3]} />
        <meshToonMaterial color="#B87A18" gradientMap={gradientMap} />
      </mesh>
      <mesh position={[1.1, 4.0, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[2.6, 0.15, 4.3]} />
        <meshToonMaterial color="#B87A18" gradientMap={gradientMap} />
      </mesh>

      {/* Wind vane on the roof ridge. */}
      <group ref={vaneRef} position={[0, 5.0, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 5]} />
          <meshToonMaterial color="#3A2E1F" gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0.35, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.12, 0.7, 3]} />
          <meshToonMaterial color="#3A2E1F" gradientMap={gradientMap} />
        </mesh>
      </group>

      {/* Leaning wooden sign post out front. */}
      <group position={[3, 0, 2.6]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.8, 6]} />
          <meshToonMaterial color="#5A4230" gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0, 1.6, 0.05]}>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <meshToonMaterial color="#E8D9B0" gradientMap={gradientMap} />
        </mesh>
      </group>
    </group>
  );
}
