export interface SkillEntry {
  id: string;
  name: string;
  years: number;
  metaphor: string;
  description: string;
}

/** Rendered as stacked levels inside the Skill Tower, tallest experience nearest the ground. */
export const SKILLS: SkillEntry[] = [
  {
    id: 'python-sql',
    name: 'Python / SQL',
    years: 8,
    metaphor: 'Data-table board',
    description: 'The floor everything else stands on — querying, scripting, gluing systems together.',
  },
  {
    id: 'aws',
    name: 'AWS',
    years: 7,
    metaphor: 'Power node',
    description: 'EC2, S3, Glue, Redshift, IAM, Kinesis — the grid the rest of the town runs on.',
  },
  {
    id: 'terraform',
    name: 'Terraform',
    years: 6,
    metaphor: 'Blueprint desk',
    description: 'Infrastructure as a drawing you can diff, review, and reproduce exactly.',
  },
  {
    id: 'airflow',
    name: 'Airflow',
    years: 5,
    metaphor: 'Route planner',
    description: 'Scheduling and orchestration — making sure the right thing runs after the right thing.',
  },
];
