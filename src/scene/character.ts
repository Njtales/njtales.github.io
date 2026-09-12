import * as THREE from 'three';

const MAX_LEAN = 0.32; // radians (~18°) — how far the scooter banks into a turn
const LEAN_RESPONSE = 10; // higher = snappier lean transitions
const IDLE_BOB_SPEED = 1.6;
const IDLE_BOB_AMOUNT = 0.02;

/** Low-poly stand-in: a scooter with a kurta-wearing rider. Replaced with real illustration later. */
export class Character {
  /** Position + yaw only — the thing the camera/proximity system tracks. */
  readonly group: THREE.Group;
  /** All visible meshes, nested one level in so lean/bob can't fight the yaw rotation. */
  private readonly visual: THREE.Group;
  private readonly wheels: THREE.Mesh[] = [];
  private facing = new THREE.Vector3(0, 0, -1);
  private currentYaw = 0;
  private currentLean = 0;
  private age = 0;

  constructor() {
    this.group = new THREE.Group();
    this.visual = new THREE.Group();
    this.group.add(this.visual);

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
    this.visual.add(footboard);

    const seat = castAll(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.7), darkMat));
    seat.position.set(0, 0.68, 0.35);
    this.visual.add(seat);

    const frontPanel = castAll(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.2), bodyMat));
    frontPanel.position.set(0, 0.75, -0.75);
    this.visual.add(frontPanel);

    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff6d8 }),
    );
    headlight.position.set(0, 0.78, -0.86);
    this.visual.add(headlight);

    // Handlebar with mirrors
    const handleStem = castAll(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), chromeMat));
    handleStem.position.set(0, 1.05, -0.75);
    this.visual.add(handleStem);

    const handleBar = castAll(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), chromeMat));
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.3, -0.75);
    this.visual.add(handleBar);

    for (const side of [-1, 1]) {
      const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6), chromeMat);
      mirrorArm.position.set(side * 0.32, 1.4, -0.75);
      mirrorArm.rotation.x = Math.PI / 2.2;
      this.visual.add(mirrorArm);
      const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), chromeMat);
      mirror.position.set(side * 0.34, 1.46, -0.82);
      this.visual.add(mirror);
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
    this.visual.add(flag);

    // Wheels — the tilt is baked into the GEOMETRY (not the mesh's own rotation),
    // so the axle is a fixed local axis and rotation.x alone is a clean single-axis
    // spin around it. Cylinders default to a vertical (Y) axis; rotating the
    // geometry itself 90° about Z re-points that axis along X — the vehicle's
    // left-right axis, i.e. a proper wheel axle. Previously the tilt was applied
    // as the mesh's own rotation.x, which pointed the axle front-to-back instead
    // (along the direction of travel) — spinning it then looked like a coin/globe
    // rotating in place rather than a wheel rolling forward.
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const frontWheel = castAll(new THREE.Mesh(wheelGeo, darkMat));
    frontWheel.position.set(0, 0.28, -0.78);
    const rearWheel = castAll(new THREE.Mesh(wheelGeo, darkMat));
    rearWheel.position.set(0, 0.28, 0.7);
    this.visual.add(frontWheel, rearWheel);
    this.wheels.push(frontWheel, rearWheel);

    for (const wheel of [frontWheel, rearWheel]) {
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.17, 12), chromeMat);
      hub.rotation.z = Math.PI / 2; // match the wheel's own axle orientation
      hub.position.copy(wheel.position);
      this.visual.add(hub);
    }

    // Rider — seated torso, head, kurta, sash
    const torso = castAll(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 8), kurtaMat));
    torso.position.set(0, 1.32, 0.15);
    this.visual.add(torso);

    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 16), sashMat);
    sash.rotation.x = Math.PI / 2;
    sash.position.set(0, 1.2, 0.15);
    this.visual.add(sash);

    const head = castAll(new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat));
    head.position.set(0, 1.82, -0.02);
    this.visual.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.185, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      darkMat,
    );
    hair.position.set(0, 1.86, -0.02);
    this.visual.add(hair);

    // Kurta skirt — flares out below the seat, longer at the back like real riding wear.
    const kurtaSkirt = castAll(new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 8, 1, true), kurtaMat));
    kurtaSkirt.position.set(0, 1.0, 0.2);
    this.visual.add(kurtaSkirt);

    for (const side of [-1, 1]) {
      const arm = castAll(new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.32, 4, 6), kurtaMat));
      arm.position.set(side * 0.22, 1.15, -0.35);
      arm.rotation.x = -0.9;
      arm.rotation.z = side * 0.15;
      this.visual.add(arm);
    }

    this.group.position.set(0, 0, 0);
  }

  get position(): THREE.Vector3 {
    return this.group.position;
  }

  /** Rotates to face the movement direction, banks into turns, and spins the wheels. */
  update(delta: number, velocityXZ: THREE.Vector2) {
    this.age += delta;
    const speed = velocityXZ.length();

    let turnRate = 0;
    if (speed > 0.001) {
      this.facing.set(velocityXZ.x, 0, velocityXZ.y).normalize();
      // The model's front (headlight/handlebar) sits at local -Z, so the angle that
      // points -Z at the travel direction is atan2(x,z) + π, not atan2(x,z) — without
      // the offset the scooter drives visually backwards (front trailing the motion).
      const targetYaw = Math.atan2(this.facing.x, this.facing.z) + Math.PI;
      let yawDelta = targetYaw - this.currentYaw;
      // Shortest-path wrap so it doesn't spin the long way round crossing the ±π seam.
      yawDelta = ((yawDelta + Math.PI) % (Math.PI * 2)) - Math.PI;
      this.currentYaw += yawDelta;
      this.group.rotation.y = this.currentYaw;
      turnRate = delta > 0 ? yawDelta / delta : 0;
    }

    // Bank into turns proportional to how fast it's turning and how fast it's
    // going — a stationary vehicle turning in place shouldn't visibly lean.
    const leanTarget = THREE.MathUtils.clamp((turnRate * speed) / 14, -MAX_LEAN, MAX_LEAN);
    this.currentLean += (leanTarget - this.currentLean) * Math.min(1, LEAN_RESPONSE * delta);
    this.visual.rotation.z = this.currentLean;

    // A faint idle bob so the scooter doesn't look frozen when stationary.
    const bobSpeedFactor = 1 + speed * 0.15;
    this.visual.position.y = Math.sin(this.age * IDLE_BOB_SPEED * bobSpeedFactor) * IDLE_BOB_AMOUNT;

    // The wheel geometry's axle is baked along local X (see constructor), so a
    // plain rotation.x is the wheel's own single axis of rotation — no other
    // axis is involved, so there's no way for this to compose into anything
    // other than a clean roll.
    const spin = speed * delta * 6;
    for (const wheel of this.wheels) {
      wheel.rotation.x += spin;
    }
  }
}
