import * as THREE from 'three';

/** Low-poly stand-in: a scooter with a kurta-wearing rider. Replaced with real illustration later. */
export class Character {
  readonly group: THREE.Group;
  private readonly wheels: THREE.Mesh[] = [];
  private facing = new THREE.Vector3(0, 0, -1);

  constructor() {
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8483d, roughness: 0.45, metalness: 0.15 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfcfd6, roughness: 0.3, metalness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1420, roughness: 0.9 });
    const kurtaMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d8, roughness: 0.7 });
    const sashMat = new THREE.MeshStandardMaterial({ color: 0xf2ac4a, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xa9784f, roughness: 0.6 });
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xe08fd7,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0xe08fd7),
      emissiveIntensity: 0.25,
    });

    const castAll = (mesh: THREE.Mesh) => {
      mesh.castShadow = true;
      return mesh;
    };

    // Scooter footboard + body
    const footboard = castAll(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 1.6), bodyMat));
    footboard.position.y = 0.5;
    this.group.add(footboard);

    const seat = castAll(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.7), darkMat));
    seat.position.set(0, 0.68, 0.35);
    this.group.add(seat);

    const frontPanel = castAll(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.2), bodyMat));
    frontPanel.position.set(0, 0.75, -0.75);
    this.group.add(frontPanel);

    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff6d8 }),
    );
    headlight.position.set(0, 0.78, -0.86);
    this.group.add(headlight);

    // Handlebar with mirrors
    const handleStem = castAll(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), chromeMat));
    handleStem.position.set(0, 1.05, -0.75);
    this.group.add(handleStem);

    const handleBar = castAll(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), chromeMat));
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.3, -0.75);
    this.group.add(handleBar);

    for (const side of [-1, 1]) {
      const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6), chromeMat);
      mirrorArm.position.set(side * 0.32, 1.4, -0.75);
      mirrorArm.rotation.x = Math.PI / 2.2;
      this.group.add(mirrorArm);
      const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), chromeMat);
      mirror.position.set(side * 0.34, 1.46, -0.82);
      this.group.add(mirror);
    }

    // A small triangular flag on the handlebar — a bit of colour and personality.
    const flagGeo = new THREE.BufferGeometry();
    flagGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0, 0.32, -0.08, 0, 0, -0.18, 0], 3),
    );
    flagGeo.computeVertexNormals();
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.03, 1.38, -0.75);
    this.group.add(flag);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 16);
    const frontWheel = castAll(new THREE.Mesh(wheelGeo, darkMat));
    frontWheel.rotation.x = Math.PI / 2;
    frontWheel.position.set(0, 0.28, -0.78);
    const rearWheel = castAll(new THREE.Mesh(wheelGeo, darkMat));
    rearWheel.rotation.x = Math.PI / 2;
    rearWheel.position.set(0, 0.28, 0.7);
    this.group.add(frontWheel, rearWheel);
    this.wheels.push(frontWheel, rearWheel);

    for (const wheel of [frontWheel, rearWheel]) {
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.17, 12), chromeMat);
      hub.rotation.x = Math.PI / 2;
      hub.position.copy(wheel.position);
      this.group.add(hub);
    }

    // Rider — seated torso, head, kurta, sash
    const torso = castAll(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 8), kurtaMat));
    torso.position.set(0, 1.32, 0.15);
    this.group.add(torso);

    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 16), sashMat);
    sash.rotation.x = Math.PI / 2;
    sash.position.set(0, 1.2, 0.15);
    this.group.add(sash);

    const head = castAll(new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat));
    head.position.set(0, 1.82, -0.02);
    this.group.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.185, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      darkMat,
    );
    hair.position.set(0, 1.86, -0.02);
    this.group.add(hair);

    // Kurta skirt — flares out below the seat, longer at the back like real riding wear.
    const kurtaSkirt = castAll(new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 8, 1, true), kurtaMat));
    kurtaSkirt.position.set(0, 1.0, 0.2);
    this.group.add(kurtaSkirt);

    for (const side of [-1, 1]) {
      const arm = castAll(new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.32, 4, 6), kurtaMat));
      arm.position.set(side * 0.22, 1.15, -0.35);
      arm.rotation.x = -0.9;
      arm.rotation.z = side * 0.15;
      this.group.add(arm);
    }

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
