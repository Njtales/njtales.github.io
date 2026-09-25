import { useMemo } from 'react';
import { terrainHeightAt } from './Terrain';
import { getToonGradientMap } from '../../materials/toonGradient';

// Shrunk from 4 alongside the building scale-down in Buildings.tsx (see
// BUILDING_SCALE there) — at the old radius the pad read as an oversized
// plaza under a now much smaller building.
const PAD_RADIUS = 2.2;
const PAD_HEIGHT = 0.1;
const PAD_COLOR = '#A89878';

/**
 * The flat stone disc every building sits on, raised 0.1 units above the
 * terrain height sampled at its own center — this is what keeps a building
 * level regardless of the rolling terrain around it, without needing the
 * terrain mesh itself to flatten out near buildings.
 */
export function BuildingPad({ x, z }: { x: number; z: number }) {
  const y = terrainHeightAt(x, z) + PAD_HEIGHT / 2;
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  return (
    <mesh position={[x, y, z]} receiveShadow name={`pad-${x}-${z}`}>
      <cylinderGeometry args={[PAD_RADIUS, PAD_RADIUS, PAD_HEIGHT, 8]} />
      <meshToonMaterial color={PAD_COLOR} gradientMap={gradientMap} />
    </mesh>
  );
}

export { PAD_RADIUS, PAD_HEIGHT };
