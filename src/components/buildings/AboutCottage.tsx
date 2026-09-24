import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Door } from './shared';

const ACCENT = '#C0392B';
const ROOF = '#8C2A1F';
const SHUTTER = '#7A241C';

const FLOWERS: { x: number; color: string }[] = [
  { x: -0.25, color: '#FF6688' },
  { x: 0, color: '#FFEE44' },
  { x: 0.25, color: '#FF6688' },
];

/** The most "home-like" building — pitched roof with overhang, a static
 * stone chimney, a small porch platform, shuttered windows, and flower
 * boxes under each one. */
export function AboutCottage({ position }: { position: [number, number, number] }) {
  const windowMatRefs = useRef<THREE.MeshLambertMaterial[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.2 + (Math.sin((t / 4) * Math.PI * 2) * 0.5 + 0.5) * 0.2;
    for (const mat of windowMatRefs.current) if (mat) mat.emissiveIntensity = pulse;
  });

  function FlowerBox({ x }: { x: number }) {
    return (
      <group position={[x, 1.55, 2.15]}>
        <mesh>
          <boxGeometry args={[0.9, 0.2, 0.25]} />
          <meshLambertMaterial color="#5A4230" />
        </mesh>
        {FLOWERS.map((f, i) => (
          <mesh key={i} position={[f.x, 0.15, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshLambertMaterial color={f.color} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={position}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <roundedBoxGeometry args={[4.5, 3.2, 4, 2, 0.28]} />
        <meshLambertMaterial color={ACCENT} />
      </mesh>
      <Door position={[0, 1.1, 2.03]} size={[1.0, 1.9]} />

      {[-1.3, 1.3].map((x) => (
        <group key={x}>
          <mesh
            position={[x, 2.1, 2.03]}
            ref={(m) => {
              if (m) windowMatRefs.current[x < 0 ? 0 : 1] = m.material as THREE.MeshLambertMaterial;
            }}
          >
            <boxGeometry args={[0.8, 0.8, 0.05]} />
            <meshLambertMaterial color="#FFCC88" emissive="#FFCC88" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[x - 0.5, 2.1, 2.04]}>
            <boxGeometry args={[0.12, 0.85, 0.04]} />
            <meshLambertMaterial color={SHUTTER} />
          </mesh>
          <mesh position={[x + 0.5, 2.1, 2.04]}>
            <boxGeometry args={[0.12, 0.85, 0.04]} />
            <meshLambertMaterial color={SHUTTER} />
          </mesh>
          <FlowerBox x={x} />
        </group>
      ))}

      {/* Pitched roof — two sloped planes meeting at a ridge, with overhang. */}
      <mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.6, 1.8, 4]} />
        <meshLambertMaterial color={ROOF} />
      </mesh>

      {/* Stone chimney, static, no smoke. */}
      <mesh position={[1.6, 4.6, -1]} castShadow>
        <boxGeometry args={[0.5, 2.2, 0.5]} />
        <meshLambertMaterial color="#8A8478" />
      </mesh>

      {/* Small porch platform in front of the door. */}
      <mesh position={[0, 0.08, 2.8]} receiveShadow>
        <boxGeometry args={[2.2, 0.16, 1.2]} />
        <meshLambertMaterial color="#6B5340" />
      </mesh>
    </group>
  );
}
