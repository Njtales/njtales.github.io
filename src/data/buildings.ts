import type { BuildingId } from '../store/useStore';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  panelHeader: string;
  position: [number, number, number];
  color: string;
  /** Building footprint height, used to size the placeholder box (real
   * geometry replaces this per-building later in the build order). */
  height: number;
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'projects',
    name: 'The Data Tower',
    panelHeader: 'Projects',
    position: [18, 0, -10],
    color: '#2E7D9E',
    height: 10,
  },
  {
    id: 'techstack',
    name: 'The Cloud Forge',
    panelHeader: 'Tech Stack',
    position: [-15, 0, -8],
    color: '#D4602A',
    height: 6,
  },
  {
    id: 'experience',
    name: 'The Career Clocktower',
    panelHeader: 'Experience',
    position: [5, 0, -22],
    color: '#7B3F8C',
    height: 14,
  },
  {
    id: 'learning',
    name: 'The Learning Lab',
    panelHeader: 'Currently Learning',
    position: [-10, 0, 12],
    color: '#2A9D6F',
    height: 7,
  },
  {
    id: 'about',
    name: 'The About Cottage',
    panelHeader: 'About Niro',
    position: [12, 0, 10],
    color: '#C0392B',
    height: 6,
  },
  {
    id: 'hobbies',
    name: 'The Hobbies Hut',
    panelHeader: 'Beyond the Code',
    position: [-20, 0, 5],
    color: '#E8A020',
    height: 6,
  },
  {
    id: 'contact',
    name: 'The Signal Station',
    panelHeader: 'Get in Touch',
    position: [0, 0, 18],
    color: '#3A5F8A',
    height: 7,
  },
];

export function getBuilding(id: BuildingId): BuildingDef {
  const building = BUILDINGS.find((b) => b.id === id);
  if (!building) throw new Error(`Unknown building id: ${id}`);
  return building;
}
