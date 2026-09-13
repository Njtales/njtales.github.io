import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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
  private currentYaw = 0;
  private currentLean = 0;
  private age = 0;

  constructor() {
    this.group = new THREE.Group();
    this.visual = new THREE.Group();
    this.group.add(this.visual);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2523f, roughness: 0.4, metalness: 0.1 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xf5ecd9, roughness: 0.45, metalness: 0.1 });
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

    // --- Cartoon Vespa-style scooter body: rounded panels instead of boxes,
    // a curved legshield with an integrated headlight, and a rounded rear
    // hump over the engine bay — the classic scooter silhouette, chunky and
    // toy-like rather than a flat-sided block.

    const footboard = castAll(new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.12, 1.5, 3, 0.06), bodyMat));
    footboard.position.y = 0.42;
    this.visual.add(footboard);

    // Legshield: a tall rounded dome (stretched, flattened capsule) standing
    // in front of the rider's legs, curving up toward the handlebar.
    const legshield = castAll(
      new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.35, 6, 12), bodyMat),
    );
    legshield.scale.set(1, 1.25, 0.42);
    legshield.position.set(0, 0.86, -0.68);
    this.visual.add(legshield);

    // Cream trim band across the legshield for a two-tone paint job.
    const trimBand = castAll(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16, 1, true), trimMat));
    trimBand.scale.set(1, 1, 0.42);
    trimBand.position.set(0, 0.66, -0.68);
    this.visual.add(trimBand);

    // Headlight, recessed into the top of the legshield with a chrome ring.
    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff6d8 }),
    );
    headlight.position.set(0, 1.02, -0.9);
    this.visual.add(headlight);
    const headlightRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), chromeMat);
    headlightRing.position.set(0, 1.02, -0.88);
    this.visual.add(headlightRing);

    // Rear hump — the rounded bump over the engine bay behind the seat,
    // tapering down toward the rear wheel.
    const rearHump = castAll(new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.3, 6, 12), bodyMat));
    rearHump.scale.set(1, 0.85, 0.62);
    rearHump.rotation.x = -0.15;
    rearHump.position.set(0, 0.62, 0.62);
    this.visual.add(rearHump);

    const tailLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xc0392b, emissive: new THREE.Color(0xc0392b), emissiveIntensity: 0.6 }),
    );
    tailLight.position.set(0, 0.62, 0.98);
    this.visual.add(tailLight);

    // Seat — rounded bench spanning between the legshield and rear hump.
    const seat = castAll(new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.14, 0.68, 3, 0.06), darkMat));
    seat.position.set(0, 0.68, 0.28);
    this.visual.add(seat);

    // Handlebar with rounded rubber grips and mirrors
    const handleStem = castAll(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), chromeMat));
    handleStem.position.set(0, 1.18, -0.72);
    this.visual.add(handleStem);

    const handleBar = castAll(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), chromeMat));
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.38, -0.74);
    this.visual.add(handleBar);

    for (const side of [-1, 1]) {
      const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 4, 8), darkMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(side * 0.26, 1.38, -0.74);
      this.visual.add(grip);

      const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 6), chromeMat);
      mirrorArm.position.set(side * 0.31, 1.47, -0.75);
      mirrorArm.rotation.x = Math.PI / 2.2;
      this.visual.add(mirrorArm);
      const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), chromeMat);
      mirror.scale.set(1, 1, 0.6);
      mirror.position.set(side * 0.35, 1.55, -0.84);
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
    flag.position.set(0.03, 1.46, -0.74);
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

      // Fender arcing over the top of the wheel. Built the same way as the wheel
      // itself (an open cylinder shell, rotated 90° about Z to bake the axle onto
      // local X) — a rim point at angle 0 maps to local +Y under that rotation, so
      // a thetaStart/thetaLength arc centered on 0 lands centered on the wheel's
      // top, which is exactly where a fender should sit.
      const arc = Math.PI * 0.9;
      const fenderGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16, 1, true, -arc / 2, arc);
      fenderGeo.rotateZ(Math.PI / 2);
      const fender = castAll(new THREE.Mesh(fenderGeo, bodyMat));
      fender.position.copy(wheel.position);
      this.visual.add(fender);
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
  /**
   * `heading` is the steering-controlled facing direction — always a valid
   * unit vector, independent of whether the scooter is moving forward,
   * reversing, or stopped. `speed` is the signed scalar along that heading
   * (negative = reverse). Orientation deliberately follows `heading`, not
   * the velocity vector: a real vehicle doesn't spin around to face
   * backwards when it reverses, it keeps facing the way it's steered and
   * just moves backward along that facing.
   */
  update(delta: number, heading: THREE.Vector2, speed: number) {
    this.age += delta;

    // The model's front (headlight/handlebar) sits at local -Z, so the angle that
    // points -Z at the heading direction is atan2(x,z) + π, not atan2(x,z) — without
    // the offset the scooter would visually face backwards.
    const targetYaw = Math.atan2(heading.x, heading.y) + Math.PI;
    let yawDelta = targetYaw - this.currentYaw;
    // Shortest-path wrap so it doesn't spin the long way round crossing the ±π seam.
    yawDelta = ((yawDelta + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.currentYaw += yawDelta;
    this.group.rotation.y = this.currentYaw;
    const turnRate = delta > 0 ? yawDelta / delta : 0;

    // Bank into turns proportional to how fast it's turning and how fast it's
    // going — a stationary vehicle turning in place shouldn't visibly lean.
    const leanTarget = THREE.MathUtils.clamp((turnRate * speed) / 14, -MAX_LEAN, MAX_LEAN);
    this.currentLean += (leanTarget - this.currentLean) * Math.min(1, LEAN_RESPONSE * delta);
    this.visual.rotation.z = this.currentLean;

    // A faint idle bob so the scooter doesn't look frozen when stationary.
    const bobSpeedFactor = 1 + Math.abs(speed) * 0.15;
    this.visual.position.y = Math.sin(this.age * IDLE_BOB_SPEED * bobSpeedFactor) * IDLE_BOB_AMOUNT;

    // The wheel geometry's axle is baked along local X (see constructor), so a
    // plain rotation.x is the wheel's own single axis of rotation — no other
    // axis is involved, so there's no way for this to compose into anything
    // other than a clean roll. Signed speed means reversing spins the wheels
    // the other way, as it should.
    const spin = speed * delta * 6;
    for (const wheel of this.wheels) {
      wheel.rotation.x += spin;
    }
  }
}
