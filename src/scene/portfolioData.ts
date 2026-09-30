export type PortfolioEntry = {
  title: string
  detail: string
  tags?: string[]
}

export type PortfolioSpot = {
  id: string
  title: string
  section: string
  description: string
  entries: PortfolioEntry[]
  position: [number, number, number]
}

// These are the owner's supplied details. Add verified dates, links, and outcomes
// when available; the scene does not invent employers, credentials, or metrics.
export const portfolioSpots: PortfolioSpot[] = [
  {
    id: 'clocktower', title: 'Clocktower', section: 'Experience & Career',
    description: 'From enterprise analytics toward cloud data engineering and platform work.',
    entries: [
      { title: 'Enterprise Data Analyst', detail: 'Current role · London, UK', tags: ['Data systems', 'Infrastructure'] },
      { title: 'Career direction', detail: 'Building toward Cloud Data Engineer and Data Platform Engineer roles, with a focus on scalable systems.', tags: ['Cloud data', 'Platform engineering'] },
      { title: 'Working principles', detail: 'Engineering excellence over basic analytics; competence, independence, disciplined thinking, and logical reasoning.' },
    ],
    position: [-14.7, 0.34, -2.4],
  },
  {
    id: 'cloud-forge', title: 'Cloud Forge', section: 'Skills & Tech Stack',
    description: 'The cloud, data, and engineering tools used to build production-minded systems.',
    entries: [
      { title: 'AWS foundations', detail: 'Core services: EC2, S3, Lambda, and IAM.', tags: ['AWS', 'Cloud'] },
      { title: 'Data engineering', detail: 'Python processing, API ingestion, and ETL pipeline development.', tags: ['Python', 'ETL'] },
      { title: 'Platform engineering', detail: 'Infrastructure as Code, automation, and data platform architecture; advancing into Kafka/Kinesis streaming and production-scale deployments.', tags: ['IaC', 'Automation', 'Kafka / Kinesis'] },
    ],
    position: [-18, 0.34, 1.1],
  },
  {
    id: 'data-tower', title: 'Data Tower', section: 'Projects & GitHub',
    description: 'Two engineering project tracks, presented with clear architecture and implementation evidence.',
    entries: [
      { title: 'Automated Data Pipeline', detail: 'An API-to-S3-to-data-warehouse pipeline. Add the chosen warehouse, architecture diagram, and repository link when ready.', tags: ['API', 'Amazon S3', 'Data warehouse'] },
      { title: 'Infrastructure Automation', detail: 'Automation for production-like environments. Add the infrastructure scope, tooling, and repository link when ready.', tags: ['Infrastructure as Code', 'Automation'] },
      { title: 'Project standard', detail: 'Each portfolio project should include a GitHub repository, a clean README, and an architecture diagram.' },
    ],
    position: [-8.8, 0.35, -1.2],
  },
  {
    id: 'learning-lab', title: 'Learning Lab', section: 'Learning & Certifications',
    description: 'Current study across advanced data engineering, cloud credentials, and creative communication.',
    entries: [
      { title: 'AWS certifications', detail: 'Preparing for Professional and Specialty-level certifications.' },
      { title: 'Data engineering', detail: 'Developing advanced practices for reliable, scalable pipelines and data platforms.' },
      { title: 'Creative practice', detail: 'Exploring audience dynamics and storytelling for side projects.' },
    ],
    position: [-22.3, 0.38, -1.5],
  },
  {
    id: 'about-cottage', title: 'About Cottage', section: 'About Me',
    description: 'A London-based data analyst focused on building useful systems and long-term independence.',
    entries: [
      { title: 'Nikhil Jatale', detail: 'Enterprise Data Analyst in London, UK · Indian heritage.' },
      { title: 'Personal philosophy', detail: '“Skill → Income → Investment → Freedom.”' },
      { title: 'Long-term mission', detail: 'Build wealth and time freedom while creating security for family.' },
    ],
    position: [-3.75, 0.34, -2.2],
  },
  {
    id: 'hobbies-hut', title: 'Hobbies Hut', section: 'Creative Work & Hobbies',
    description: 'Creative experiments and interests beyond day-to-day data work.',
    entries: [
      { title: 'Off the clock', detail: 'Travel, animation content, and YouTube experiments.' },
      { title: 'Fox avatar', detail: 'The character goes by “Niro” or “creepy”.' },
    ],
    position: [0.6, 0.34, -3.3],
  },
  {
    id: 'signal-station', title: 'Signal Station', section: 'Contact, Links & CV',
    description: 'Professional contact links and a résumé download belong here.',
    entries: [
      { title: 'Based in London', detail: 'London, United Kingdom.' },
      { title: 'Contact links to add', detail: 'Email address, professional profile, CV file, and project repositories were not included yet.' },
    ],
    position: [-1.2, 0.35, 0.1],
  },
]
