import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Door } from './shared';
import { getToonGradientMap } from '../../materials/toonGradient';

const ACCENT = '#7B3F8C';
const TRIM = '#9A5FAE';

/** Tallest building (~14 units) — a slim base, a ledge partway up, a belfry
 * top, and a spire, with a real-time analog clock face on the front. */
export function CareerClocktower({ position }: { position: [number, number, number] }) {
  const minuteRef = useRef<THREE.Mesh>(null);
  const hourRef = useRef<THREE.Mesh>(null);
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (minuteRef.current) minuteRef.current.rotation.z = -(t / 60) * Math.PI * 2;
    if (hourRef.current) hourRef.current.rotation.z = -(t / 720) * Math.PI * 2;
  });

  return (
    <group position={position}>
      {/* Slim rectangular base. */}
      <mesh position={[0, 4, 0]} castShadow>
        <roundedBoxGeometry args={[3, 8, 3, 2, 0.22]} />
        <meshToonMaterial color={ACCENT} gradientMap={gradientMap} />
      </mesh>
      <Door position={[0, 0.85, 1.53]} />

      {/* Decorative ledge partway up. */}
      <mesh position={[0, 8.2, 0]} castShadow>
        <boxGeometry args={[3.5, 0.4, 3.5]} />
        <meshToonMaterial color={TRIM} gradientMap={gradientMap} />
      </mesh>

      {/* Belfry top — narrower box sitting directly on the ledge, no gap. */}
      <mesh position={[0, 9.8, 0]} castShadow>
        <roundedBoxGeometry args={[2.2, 2.8, 2.2, 2, 0.18]} />
        <meshToonMaterial color={ACCENT} gradientMap={gradientMap} />
      </mesh>

      {/* Clock face on the belfry's front. */}
      <group position={[0, 9.6, 1.13]}>
        <mesh>
          <circleGeometry args={[1.0, 20]} />
          <meshToonMaterial color="#F0E8C8" gradientMap={gradientMap} />
        </mesh>
        <mesh ref={minuteRef} position={[0, 0, 0.03]}>
          <boxGeometry args={[0.06, 0.85, 0.03]} />
          <meshToonMaterial color="#2C1810" gradientMap={gradientMap} />
        </mesh>
        <mesh ref={hourRef} position={[0, 0, 0.04]}>
          <boxGeometry args={[0.08, 0.55, 0.03]} />
          <meshToonMaterial color="#2C1810" gradientMap={gradientMap} />
        </mesh>
      </group>

      {/* Pointed spire, sitting directly on the belfry. */}
      <mesh position={[0, 12.2, 0]} castShadow>
        <coneGeometry args={[1.6, 2, 4]} />
        <meshToonMaterial color={TRIM} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}
