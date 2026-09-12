export class Boot {
  private el: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'boot';
    this.el.innerHTML = '<span id="boot-text">loading town</span>';
    container.appendChild(this.el);
  }

  /** Hides after at least `minMs` has elapsed, so the boot moment always reads intentionally. */
  hide(minMs = 900) {
    setTimeout(() => this.el.classList.add('hidden'), minMs);
  }
}
