import * as THREE from 'three';

/**
 * Fixed dimetric/isometric camera rig. The camera never rotates — only its
 * target offset changes, so it always looks down the same classic isometric
 * angle (~35.264° elevation, 45° azimuth) while following the character.
 */
export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  private readonly offset: THREE.Vector3;
  private readonly currentLookAt = new THREE.Vector3();
  private hasLookAt = false;
  private viewSize = 26;
  private targetViewSize = 26;
  private aspect: number;

  constructor(aspect: number) {
    this.aspect = aspect;
    this.camera = new THREE.OrthographicCamera(
      (-this.viewSize * aspect) / 2,
      (this.viewSize * aspect) / 2,
      this.viewSize / 2,
      -this.viewSize / 2,
      0.1,
      500,
    );

    // Classic isometric direction: equal parts X/Y/Z so all three axes foreshorten evenly.
    const distance = 60;
    this.offset = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(distance);
    this.camera.position.copy(this.offset);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Eases toward the target instead of snapping to it every frame — a small
   * amount of camera lag reads as weight/momentum rather than a rigidly
   * attached rig, closer to how physically-simulated third-person cameras
   * (e.g. bruno-simon.com's) feel even though ours is still a fixed angle.
   */
  follow(target: THREE.Vector3, delta: number) {
    if (!this.hasLookAt) {
      this.currentLookAt.copy(target);
      this.hasLookAt = true;
    }
    const smoothing = 1 - Math.pow(0.0025, delta);
    this.currentLookAt.lerp(target, smoothing);
    this.camera.position.copy(this.currentLookAt).add(this.offset);
    this.camera.lookAt(this.currentLookAt);

    if (Math.abs(this.viewSize - this.targetViewSize) > 0.01) {
      const zoomSmoothing = 1 - Math.pow(0.001, delta);
      this.viewSize += (this.targetViewSize - this.viewSize) * zoomSmoothing;
      this.applyFrustum();
    }
  }

  /** Smoothly eases the frustum to a new width instead of snapping — used
   * for the idle "establishing shot" zoom-out (and its return on input). */
  setTargetViewSize(viewSize: number) {
    this.targetViewSize = viewSize;
  }

  private applyFrustum() {
    this.camera.left = (-this.viewSize * this.aspect) / 2;
    this.camera.right = (this.viewSize * this.aspect) / 2;
    this.camera.top = this.viewSize / 2;
    this.camera.bottom = -this.viewSize / 2;
    this.camera.updateProjectionMatrix();
  }

  onResize(aspect: number) {
    this.aspect = aspect;
    this.applyFrustum();
  }
}
