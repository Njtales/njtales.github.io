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
// in radius and cluster loosely by direction (matched by Paths.tsx's hub
// grouping) for a more organic town feel.
//
// Compressed to ~65% of the original spread ("make buildings even closer")
// — same relative layout/clustering, shorter walks between them. Paths.tsx's
// HUBS were scaled by the same factor, and PAD_CLEARANCE was trimmed from
// PAD_RADIUS+3 to PAD_RADIUS+1.5 since a couple of hub-to-building branches
// would otherwise have ended up shorter than the old clearance margin.
export const BUILDINGS: BuildingDef[] = [
  {
    id: 'projects',
    name: 'The Data Tower',
    panelHeader: 'Projects',
    position: [14.3, 0, -9.1],
    color: '#2E7D9E',
    height: 10,
  },
  {
    id: 'techstack',
    name: 'The Cloud Forge',
    panelHeader: 'Tech Stack',
    position: [-8.45, 0, -3.9],
    color: '#D4602A',
    height: 6,
  },
  {
    id: 'experience',
    name: 'The Career Clocktower',
    panelHeader: 'Experience',
    position: [5.2, 0, -16.9],
    color: '#7B3F8C',
    height: 14,
  },
  {
    id: 'learning',
    name: 'The Learning Lab',
    panelHeader: 'Currently Learning',
    position: [-5.85, 0, 5.85],
    color: '#2A9D6F',
    height: 7,
  },
  {
    id: 'about',
    name: 'The About Cottage',
    panelHeader: 'About Niro',
    position: [9.75, 0, 5.2],
    color: '#C0392B',
    height: 6,
  },
  {
    id: 'hobbies',
    name: 'The Hobbies Hut',
    panelHeader: 'Beyond the Code',
    position: [-15.6, 0, 6.5],
    color: '#E8A020',
    height: 6,
  },
  {
    id: 'contact',
    name: 'The Signal Station',
    panelHeader: 'Get in Touch',
    position: [1.95, 0, 15.6],
    color: '#3A5F8A',
    height: 7,
  },
];

export function getBuilding(id: BuildingId): BuildingDef {
  const building = BUILDINGS.find((b) => b.id === id);
  if (!building) throw new Error(`Unknown building id: ${id}`);
  return building;
}
