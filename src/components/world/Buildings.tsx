import type { ComponentType } from 'react';
import { BUILDINGS } from '../../data/buildings';
import { BuildingPad, PAD_HEIGHT } from './BuildingPad';
import { terrainHeightAt } from './Terrain';
import type { BuildingId } from '../../store/useStore';
import { DataTower } from '../buildings/DataTower';
import { CloudForge } from '../buildings/CloudForge';
import { CareerClocktower } from '../buildings/CareerClocktower';
import { LearningLab } from '../buildings/LearningLab';
import { AboutCottage } from '../buildings/AboutCottage';
import { HobbiesHut } from '../buildings/HobbiesHut';
import { SignalStation } from '../buildings/SignalStation';

const BUILDING_COMPONENTS: Record<BuildingId, ComponentType<{ position: [number, number, number] }>> = {
  projects: DataTower,
  techstack: CloudForge,
  experience: CareerClocktower,
  learning: LearningLab,
  about: AboutCottage,
  hobbies: HobbiesHut,
  contact: SignalStation,
};

export function Buildings() {
  return (
    <>
      {BUILDINGS.map((building) => {
        const [x, , z] = building.position;
        const padTop = terrainHeightAt(x, z) + PAD_HEIGHT;
        const Building = BUILDING_COMPONENTS[building.id];
        return (
          <group key={building.id}>
            <BuildingPad x={x} z={z} />
            <Building position={[x, padTop, z]} />
          </group>
        );
      })}
    </>
  );
}
