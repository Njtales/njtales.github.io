interface LearningItem {
  title: string;
  status: string;
  progress?: number;
}

const ITEMS: LearningItem[] = [
  { title: 'AWS Solutions Architect', status: 'In Progress', progress: 40 },
  { title: 'Python Professional Certification (PCPP)', status: 'Coming Soon' },
  { title: 'Terraform & Infrastructure as Code', status: 'Active' },
  { title: 'Cloud Data Platform Architecture', status: 'Active' },
  { title: 'Hands-on: cloud infrastructure automation and system build pipelines', status: 'Active' },
];

export function LearningPanel() {
  return (
    <div className="flex flex-col gap-5">
      {ITEMS.map((item) => (
        <div key={item.title}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">{item.title}</h3>
            <span className="text-[10px] shrink-0 px-2 py-0.5 rounded-full bg-[#2A9D6F]/20 text-[#2A9D6F]">
              {item.status}
            </span>
          </div>
          {item.progress !== undefined && (
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-[#2A9D6F]" style={{ width: `${item.progress}%` }} />
            </div>
          )}
        </div>
      ))}
      <p className="text-[11px] text-[#AABBCC] mt-2">Updated regularly — last updated September 2026.</p>
    </div>
  );
}
