import type { ComponentType } from 'react';
import { Billboard, Text } from '@react-three/drei';
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

// Buildings were originally sized for a person-scale character (doors
// ~1.7-3.5 units tall). Against the new chibi fox (~1.05 units, big head
// small body) they read as multi-story towers dwarfing the player. Scaling
// every building down by one factor keeps their relative sizes intact
// (the Clocktower is still the tallest, the Cottage still the smallest)
// while bringing them into a "dollhouse next to the character" range
// instead of a "skyscraper next to the character" one.
const BUILDING_SCALE = 0.42;

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
            <group position={[x, padTop, z]} scale={BUILDING_SCALE}>
              <Building position={[0, 0, 0]} />
            </group>
            <Billboard position={[x, padTop + building.height * BUILDING_SCALE + 0.9, z]}>
              <Text fontSize={0.4} color="#FFFFFF" outlineWidth={0.025} outlineColor="#3A2E1F" anchorX="center" anchorY="middle">
                {building.name}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </>
  );
}
