export interface SkillEntry {
  id: string;
  name: string;
  /** Set only when a real start date backs it up — never estimated for effect. */
  years?: number;
  /** For a skill with no clean "years" figure: 'hands-on' (established, just undated) vs 'learning' (genuinely new). */
  level?: 'hands-on' | 'learning';
  metaphor: string;
  description: string;
}

/** Rendered as stacked levels inside the Skill Tower, tallest experience nearest the ground. */
export const SKILLS: SkillEntry[] = [
  {
    id: 'python-sql',
    name: 'Python & SQL',
    years: 8,
    metaphor: 'Data-table board',
    description: 'The floor everything else stands on — ETL, stored procedures, scripting, querying, since the first job in 2017.',
  },
  {
    id: 'data-support',
    name: 'Enterprise data support',
    years: 2.5,
    metaphor: 'Switchboard',
    description: 'Troubleshooting and connectivity for enterprise clients on Bloomberg\'s Data License, BPIPE, and SAPI products, since Feb 2024.',
  },
  {
    id: 'airflow',
    name: 'Airflow & orchestration',
    level: 'hands-on',
    metaphor: 'Route planner',
    description: 'Scheduling and orchestration — making sure the right thing runs after the right thing.',
  },
  {
    id: 'bi-reporting',
    name: 'BI & reporting',
    level: 'hands-on',
    metaphor: 'Dashboard wall',
    description: 'Power BI and Tableau — turning raw data into something people actually read.',
  },
  {
    id: 'cloud-infra',
    name: 'AWS, infra & Terraform',
    level: 'learning',
    metaphor: 'Power node — under construction',
    description: 'The current frontier: actively building hands-on depth in cloud and infrastructure-as-code.',
  },
];
