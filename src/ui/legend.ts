import { ZONES, type ZoneId } from '../data/zones';

const ICON_PATHS: Record<ZoneId, string> = {
  // Storefront: roof + body + doorway cutout
  about: '<path d="M1.5 5 2.5 1.5h9L12.5 5v1h-11z"/><path d="M2 6.5h10V12H2z"/><path d="M5.5 8.5h3V12h-3z" fill="var(--panel)"/>',
  // Game controller: pill body, d-pad cutout, two face buttons
  arcade:
    '<rect x="1" y="4.5" width="12" height="5.5" rx="2.5"/><rect x="4" y="6.2" width="2" height="0.9" fill="var(--panel)"/><rect x="4.55" y="5.65" width="0.9" height="2" fill="var(--panel)"/><circle cx="9.4" cy="6.3" r="0.8" fill="var(--panel)"/><circle cx="11" cy="7.8" r="0.8" fill="var(--panel)"/>',
  // Pencil: angled body + tip
  sketch: '<path d="M2 12l0.8-3L9.5 2.3 11.7 4.5 4.9 11.2z"/><path d="M9.5 2.3l1.2-1.2 2.2 2.2-1.2 1.2z" opacity="0.7"/>',
  // Briefcase: body + handle + latch
  work: '<rect x="1" y="5" width="12" height="7" rx="1"/><path d="M5 5V3.3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="6" y="7.5" width="2" height="1.6" fill="var(--panel)"/>',
  // Wrench silhouette
  projects: '<path d="M9.2 1.8a2.6 2.6 0 0 0-3.4 3.4L2 9l2 2 3.8-3.8a2.6 2.6 0 0 0 3.4-3.4L9.6 5.2 8.2 3.8z"/>',
  // Tower: antenna cap + tapered body + base
  skills: '<path d="M6 1.5h2v2H6z"/><path d="M5 3.5h4l1 8H4z"/><rect x="3" y="11.5" width="8" height="1.3"/>',
  // Map pin
  contact: '<path d="M7 1a4 4 0 0 0-4 4c0 3.2 4 8 4 8s4-4.8 4-8a4 4 0 0 0-4-4z"/><circle cx="7" cy="5" r="1.6" fill="var(--panel)"/>',
};

function iconSvg(id: ZoneId): string {
  return `<svg class="zone-icon" viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden="true">${ICON_PATHS[id]}</svg>`;
}

export class Legend {
  private items = new Map<ZoneId, HTMLLIElement>();
  private visited = new Set<ZoneId>();

  constructor(container: HTMLElement) {
    const panel = document.createElement('div');
    panel.id = 'legend';
    panel.innerHTML = '<h2>Town map</h2>';

    const list = document.createElement('ul');
    for (const zone of ZONES) {
      const li = document.createElement('li');
      li.style.setProperty('--zone-color', zone.accentColor);
      li.innerHTML = `${iconSvg(zone.id)}<span>${zone.title}</span>`;
      list.appendChild(li);
      this.items.set(zone.id, li);
    }
    panel.appendChild(list);
    container.appendChild(panel);
  }

  markVisited(id: ZoneId) {
    if (this.visited.has(id)) return;
    this.visited.add(id);
    this.items.get(id)?.classList.add('visited');
  }
}
