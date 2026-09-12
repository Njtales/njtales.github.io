export type ZoneId =
  | 'about'
  | 'arcade'
  | 'sketch'
  | 'work'
  | 'projects'
  | 'skills'
  | 'contact';

export interface ZoneMetric {
  value: string;
  label: string;
}

export interface ZoneLink {
  label: string;
  url: string;
}

export interface Zone {
  id: ZoneId;
  kicker: string;
  title: string;
  description: string;
  accentColor: string;
  /** World-space position on the ground plane (x, z). y is derived from building height. */
  position: { x: number; z: number };
  /** Footprint used to size the extruded building block. */
  footprint: { width: number; depth: number; height: number };
  /** Radius within which the character auto-opens this zone's detail panel. */
  triggerRadius: number;
  metrics?: ZoneMetric[];
  stackChips?: string[];
  links?: ZoneLink[];
}

/** Spawn point at the town Gate — not a Zone (no detail panel), just the hero moment. */
export const GATE_POSITION = { x: 0, z: 0 };

export const ZONES: Zone[] = [
  {
    id: 'about',
    kicker: 'About',
    title: 'Market Street',
    description: 'Eight years, one habit: make the boring parts invisible.',
    accentColor: '#5adbb0',
    position: { x: 0, z: -18 },
    footprint: { width: 6, depth: 5, height: 4 },
    triggerRadius: 7,
    metrics: [
      { value: '8 yrs', label: 'in production systems' },
      { value: '99.98%', label: 'best sustained uptime' },
    ],
  },
  {
    id: 'arcade',
    kicker: 'Hobby',
    title: 'Arcade Corner',
    description: 'PS5, story-driven games, and the occasional 40-hour weekend binge.',
    accentColor: '#7c93ff',
    position: { x: -14, z: -24 },
    footprint: { width: 4, depth: 4, height: 3.5 },
    triggerRadius: 5.5,
  },
  {
    id: 'sketch',
    kicker: 'Hobby',
    title: 'Sketch Nook',
    description: 'A small gallery of horror sketches — pencil, ink, and a steady hand.',
    accentColor: '#c9536b',
    position: { x: -24, z: -22 },
    footprint: { width: 4, depth: 4, height: 3.5 },
    triggerRadius: 5.5,
  },
  {
    id: 'work',
    kicker: 'Work History',
    title: 'Tech Lane',
    description:
      'Bloomberg, plus past roles across fintech and e-commerce. Recruiters at Bloomberg responded well to how interactive the last version of this site was — this one leans in further.',
    accentColor: '#5ab0f0',
    position: { x: 0, z: -38 },
    footprint: { width: 7, depth: 6, height: 5.5 },
    triggerRadius: 8,
    // TODO: replace with real role history (company, title, years, one-line impact per stop)
    stackChips: ['Bloomberg', 'Fintech', 'E-commerce'],
  },
  {
    id: 'projects',
    kicker: 'Projects',
    title: 'Workshop District',
    description:
      'The proof area. Four case studies, each a system pushed from "working" to "boring" — in the good way.',
    accentColor: '#e08fd7',
    position: { x: 26, z: -46 },
    footprint: { width: 10, depth: 9, height: 8 },
    triggerRadius: 10,
    // TODO: replace all four metrics below with real, verifiable numbers before go-live
    metrics: [
      { value: '800ms → 120ms', label: 'p99 latency (placeholder)' },
      { value: '−60%', label: 'warehouse cost (placeholder)' },
      { value: '−55%', label: 'idle compute (placeholder)' },
      { value: '20min → 90s', label: 'incident detection (placeholder)' },
    ],
    stackChips: ['AWS', 'Terraform', 'Airflow', 'Python'],
  },
  {
    id: 'skills',
    kicker: 'Skill Tower',
    title: 'The Tower',
    description:
      'Skills as physical landmarks: AWS as the power node, SQL as the data-table board, Terraform as the blueprint desk, Airflow as the route planner.',
    accentColor: '#f2ac4a',
    position: { x: 6, z: -58 },
    footprint: { width: 5, depth: 5, height: 16 },
    triggerRadius: 9,
    metrics: [
      { value: '7 yrs', label: 'AWS' },
      { value: '6 yrs', label: 'Terraform' },
      { value: '8 yrs', label: 'Python / SQL' },
    ],
  },
  {
    id: 'contact',
    kicker: 'Contact',
    title: 'The Station',
    description: 'End of the line. Say hello.',
    accentColor: '#7c93ff',
    position: { x: 0, z: -78 },
    footprint: { width: 5, depth: 5, height: 6 },
    triggerRadius: 8,
    links: [
      { label: 'Email', url: 'mailto:nikhiljatale@gmail.com' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/nikhil-jatale/' },
      { label: 'GitHub', url: 'https://github.com/njtales' },
      { label: 'Résumé', url: '/assets/resume.pdf' },
    ],
  },
];

export function getZone(id: ZoneId): Zone {
  const zone = ZONES.find((z) => z.id === id);
  if (!zone) throw new Error(`Unknown zone id: ${id}`);
  return zone;
}
