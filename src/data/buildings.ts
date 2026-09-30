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

// Repositioned into a tight clustered "village" per the reference-image
// mapping, replacing the earlier loose radial spread entirely:
// - Clocktower (experience): back-left, the tallest anchor of the skyline.
// - Cloud Forge (techstack): front-left, immediately adjacent to Clocktower.
// - Data Tower (projects): center, the main hub — Clocktower on its left,
//   About Cottage on its right, pads nearly touching all three.
// - Learning Lab (learning): isolated ~7 units off the core cluster's
//   west side, meant to sit apart with foliage filling the gap.
// - About Cottage (about) + Hobbies Hut (hobbies): a close cosy pair
//   right of Data Tower.
// - Signal Station (contact): centre-right, between Data Tower and the
//   About/Hobbies pair — a waypoint, not deep in the cluster.
// Paths.tsx's hub was moved/re-clustered to match (single "village" hub
// close to the core six, Signal Station branching straight from spawn
// since it's too close to the hub for a hub-branch's own clearance trim).
export const BUILDINGS: BuildingDef[] = [
  {
    id: 'projects',
    name: 'The Data Tower',
    panelHeader: 'Projects',
    position: [1, 0, -9],
    color: '#2E7D9E',
    height: 10,
  },
  {
    id: 'techstack',
    name: 'The Cloud Forge',
    panelHeader: 'Tech Stack',
    position: [-4.5, 0, -7],
    color: '#D4602A',
    height: 6,
  },
  {
    id: 'experience',
    name: 'The Career Clocktower',
    panelHeader: 'Experience',
    position: [-3, 0, -10],
    color: '#7B3F8C',
    height: 14,
  },
  {
    id: 'learning',
    name: 'The Learning Lab',
    panelHeader: 'Currently Learning',
    position: [-11, 0, -6],
    color: '#2A9D6F',
    height: 7,
  },
  {
    id: 'about',
    name: 'The About Cottage',
    panelHeader: 'About Niro',
    position: [5, 0, -8],
    color: '#C0392B',
    height: 6,
  },
  {
    id: 'hobbies',
    name: 'The Hobbies Hut',
    panelHeader: 'Beyond the Code',
    position: [7.5, 0, -6],
    color: '#E8A020',
    height: 6,
  },
  {
    id: 'contact',
    name: 'The Signal Station',
    panelHeader: 'Get in Touch',
    position: [3.5, 0, -6.5],
    color: '#3A5F8A',
    height: 7,
  },
];

export function getBuilding(id: BuildingId): BuildingDef {
  const building = BUILDINGS.find((b) => b.id === id);
  if (!building) throw new Error(`Unknown building id: ${id}`);
  return building;
}
