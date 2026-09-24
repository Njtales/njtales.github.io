const STATS = [
  { label: '7+ Years Experience' },
  { label: 'MSc Distinction QMUL' },
  { label: 'AWS Certified' },
];

export function AboutPanel() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-[#C8A020]/20 flex items-center justify-center text-[#C8A020] font-bold">
          NJ
        </div>
        <div>
          <p className="text-sm font-medium">Nikhil Jatale</p>
          <p className="text-xs text-[#AABBCC]">Cloud Data Engineer</p>
        </div>
      </div>
      <p className="text-sm text-[#DDDDDD] leading-relaxed">
        Cloud Data Engineer based in London. Currently at Bloomberg building enterprise data infrastructure and
        market data connectivity systems. MSc Big Data Science with Distinction from Queen Mary University London.
        7+ years across data engineering, ETL, pipelines, and ML. Focused on scalable cloud systems on AWS,
        infrastructure automation, and data platform engineering. Proven track record: 99% pipeline uptime, 22%
        efficiency improvement across past data systems.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs text-[#C0392B] font-medium leading-snug">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
