import * as THREE from 'three';

/**
 * Fixed dimetric/isometric camera rig. The camera never rotates — only its
 * target offset changes, so it always looks down the same classic isometric
 * angle (~35.264° elevation, 45° azimuth) while following the character.
 */
export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  private readonly offset: THREE.Vector3;
  private viewSize = 22;

  constructor(aspect: number) {
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
   * Movement axes for input mapping. Roads and zones are laid out on the raw
   * world X/Z grid, so movement intentionally follows world axes rather than
   * the camera's screen-diagonal direction — pressing "forward" moves the
   * character up the road (appearing diagonal on screen), which is the
   * standard isometric-game convention and keeps the character on the roads.
   */
  getGroundAxes() {
    return {
      forward: new THREE.Vector3(0, 0, -1),
      right: new THREE.Vector3(1, 0, 0),
    };
  }

  follow(target: THREE.Vector3) {
    this.camera.position.copy(target).add(this.offset);
    this.camera.lookAt(target);
  }

  onResize(aspect: number) {
    this.camera.left = (-this.viewSize * aspect) / 2;
    this.camera.right = (this.viewSize * aspect) / 2;
    this.camera.top = this.viewSize / 2;
    this.camera.bottom = -this.viewSize / 2;
    this.camera.updateProjectionMatrix();
  }
}
