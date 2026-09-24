interface Project {
  title: string;
  description: string;
  tags: string[];
  link?: string;
  inProgress?: boolean;
}

const PROJECTS: Project[] = [
  {
    title: 'S&P 500 Data Pipeline',
    description: 'ETL pipeline processing S&P 500 market data.',
    tags: ['Python', 'AWS S3', 'Glue', 'Redshift'],
    link: 'https://github.com/njtales',
  },
  {
    title: 'Sign Language Recognition',
    description: 'Real-time sign language recognition system using computer vision.',
    tags: ['Python', 'OpenCV', 'Deep Learning'],
    link: 'https://github.com/njtales',
  },
  {
    title: 'Data Engineering Collection',
    description: 'ETL pipelines, data integration, and mining projects.',
    tags: ['Python', 'Kafka', 'Airflow', 'Spark'],
    link: 'https://github.com/njtales',
  },
  {
    title: '3D Portfolio Site',
    description: 'This website.',
    tags: ['React', 'Three.js', 'R3F', 'GSAP'],
    link: 'https://github.com/njtales',
  },
  {
    title: '⚡ In Progress',
    description: 'Cloud infrastructure automation projects coming soon.',
    tags: ['AWS', 'Terraform', 'Python'],
    inProgress: true,
  },
];

export function ProjectsPanel() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PROJECTS.map((p) => (
        <div
          key={p.title}
          className={`rounded-lg p-4 flex flex-col gap-2 ${
            p.inProgress ? 'border border-dashed border-[#3A3F4B]' : 'bg-white/5'
          }`}
        >
          <h3 className="text-sm font-medium">{p.title}</h3>
          <p className="text-xs text-[#AABBCC] leading-relaxed flex-1">{p.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#CCCCCC]">
                {tag}
              </span>
            ))}
          </div>
          {p.link && (
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#2E7D9E] hover:underline mt-1"
            >
              GitHub →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
