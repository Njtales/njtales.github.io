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

// Positions deliberately avoid a uniform radius/angle spread around spawn —
// an earlier version placed every building at a 15-23 unit radius, which,
// combined with dead-straight spawn-to-building paths, read as an obvious
// spoke wheel from the follow camera's overhead-leaning angle. These vary
// from ~13 to ~27 units out and cluster loosely by direction (matched by
// Paths.tsx's hub grouping) for a more organic town feel.
export const BUILDINGS: BuildingDef[] = [
  {
    id: 'projects',
    name: 'The Data Tower',
    panelHeader: 'Projects',
    position: [22, 0, -14],
    color: '#2E7D9E',
    height: 10,
  },
  {
    id: 'techstack',
    name: 'The Cloud Forge',
    panelHeader: 'Tech Stack',
    position: [-13, 0, -6],
    color: '#D4602A',
    height: 6,
  },
  {
    id: 'experience',
    name: 'The Career Clocktower',
    panelHeader: 'Experience',
    position: [8, 0, -26],
    color: '#7B3F8C',
    height: 14,
  },
  {
    id: 'learning',
    name: 'The Learning Lab',
    panelHeader: 'Currently Learning',
    position: [-9, 0, 9],
    color: '#2A9D6F',
    height: 7,
  },
  {
    id: 'about',
    name: 'The About Cottage',
    panelHeader: 'About Niro',
    position: [15, 0, 8],
    color: '#C0392B',
    height: 6,
  },
  {
    id: 'hobbies',
    name: 'The Hobbies Hut',
    panelHeader: 'Beyond the Code',
    position: [-24, 0, 10],
    color: '#E8A020',
    height: 6,
  },
  {
    id: 'contact',
    name: 'The Signal Station',
    panelHeader: 'Get in Touch',
    position: [3, 0, 24],
    color: '#3A5F8A',
    height: 7,
  },
];

export function getBuilding(id: BuildingId): BuildingDef {
  const building = BUILDINGS.find((b) => b.id === id);
  if (!building) throw new Error(`Unknown building id: ${id}`);
  return building;
}
