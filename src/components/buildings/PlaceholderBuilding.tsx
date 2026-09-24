import type { BuildingDef } from '../../data/buildings';
import { terrainHeightAt } from '../world/Terrain';
import { PAD_HEIGHT } from '../world/BuildingPad';

/** Simple box stand-in per the build order (step 6) — each building gets
 * its own distinct procedural shape once the interaction loop is proven
 * (step 10 in the spec's numbering). */
export function PlaceholderBuilding({ building }: { building: BuildingDef }) {
  const [x, , z] = building.position;
  const padTop = terrainHeightAt(x, z) + PAD_HEIGHT;
  return (
    <mesh position={[x, padTop + building.height / 2, z]} castShadow name={building.id}>
      <boxGeometry args={[3, building.height, 3]} />
      <meshLambertMaterial color={building.color} />
    </mesh>
  );
}
