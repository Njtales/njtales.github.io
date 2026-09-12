import { ZONES, type ZoneId } from '../data/zones';

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
      li.innerHTML = `<span class="dot"></span><span>${zone.title}</span>`;
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
