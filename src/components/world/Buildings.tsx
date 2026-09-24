import { BUILDINGS } from '../../data/buildings';
import { BuildingPad } from './BuildingPad';
import { PlaceholderBuilding } from '../buildings/PlaceholderBuilding';

export function Buildings() {
  return (
    <>
      {BUILDINGS.map((building) => (
        <group key={building.id}>
          <BuildingPad x={building.position[0]} z={building.position[2]} />
          <PlaceholderBuilding building={building} />
        </group>
      ))}
    </>
  );
}
