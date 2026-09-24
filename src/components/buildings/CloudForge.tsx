import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Door } from './shared';

const ACCENT = '#D4602A';
const SMOKE_COUNT = 20;
const SMOKE_RISE_TIME = 3; // seconds for one particle's rise-and-fade cycle

export function CloudForge({ position }: { position: [number, number, number] }) {
  const fanRef = useRef<THREE.Mesh>(null);
  const smokeRef = useRef<THREE.Points>(null);
  // Each particle gets its own random phase offset and horizontal drift so
  // the 20 of them don't rise in an obviously synchronized column.
  const smokeSeeds = useMemo(
    () => Array.from({ length: SMOKE_COUNT }, () => ({ phase: Math.random() * SMOKE_RISE_TIME, dx: (Math.random() - 0.5) * 0.4, dz: (Math.random() - 0.5) * 0.4 })),
    [],
  );
  const smokeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SMOKE_COUNT * 3), 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (fanRef.current) fanRef.current.rotation.z = t * ((Math.PI * 2) / 1.5);

    const positions = smokeGeometry.attributes.position as THREE.BufferAttribute;
    smokeSeeds.forEach((seed, i) => {
      const local = (t + seed.phase) % SMOKE_RISE_TIME;
      const progress = local / SMOKE_RISE_TIME; // 0 (just spawned) -> 1 (fully risen/faded)
      positions.setXYZ(i, seed.dx * progress * 3, 0.4 + progress * 2.2, seed.dz * progress * 3);
    });
    positions.needsUpdate = true;
    if (smokeRef.current) {
      const mat = smokeRef.current.material as THREE.PointsMaterial;
      // All particles share one material, so opacity can't vary per-point —
      // averaging the fade keeps the whole puff from popping in/out at once.
      mat.opacity = 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Wide, squat body — 1.5x wider than tall. */}
      <mesh position={[0, 3, 0]} castShadow>
        <roundedBoxGeometry args={[8, 6, 5, 2, 0.35]} />
        <meshLambertMaterial color={ACCENT} />
      </mesh>

      <mesh position={[-2, 3.5, 2.53]}>
        <boxGeometry args={[1.8, 1.6, 0.05]} />
        <meshLambertMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[2, 3.5, 2.53]}>
        <boxGeometry args={[1.8, 1.6, 0.05]} />
        <meshLambertMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.3} />
      </mesh>
      <Door position={[0, 1.6, 2.53]} size={[1.4, 2.6]} />

      {/* Chimney + spinning cross fan on top. */}
      <mesh position={[2.5, 6.6, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 1.2, 10]} />
        <meshLambertMaterial color={ACCENT} />
      </mesh>
      <group ref={fanRef} position={[2.5, 7.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.1, 0.04]} />
          <meshLambertMaterial color="#5A4230" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.9, 0.1, 0.04]} />
          <meshLambertMaterial color="#5A4230" />
        </mesh>
      </group>

      {/* Smoke — 20 small points rising and fading, looped. */}
      <points ref={smokeRef} position={[2.5, 7.3, 0]} geometry={smokeGeometry}>
        <pointsMaterial color="#AAAAAA" size={0.35} transparent opacity={0.5} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}
