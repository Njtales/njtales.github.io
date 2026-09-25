import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Door } from './shared';
import { getToonGradientMap } from '../../materials/toonGradient';

const ACCENT = '#3A5F8A';
const TRIM = '#4A7FAA';

export function SignalStation({ position }: { position: [number, number, number] }) {
  const dishRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Mesh>(null);
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Oscillates back and forth rather than spinning continuously — reads
    // as a dish scanning, per spec.
    if (dishRef.current) dishRef.current.rotation.y = Math.sin((t / 4) * Math.PI * 2) * 0.26;
    if (lightRef.current) {
      const on = t % 1.5 < 1; // 1s on, 0.5s off
      (lightRef.current.material as THREE.MeshToonMaterial).emissiveIntensity = on ? 1 : 0;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 3.5, 0]} castShadow>
        <roundedBoxGeometry args={[7, 7, 7, 2, 0.4]} />
        <meshToonMaterial color={ACCENT} gradientMap={gradientMap} />
      </mesh>

      <mesh position={[-1.8, 4, 3.51]}>
        <boxGeometry args={[2, 1.4, 0.05]} />
        <meshToonMaterial color="#4488FF" emissive="#4488FF" emissiveIntensity={0.4} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[1.8, 4, 3.51]}>
        <boxGeometry args={[2, 1.4, 0.05]} />
        <meshToonMaterial color="#4488FF" emissive="#4488FF" emissiveIntensity={0.4} gradientMap={gradientMap} />
      </mesh>
      <Door position={[0, 2.2, 3.51]} size={[2, 3.5]} />

      {/* Antenna tower — base, mid, top, rising to ~12 units. */}
      <mesh position={[0, 9, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
        <meshToonMaterial color={TRIM} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 11.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 3, 6]} />
        <meshToonMaterial color={TRIM} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 14, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 3, 6]} />
        <meshToonMaterial color={TRIM} gradientMap={gradientMap} />
      </mesh>

      {/* Cross-braced struts at 3 levels. */}
      {[-1, 0, 1].map((level) => (
        <group key={level} position={[0, 9.5 + (level + 1) * 1.5, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.8, 0, 0]}>
            <boxGeometry args={[1.5, 0.08, 0.08]} />
            <meshToonMaterial color={TRIM} gradientMap={gradientMap} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[0.8, 0, 0]}>
            <boxGeometry args={[1.5, 0.08, 0.08]} />
            <meshToonMaterial color={TRIM} gradientMap={gradientMap} />
          </mesh>
        </group>
      ))}

      {/* Blinking nav light at the antenna tip. */}
      <mesh ref={lightRef} position={[0, 15.5, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshToonMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={1} gradientMap={gradientMap} />
      </mesh>

      {/* Satellite dish, angled upward, slowly scanning side to side. */}
      <group ref={dishRef} position={[-3.6, 5, 0]}>
        <mesh rotation={[0, 0, Math.PI * 0.25]}>
          <circleGeometry args={[1.2, 12]} />
          <meshToonMaterial color="#5A7FAA" side={THREE.DoubleSide} gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI * 0.5]}>
          <coneGeometry args={[0.8, 0.8, 12]} />
          <meshToonMaterial color={TRIM} gradientMap={gradientMap} />
        </mesh>
      </group>
    </group>
  );
}
