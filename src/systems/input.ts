/**
 * Produces a (steer, throttle) intent from WASD/arrow keys or click(-and-
 * hold)-and-drag toward a direction — vehicle-style controls: left/right
 * turn the wheel, up/down are the gas and the brake, not an absolute
 * movement direction. The caller owns all the actual driving physics
 * (heading, speed, inertia); this just reports what the player is pressing.
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

  getIntent(): { steer: number; throttle: number } {
    if (this.dragging && (this.dragVector.x !== 0 || this.dragVector.y !== 0)) {
      // Drag up = throttle, drag left/right = steer — the same gas+wheel
      // mapping as the keyboard, just via a virtual stick.
      return { steer: this.dragVector.x, throttle: this.dragVector.y };
    }

    let steer = 0;
    let throttle = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) throttle += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) throttle -= 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) steer -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) steer += 1;

    // Deliberately NOT jointly normalized: steering and throttle are
    // independent controls (a real wheel and a real pedal), so full-throttle
    // while turning hard should stay full-throttle, not get scaled down the
    // way a single omnidirectional movement vector would.
    return { steer, throttle };
  }
}
