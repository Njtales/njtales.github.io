import { terrainHeightAt } from './Terrain';

const PAD_RADIUS = 4;
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
  return (
    <mesh position={[x, y, z]} receiveShadow name={`pad-${x}-${z}`}>
      <cylinderGeometry args={[PAD_RADIUS, PAD_RADIUS, PAD_HEIGHT, 8]} />
      <meshLambertMaterial color={PAD_COLOR} />
    </mesh>
  );
}

export { PAD_RADIUS, PAD_HEIGHT };
