import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Door } from './shared';

const ACCENT = '#2E7D9E';
const ROOF_COLOR = '#4AACCB';

/** A wobbly, slightly-leaning stack of 3 box floors with a conical roof —
 * the "precarious lean" comes from alternating a few degrees of rotation
 * floor to floor, not from any offset (which would fight the door/window
 * alignment on each floor's front face). */
export function DataTower({ position }: { position: [number, number, number] }) {
  const gearRef = useRef<THREE.Mesh>(null);
  const windowRefs = useRef<THREE.MeshLambertMaterial[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (gearRef.current) gearRef.current.rotation.z = (t / 4) * Math.PI * 2;
    const pulse = 0.3 + (Math.sin((t / 3) * Math.PI * 2) * 0.5 + 0.5) * 0.3;
    for (const mat of windowRefs.current) if (mat) mat.emissiveIntensity = pulse;
  });

  const floorHeight = 2.6;
  const floors = [0, 1, 2];

  return (
    <group position={position}>
      {floors.map((i) => (
        <group key={i} position={[0, i * floorHeight + floorHeight / 2, 0]} rotation={[0, (i % 2 === 0 ? 1 : -1) * 0.05, 0]}>
          <mesh castShadow>
            <roundedBoxGeometry args={[3, floorHeight, 3, 2, 0.22]} />
            <meshLambertMaterial color={ACCENT} />
          </mesh>
          <mesh
            position={[0, 0, 1.53]}
            ref={(m) => {
              if (m) windowRefs.current[i] = m.material as THREE.MeshLambertMaterial;
            }}
          >
            <boxGeometry args={[1.2, 1.0, 0.05]} />
            <meshLambertMaterial color="#88CCFF" emissive="#88CCFF" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}

      <Door position={[0, 0.85, 1.53]} />

      {/* Conical roof on top of the third floor. */}
      <mesh position={[0, floors.length * floorHeight + 0.8, 0]} castShadow>
        <coneGeometry args={[2.2, 1.6, 4]} />
        <meshLambertMaterial color={ROOF_COLOR} />
      </mesh>

      {/* Side gear — a flattened box spinning on its own face-normal axis. */}
      <mesh ref={gearRef} position={[1.6, floorHeight * 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.12]} />
        <meshLambertMaterial color="#B7AB98" />
      </mesh>
    </group>
  );
}
