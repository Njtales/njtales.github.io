export type PortfolioEntry = {
  title: string
  detail: string
  tags?: string[]
  status?: string
  link?: {label:string;href:string}
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
    position: [-5.9, 0.34, -8.2],
  },
  {
    id: 'cloud-forge', title: 'Cloud Forge', section: 'Skills & Tech Stack',
    description: 'The cloud, data, and engineering tools used to build production-minded systems.',
    entries: [
      { title: 'AWS foundations', detail: 'Core services: EC2, S3, Lambda, and IAM.', tags: ['AWS', 'Cloud'] },
      { title: 'Data engineering', detail: 'Python processing, API ingestion, and ETL pipeline development.', tags: ['Python', 'ETL'] },
      { title: 'Platform engineering', detail: 'Infrastructure as Code, automation, and data platform architecture; advancing into Kafka/Kinesis streaming and production-scale deployments.', tags: ['IaC', 'Automation', 'Kafka / Kinesis'] },
    ],
    position: [-11.8, 0.34, -2.1],
  },
  {
    id: 'data-tower', title: 'Data Tower', section: 'Projects & GitHub',
    description: 'Selected work in data pipelines, orchestration, and interactive web experiences.',
    entries: [
      { title: 'S&P 500 Data Pipeline', status:'Practice project', detail: 'An Airflow project documenting stock-data extraction, processing, and warehouse loading. Includes Python code and a Docker-based setup.', tags: ['Airflow', 'Python', 'Docker'],
        link:{label:'View code and setup',href:'https://github.com/Njtales/Data_pipelines/tree/main/Airflow%20Pipeline%20S%26P%20500%20index'} },
      { title: 'PostgreSQL Data Warehouse', status:'Practice project', detail: 'A local learning environment combining Airflow, PostgreSQL, and pgAdmin, with the Instacart dataset used for pipeline and SQL practice.', tags: ['PostgreSQL', 'Airflow', 'Docker Compose'],
        link:{label:'View code and setup',href:'https://github.com/Njtales/Data_pipelines/tree/main/DW%20with%20PSQL'} },
      { title: 'Coastlight Village', status:'Personal project', detail: 'This interactive portfolio: a walkable island, a terrain-aware fox guide, and seven landmarks. Built with React and Three.js, with shared geometry and lightweight painted detail.', tags: ['React', 'Three.js', 'TypeScript'],
        link:{label:'Explore the source',href:'https://github.com/Njtales/njtales.github.io'} },
    ],
    position: [6.9, 0.35, -5.8],
  },
  {
    id: 'learning-lab', title: 'Learning Lab', section: 'Learning & Certifications',
    description: 'Current study across advanced data engineering, cloud credentials, and creative communication.',
    entries: [
      { title: 'AWS certifications', detail: 'Preparing for Professional and Specialty-level certifications.' },
      { title: 'Data engineering', detail: 'Developing advanced practices for reliable, scalable pipelines and data platforms.' },
      { title: 'Creative practice', detail: 'Exploring audience dynamics and storytelling for side projects.' },
    ],
    position: [-17.6, 0.38, 3.6],
  },
  {
    id: 'about-cottage', title: 'About Cottage', section: 'About Me',
    description: 'A London-based data analyst focused on building useful systems and long-term independence.',
    entries: [
      { title: 'Nikhil Jatale', detail: 'Enterprise Data Analyst in London, UK · Indian heritage.' },
      { title: 'Personal philosophy', detail: '“Skill → Income → Investment → Freedom.”' },
      { title: 'Long-term mission', detail: 'Build wealth and time freedom while creating security for family.' },
    ],
    position: [11.2, 0.34, 5.0],
  },
  {
    id: 'hobbies-hut', title: 'Hobbies Hut', section: 'Creative Work & Hobbies',
    description: 'Creative experiments and interests beyond day-to-day data work.',
    entries: [
      { title: 'Off the clock', detail: 'Travel, animation content, and YouTube experiments.' },
      { title: 'Meet Niro', detail: 'The golden fox guiding this little island. Walk with him, tap the ground, or use the map to explore each part of the portfolio.' },
    ],
    position: [17.8, 1.45, -3.5],
  },
  {
    id: 'signal-station', title: 'Signal Station', section: 'Contact & Career',
    description: 'A London-based data analyst building toward cloud data engineering and data platform roles.',
    entries: [
      { title: 'Based in London', detail: 'London, United Kingdom · Indian heritage.' },
      { title: 'Career direction', detail: 'Cloud Data Engineer and Data Platform Engineer roles, with a focus on scalable systems.' },
    ],
    position: [0.5, 0.35, 1.3],
  },
]
