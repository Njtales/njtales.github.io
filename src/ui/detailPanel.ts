import type { Zone } from '../data/zones';
import { PROJECTS } from '../data/projects';
import { SKILLS } from '../data/skills';

export class DetailPanel {
  private el: HTMLDivElement;
  private currentId: string | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'detail-panel';
    container.appendChild(this.el);
  }

  show(zone: Zone) {
    if (this.currentId === zone.id) return;
    this.currentId = zone.id;
    this.el.style.setProperty('--zone-color', zone.accentColor);

    const metrics =
      zone.id === 'projects'
        ? PROJECTS.map((p) => ({ value: p.metricValue, label: p.metricLabel }))
        : zone.id === 'skills'
          ? SKILLS.map((s) => ({ value: `${s.years} yrs`, label: `${s.name} — ${s.metaphor}` }))
          : (zone.metrics ?? []);

    const stackChips =
      zone.id === 'projects'
        ? Array.from(new Set(PROJECTS.flatMap((p) => p.stack)))
        : (zone.stackChips ?? []);

    this.el.innerHTML = `
      <button class="close" aria-label="Close">&times;</button>
      <p class="kicker">${zone.kicker}</p>
      <h2>${zone.title}</h2>
      <p class="description">${zone.description}</p>
      ${
        metrics.length
          ? `<div class="metrics">${metrics
              .map(
                (m) =>
                  `<div class="metric"><span class="value">${m.value}</span><span class="label">${m.label}</span></div>`,
              )
              .join('')}</div>`
          : ''
      }
      ${
        stackChips.length
          ? `<div class="chips">${stackChips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>`
          : ''
      }
      ${
        zone.links?.length
          ? `<div class="links">${zone.links
              .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label} →</a>`)
              .join('')}</div>`
          : ''
      }
    `;
    this.el.querySelector('.close')?.addEventListener('click', () => this.hide());
    this.el.classList.add('open');
  }

  hide() {
    this.currentId = null;
    this.el.classList.remove('open');
  }
}
