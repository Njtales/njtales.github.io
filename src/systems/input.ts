/**
 * Produces a normalized (right, forward) intent vector from WASD/arrow keys
 * or click(-and-hold)-and-drag toward a direction. Screen-relative: the
 * caller maps (right, forward) onto the camera's ground-plane axes.
 */
export class InputController {
  private keys = new Set<string>();
  private dragging = false;
  private dragOrigin = { x: 0, y: 0 };
  private dragVector = { x: 0, y: 0 };
  private hasMoved = false;
  private onFirstMove?: () => void;

  constructor(target: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      this.markMoved();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    target.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.dragOrigin = { x: e.clientX, y: e.clientY };
      this.dragVector = { x: 0, y: 0 };
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.dragOrigin.x;
      const dy = e.clientY - this.dragOrigin.y;
      const dist = Math.hypot(dx, dy);
      const deadZone = 8;
      if (dist < deadZone) {
        this.dragVector = { x: 0, y: 0 };
        return;
      }
      this.dragVector = { x: dx / dist, y: -dy / dist };
      this.markMoved();
    });
    window.addEventListener('pointerup', () => {
      this.dragging = false;
      this.dragVector = { x: 0, y: 0 };
    });
  }

  /** Fires once, the first time the player issues any movement input. */
  notifyFirstMove(callback: () => void) {
    this.onFirstMove = callback;
  }

  private markMoved() {
    if (!this.hasMoved) {
      this.hasMoved = true;
      this.onFirstMove?.();
    }
  }

  getIntent(): { right: number; forward: number } {
    if (this.dragging && (this.dragVector.x !== 0 || this.dragVector.y !== 0)) {
      return { right: this.dragVector.x, forward: this.dragVector.y };
    }

    let right = 0;
    let forward = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) forward += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) forward -= 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) right -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) right += 1;

    const length = Math.hypot(right, forward);
    if (length > 1) {
      right /= length;
      forward /= length;
    }
    return { right, forward };
  }
}
