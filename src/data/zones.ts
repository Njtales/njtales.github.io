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

/** Spawn point at the town Gate — not a Zone (no detail panel), just the hero
 * moment. Set back further from the nearest buildings than a straight offset
 * would suggest, so there's a real approach stretch before reaching the town
 * rather than the gate feeling wedged right up against Market Street. */
export const GATE_POSITION = { x: -8, z: 18 };

export const ZONES: Zone[] = [
  {
    id: 'about',
    kicker: 'About',
    title: 'Market Street',
    description:
      'Since 2017, one habit: make the boring parts invisible. Real-time sign language recognition, an S&P 500 data pipeline, two Employee of the Month awards along the way — and a lot of pipelines nobody had to think about twice.',
    accentColor: '#8cab82',
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
    accentColor: '#8489c7',
    position: { x: -13, z: -10 },
    footprint: { width: 4, depth: 4, height: 3.5 },
    triggerRadius: 5.5,
  },
  {
    id: 'sketch',
    kicker: 'Hobby',
    title: 'Sketch Nook',
    description: 'A small gallery of horror sketches — pencil, ink, and a steady hand.',
    accentColor: '#c06e80',
    position: { x: -10, z: -28 },
    footprint: { width: 4, depth: 4, height: 3.5 },
    triggerRadius: 5.5,
  },
  {
    id: 'work',
    kicker: 'Work History',
    title: 'Tech Lane',
    description:
      "Joined Bloomberg in February 2024 supporting Enterprise Data products — Data License, BPIPE, SAPI — handling troubleshooting and connectivity for enterprise clients, promoted twice since. Before that: an MSc in Big Data Science at Queen Mary University of London, freelance ML work, and data/ETL roles at Addicor Tech, Syntel, and Orbit Tree.",
    accentColor: '#6c93b5',
    position: { x: 15, z: -58 },
    footprint: { width: 7, depth: 6, height: 5.5 },
    triggerRadius: 8,
    metrics: [
      { value: '2 promotions', label: 'since joining Feb 2024' },
      { value: 'Top performer', label: 'highest-rated on the team, globally' },
    ],
    // TODO: day-to-day scope/impact of the Bloomberg role is intentionally left blank for now
    stackChips: ['Bloomberg', 'Data License', 'BPIPE', 'SAPI'],
  },
  {
    id: 'projects',
    kicker: 'Projects',
    title: 'Workshop District',
    description:
      'The proof area. Four case studies, each a system pushed from "working" to "boring" — in the good way.',
    accentColor: '#a6738f',
    position: { x: -2, z: -72 },
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
      'Skills as physical landmarks — the ones already load-bearing, and the one still under construction: Python & SQL as the foundation, data support and orchestration and BI holding up the middle, cloud infrastructure being built out at the top.',
    accentColor: '#e0a855',
    position: { x: 30, z: -48 },
    footprint: { width: 5, depth: 5, height: 16 },
    triggerRadius: 9,
    // Tower metrics are derived from src/data/skills.ts (see DetailPanel), not listed here.
  },
  {
    id: 'contact',
    kicker: 'Contact',
    title: 'The Station',
    description: 'End of the line. Say hello.',
    accentColor: '#5c8b93',
    position: { x: 18, z: -35 },
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
