import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { getToonGradientMap } from '../../materials/toonGradient';

/** A flat emissive quad — used as a window on every building. Faces +Z by
 * default (front); pass a `rotation` to place it on a different wall. */
export function Window({
  position,
  size = [0.9, 0.7],
  color,
  emissiveIntensity = 0.4,
  rotation,
}: {
  position: [number, number, number];
  size?: [number, number];
  color: string;
  emissiveIntensity?: number;
  rotation?: [number, number, number];
}) {
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[size[0], size[1], 0.05]} />
      <meshToonMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} gradientMap={gradientMap} />
    </mesh>
  );
}

/** A flat dark door quad, same convention as Window. */
export function Door({
  position,
  size = [1.0, 1.7],
  rotation,
}: {
  position: [number, number, number];
  size?: [number, number];
  rotation?: [number, number, number];
}) {
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[size[0], size[1], 0.05]} />
      <meshToonMaterial color="#2C1810" gradientMap={gradientMap} />
    </mesh>
  );
}

export function BuildingGroup({ position, children }: { position: [number, number, number]; children: ReactNode }) {
  return <group position={position}>{children}</group>;
}
