import * as THREE from 'three';

/** Low-poly stand-in: a scooter with a kurta-wearing rider. Replaced with real illustration later. */
export class Character {
  readonly group: THREE.Group;
  private readonly wheels: THREE.Mesh[] = [];
  private facing = new THREE.Vector3(0, 0, -1);

  constructor() {
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8483d, roughness: 0.5 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1420, roughness: 0.9 });
    const kurtaMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d8, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xa9784f, roughness: 0.6 });

    // Scooter footboard + body
    const footboard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 1.6), bodyMat);
    footboard.position.y = 0.5;
    this.group.add(footboard);

    const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.2), bodyMat);
    frontPanel.position.set(0, 0.75, -0.75);
    this.group.add(frontPanel);

    // Handlebar
    const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), wheelMat);
    handleStem.position.set(0, 1.05, -0.75);
    this.group.add(handleStem);
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), wheelMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.3, -0.75);
    this.group.add(handleBar);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 16);
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.x = Math.PI / 2;
    frontWheel.position.set(0, 0.28, -0.78);
    const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheel.rotation.x = Math.PI / 2;
    rearWheel.position.set(0, 0.28, 0.7);
    this.group.add(frontWheel, rearWheel);
    this.wheels.push(frontWheel, rearWheel);

    // Rider — seated torso, head, kurta skirt
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), kurtaMat);
    torso.position.set(0, 1.35, 0.1);
    this.group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
    head.position.set(0, 1.85, -0.05);
    this.group.add(head);

    const kurtaSkirt = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 8, 1, true), kurtaMat);
    kurtaSkirt.position.set(0, 1.05, 0.15);
    this.group.add(kurtaSkirt);

    this.group.position.set(0, 0, 0);
  }

  get position(): THREE.Vector3 {
    return this.group.position;
  }

  /** Rotates to face the movement direction and spins the wheels proportional to speed. */
  update(delta: number, velocityXZ: THREE.Vector2) {
    const speed = velocityXZ.length();
    if (speed > 0.001) {
      this.facing.set(velocityXZ.x, 0, velocityXZ.y).normalize();
      const targetAngle = Math.atan2(this.facing.x, this.facing.z);
      this.group.rotation.y = targetAngle;
    }
    // Wheels are tilted 90° on X so their disc lies flat (axle along Z) — spin must be
    // applied on Z, not Y, or the disc face rotates out of plane instead of rolling.
    const spin = speed * delta * 6;
    for (const wheel of this.wheels) {
      wheel.rotation.z += spin;
    }
  }
}
