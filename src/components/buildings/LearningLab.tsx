import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Door } from './shared';

const ACCENT = '#2A9D6F';
const ORBIT_COUNT = 3;
const ORBIT_RADIUS = 2.6; // measured from the dome's center, not its surface
const ORBIT_PERIOD = 6;

/** A cylindrical (rather than boxy) body for a softer, rounded-hut feel,
 * topped with a glowing half-sphere skylight. */
export function LearningLab({ position }: { position: [number, number, number] }) {
  const domeMatRef = useRef<THREE.MeshLambertMaterial>(null);
  const antennaLightRef = useRef<THREE.Mesh>(null);
  const orbitRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (domeMatRef.current) {
      domeMatRef.current.emissiveIntensity = 0.4 + (Math.sin((t / 2) * Math.PI * 2) * 0.5 + 0.5) * 0.4;
    }
    if (antennaLightRef.current) {
      const visible = Math.floor(t % 1) === 0;
      (antennaLightRef.current.material as THREE.MeshLambertMaterial).emissiveIntensity = visible ? 1 : 0;
    }
    orbitRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const angle = (t / ORBIT_PERIOD) * Math.PI * 2 + (i * Math.PI * 2) / ORBIT_COUNT;
      mesh.position.set(Math.cos(angle) * ORBIT_RADIUS, 5.4 + Math.sin(angle * 2) * 0.2, Math.sin(angle) * ORBIT_RADIUS);
    });
  });

  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[2.6, 2.8, 5, 12]} />
        <meshLambertMaterial color={ACCENT} />
      </mesh>
      <Door position={[0, 0.85, 2.65]} />
      <mesh position={[-1.4, 3, 2.6]}>
        <boxGeometry args={[0.9, 0.9, 0.05]} />
        <meshLambertMaterial color="#F0E8C8" />
      </mesh>
      <mesh position={[1.4, 3, 2.6]}>
        <boxGeometry args={[0.9, 0.9, 0.05]} />
        <meshLambertMaterial color="#F0E8C8" />
      </mesh>

      {/* Domed skylight, glowing like a greenhouse. */}
      <mesh position={[0, 5, 0]} castShadow>
        <sphereGeometry args={[2.0, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial ref={domeMatRef} color="#88CCFF" emissive="#88CCFF" emissiveIntensity={0.5} transparent opacity={0.85} />
      </mesh>

      {/* Antenna with a blinking light. */}
      <mesh position={[2.6, 5.8, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.6, 6]} />
        <meshLambertMaterial color="#1A1420" />
      </mesh>
      <mesh ref={antennaLightRef} position={[2.6, 6.7, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshLambertMaterial color="#FF2222" emissive="#FF2222" emissiveIntensity={1} />
      </mesh>

      {/* 3 tetrahedrons slowly orbiting the dome. */}
      {Array.from({ length: ORBIT_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            orbitRefs.current[i] = m;
          }}
        >
          <tetrahedronGeometry args={[0.2]} />
          <meshLambertMaterial color="#FFFFFF" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}
