const HOBBIES = [
  { title: 'Sketching & Drawing', description: 'Hobby since childhood. Occasionally explores digital illustration and animation.' },
  { title: 'Market Data & Finance', description: 'Passionate about analysing market behaviour. FISD Level 1 certified.' },
  { title: 'Reading', description: 'Avid reader across technology, psychology, and finance.' },
  { title: 'Travel', description: 'Based in London, originally from India. Exploring the world one timezone at a time.' },
  { title: 'YouTube / Creative Content', description: 'Experimenting with educational and storytelling content. Watch this space.' },
];

export function HobbiesPanel() {
  return (
    <div className="flex flex-col gap-5">
      {HOBBIES.map((h) => (
        <div key={h.title}>
          <h3 className="text-sm font-medium text-[#E8A020]">{h.title}</h3>
          <p className="text-xs text-[#AABBCC] leading-relaxed mt-1">{h.description}</p>
        </div>
      ))}
    </div>
  );
}
