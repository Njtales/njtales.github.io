interface Entry {
  icon: '🟣' | '📚';
  title: string;
  meta: string;
  description?: string;
}

const ENTRIES: Entry[] = [
  {
    icon: '🟣',
    title: 'Bloomberg LP',
    meta: 'London · Feb 2024–Present · Enterprise Data Analyst',
    description:
      'Enterprise data product connectivity, market data infrastructure, and internal tooling improvements. Focused on logging and observability using Splunk and Humio. Interfacing with enterprise clients, stakeholders, data owners, and implementation specialists on critical data queries.',
  },
  {
    icon: '🟣',
    title: 'Freelancer',
    meta: '2022–2024',
    description: 'Built sign language recognition system, data pipeline projects, 3D graphics portfolio site.',
  },
  { icon: '🟣', title: 'Addicor Tech', meta: 'Software Developer · 2020–2021' },
  { icon: '🟣', title: 'Syntel (now Atos)', meta: 'ETL & Python Developer · 2018–2020' },
  { icon: '🟣', title: 'Orbit Tree', meta: 'Software Intern/Developer · 2017–2018' },
  { icon: '📚', title: 'MSc Big Data Science', meta: 'Queen Mary University London · 2021–2022 · Distinction' },
  { icon: '📚', title: 'BE Computer Technology', meta: 'YCCE Nagpur · 2013–2017' },
];

export function ExperiencePanel() {
  return (
    <div className="relative pl-5 flex flex-col gap-5">
      <div className="absolute left-1 top-1 bottom-1 w-px bg-[#7B3F8C]/40" />
      {ENTRIES.map((entry) => (
        <div key={entry.title} className="relative">
          <span className="absolute -left-5 top-0.5 text-sm">{entry.icon}</span>
          <h3 className="text-sm font-medium">{entry.title}</h3>
          <p className="text-xs text-[#7B3F8C] mt-0.5">{entry.meta}</p>
          {entry.description && <p className="text-xs text-[#AABBCC] leading-relaxed mt-1.5">{entry.description}</p>}
        </div>
      ))}
    </div>
  );
}
