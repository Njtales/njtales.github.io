import type { ReactNode } from 'react';

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
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[size[0], size[1], 0.05]} />
      <meshLambertMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
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
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[size[0], size[1], 0.05]} />
      <meshLambertMaterial color="#2C1810" />
    </mesh>
  );
}

export function BuildingGroup({ position, children }: { position: [number, number, number]; children: ReactNode }) {
  return <group position={position}>{children}</group>;
}
