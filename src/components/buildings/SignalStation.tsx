import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Door } from './shared';

const ACCENT = '#3A5F8A';
const TRIM = '#4A7FAA';

export function SignalStation({ position }: { position: [number, number, number] }) {
  const dishRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Oscillates back and forth rather than spinning continuously — reads
    // as a dish scanning, per spec.
    if (dishRef.current) dishRef.current.rotation.y = Math.sin((t / 4) * Math.PI * 2) * 0.26;
    if (lightRef.current) {
      const on = t % 1.5 < 1; // 1s on, 0.5s off
      (lightRef.current.material as THREE.MeshLambertMaterial).emissiveIntensity = on ? 1 : 0;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[7, 7, 7]} />
        <meshLambertMaterial color={ACCENT} />
      </mesh>

      <mesh position={[-1.8, 4, 3.51]}>
        <boxGeometry args={[2, 1.4, 0.05]} />
        <meshLambertMaterial color="#4488FF" emissive="#4488FF" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[1.8, 4, 3.51]}>
        <boxGeometry args={[2, 1.4, 0.05]} />
        <meshLambertMaterial color="#4488FF" emissive="#4488FF" emissiveIntensity={0.4} />
      </mesh>
      <Door position={[0, 2.2, 3.51]} size={[2, 3.5]} />

      {/* Antenna tower — base, mid, top, rising to ~12 units. */}
      <mesh position={[0, 9, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
        <meshLambertMaterial color={TRIM} />
      </mesh>
      <mesh position={[0, 11.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 3, 6]} />
        <meshLambertMaterial color={TRIM} />
      </mesh>
      <mesh position={[0, 14, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 3, 6]} />
        <meshLambertMaterial color={TRIM} />
      </mesh>

      {/* Cross-braced struts at 3 levels. */}
      {[-1, 0, 1].map((level) => (
        <group key={level} position={[0, 9.5 + (level + 1) * 1.5, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]} position={[-0.8, 0, 0]}>
            <boxGeometry args={[1.5, 0.08, 0.08]} />
            <meshLambertMaterial color={TRIM} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]} position={[0.8, 0, 0]}>
            <boxGeometry args={[1.5, 0.08, 0.08]} />
            <meshLambertMaterial color={TRIM} />
          </mesh>
        </group>
      ))}

      {/* Blinking nav light at the antenna tip. */}
      <mesh ref={lightRef} position={[0, 15.5, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshLambertMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={1} />
      </mesh>

      {/* Satellite dish, angled upward, slowly scanning side to side. */}
      <group ref={dishRef} position={[-3.6, 5, 0]}>
        <mesh rotation={[0, 0, Math.PI * 0.25]}>
          <circleGeometry args={[1.2, 12]} />
          <meshLambertMaterial color="#5A7FAA" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI * 0.5]}>
          <coneGeometry args={[0.8, 0.8, 12]} />
          <meshLambertMaterial color={TRIM} />
        </mesh>
      </group>
    </group>
  );
}
