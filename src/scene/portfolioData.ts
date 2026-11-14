import {profile} from './profileData'

export type PortfolioEntry = {
  title: string
  detail: string
  tags?: string[]
  status?: string
  link?: {label:string;href:string}
  highlights?:{label:string;detail:string}[]
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
    description: 'A focus on data engineering, practical automation and the systems behind reliable data workflows.',
    entries: [
      { title: profile.role, detail: 'Professional focus · London, UK. Data pipelines, orchestration and cloud platform concepts.', tags: ['Data engineering', 'Automation'] },
      { title: 'Work you can inspect', detail: 'Python and Airflow pipeline practice, PostgreSQL loading, Docker environments and this interactive TypeScript portfolio.',
        link:{label:'Explore the project repositories',href:'https://github.com/Njtales/Data_pipelines'} },
      { title: 'How I approach systems', detail: 'Understand how data moves, make dependencies explicit, and build workflows that are easier to inspect and operate.' },
    ],
    position: [-5.9, 0.34, -8.2],
  },
  {
    id: 'cloud-forge', title: 'Cloud Forge', section: 'Skills & Tech Stack',
    description: 'Tools demonstrated in the linked projects, alongside the cloud concepts I am studying.',
    entries: [
      { title: 'Data pipelines', status:'Project work', detail: 'Python and pandas processing, Airflow task dependencies, CSV handoffs and PostgreSQL loading.', tags: ['Python', 'SQL', 'Airflow', 'PostgreSQL'],
        link:{label:'See the pipeline code',href:'https://github.com/Njtales/Data_pipelines'} },
      { title: 'Local environments', status:'Project work', detail: 'Docker Compose environments for Airflow, PostgreSQL and pgAdmin.', tags: ['Docker', 'Docker Compose'],
        link:{label:'See the environment setup',href:'https://github.com/Njtales/Data_pipelines/tree/main/DW%20with%20PSQL'} },
      { title: 'Interactive software', status:'Project work', detail: 'React, TypeScript and Three.js power the village, navigation, accessible panels and responsive controls.', tags: ['React', 'TypeScript', 'Three.js'],
        link:{label:'Explore Coastlight Village source',href:'https://github.com/Njtales/njtales.github.io'} },
      { title: 'Cloud and platform concepts', status:'Current study', detail: 'AWS EC2, S3, Lambda and IAM; Infrastructure as Code and streaming concepts with Kafka and Kinesis.', tags: ['AWS', 'IaC', 'Streaming'] },
    ],
    position: [-11.8, 0.34, -2.1],
  },
  {
    id: 'data-tower', title: 'Data Tower', section: 'Projects & GitHub',
    description: 'Selected work in data pipelines, orchestration, and interactive web experiences.',
    entries: [
      { title: 'Coastlight Village', status:'Personal project', detail: 'A portfolio you can read immediately or explore as a small coastal world with Niro, a walking fox guide.', tags: ['React', 'Three.js', 'TypeScript'],
        highlights:[
          {label:'Built',detail:'Seven portfolio landmarks, a live map, keyboard controls and collision-aware click-to-walk navigation.'},
          {label:'Engineering',detail:'Terrain-aware walking, bounded render resolution, shared geometry and lighter graphics settings. Continuous rendering pauses when the tab is hidden or a portfolio panel is open.'},
          {label:'Access',detail:'Direct section shortcuts, touch controls, reduced motion, keyboard-managed dialogs and a plain HTML profile.'},
        ],link:{label:'Explore the source',href:'https://github.com/Njtales/njtales.github.io'} },
      { title: 'S&P 500 Data Pipeline', status:'Practice project', detail: 'An Airflow ETL exercise using Yahoo Finance price data for a selected list of S&P 500 companies.', tags: ['Airflow', 'Python', 'pandas', 'PostgreSQL', 'Docker'],
        highlights:[
          {label:'Flow',detail:'Download prices → save CSV → clean and calculate metrics → load PostgreSQL with SQLAlchemy.'},
          {label:'Processing',detail:'Removes missing and duplicate rows, then calculates daily returns and 5- and 20-period moving averages.'},
          {label:'Learning focus',detail:'Task dependencies, retry configuration and the trade-offs of CSV handoffs and full-table replacement loads.'},
        ],
        link:{label:'View code and setup',href:'https://github.com/Njtales/Data_pipelines/tree/main/Airflow%20Pipeline%20S%26P%20500%20index'} },
      { title: 'PostgreSQL Data Warehouse', status:'Practice · in progress', detail: 'A local Airflow and PostgreSQL exercise using Instacart CSV datasets, with pgAdmin for database inspection.', tags: ['PostgreSQL', 'Airflow', 'Docker Compose'],
        highlights:[
          {label:'Source',detail:'The DAG defines tables for aisles, products, departments, orders and order-product datasets, followed by CSV load tasks.'},
          {label:'Learning focus',detail:'Relational schemas, PostgreSQL COPY-based loading and explicit extraction → table creation → loading dependencies.'},
          {label:'Status',detail:'A practice implementation in progress; the extraction task remains a placeholder in the published code.'},
        ],
        link:{label:'View code and setup',href:'https://github.com/Njtales/Data_pipelines/tree/main/DW%20with%20PSQL'} },
    ],
    position: [6.9, 0.35, -5.8],
  },
  {
    id: 'learning-lab', title: 'Learning Lab', section: 'Learning & Certifications',
    description: 'Current study across advanced data engineering, cloud credentials, and creative communication.',
    entries: [
      { title: 'AWS foundations', status:'Current study', detail: 'Core cloud services, access management and cloud architecture concepts for data workflows.' },
      { title: 'Data engineering', detail: 'Developing advanced practices for reliable, scalable pipelines and data platforms.' },
      { title: 'Creative practice', detail: 'Exploring audience dynamics and storytelling for side projects.' },
    ],
    position: [-17.6, 0.38, 3.6],
  },
  {
    id: 'about-cottage', title: 'About Cottage', section: 'About Me',
    description: 'I enjoy understanding how systems fit together, making useful things, and bringing some personality to the work.',
    entries: [
      { title: 'Nikhil Jatale', detail: `${profile.role} · London, UK · Indian heritage. My project work combines data pipelines, practical tooling and interactive software.` },
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
    description: 'Let’s talk about data pipelines, cloud platforms, interesting systems — or your feedback on the village. Based in London, UK.',
    entries: [],
    position: [0.5, 0.35, 1.3],
  },
]
