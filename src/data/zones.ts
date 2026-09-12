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
    description:
      'Since 2017, one habit: make the boring parts invisible. Real-time sign language recognition, an S&P 500 data pipeline, two Employee of the Month awards along the way — and a lot of pipelines nobody had to think about twice.',
    accentColor: '#5adbb0',
    position: { x: 0, z: -18 },
    footprint: { width: 6, depth: 5, height: 4 },
    triggerRadius: 7,
    metrics: [
      { value: '9 yrs', label: 'in production systems' },
      { value: '99%', label: 'sustained pipeline uptime' },
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
      "Joined Bloomberg in February 2024 as Enterprise Data Support, promoted to Generalist in 2025 and Specialist in 2026. Before that: an MSc in Big Data Science at Queen Mary University of London, three years at Addicor Tech, and ETL/Python work at Syntel. Recruiters at Bloomberg responded well to how interactive the last version of this site was — this one leans in further.",
    accentColor: '#5ab0f0',
    position: { x: 0, z: -38 },
    footprint: { width: 7, depth: 6, height: 5.5 },
    triggerRadius: 8,
    metrics: [
      { value: 'Feb 2024', label: 'joined Bloomberg' },
      { value: '2 promotions', label: 'in under 2 years' },
    ],
    // TODO: day-to-day scope/impact of the Bloomberg role is intentionally left blank for now
    stackChips: ['Bloomberg', 'Addicor Tech', 'Syntel'],
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
      { label: 'GitHub', url: 'https://github.com/Njtales' },
      // TODO: this CV link is from the 2023 portfolio — swap for a current résumé before go-live
      { label: 'Résumé', url: 'https://drive.google.com/u/0/uc?id=13-tDlVWG-pxoFauC-3F4306K1yCmPcGt&export=download' },
    ],
  },
];

export function getZone(id: ZoneId): Zone {
  const zone = ZONES.find((z) => z.id === id);
  if (!zone) throw new Error(`Unknown zone id: ${id}`);
  return zone;
}
