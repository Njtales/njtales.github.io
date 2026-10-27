export const sectionNames: Record<string, string> = {
  clocktower: 'Experience', 'cloud-forge': 'Skills', 'data-tower': 'Projects',
  'learning-lab': 'Learning', 'about-cottage': 'About', 'hobbies-hut': 'Hobbies', 'signal-station': 'Contact',
}
export function mapPosition(x: number, z: number) {
  return { left: Math.max(2, Math.min(98, 9 + ((x + 28) / 56) * 82)),
    top: Math.max(2, Math.min(98, 10 + ((z + 13) / 27) * 80)) }
}
