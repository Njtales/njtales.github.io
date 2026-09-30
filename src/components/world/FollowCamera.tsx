import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

// Retuned against an actual working reference on the same stack (found
// mid-session, confirmed to be the exact look being asked for) rather than
// the earlier guesswork: its camera sits far back (z+27.5) and only
// modestly elevated (y+8.8), with a narrow 42deg fov doing the "telephoto
// compression" that makes a diorama read as compressed/flattened despite a
// fairly shallow ~15deg actual pitch. That confirms the earlier "50-55deg
// down" spec text was never a literal boresight angle — this real example
// is nowhere near that steep. Adopted near-verbatim; our island is a
// comparable scale (radius 36 vs their ~55-wide footprint).
const OFFSET = { x: 0, y: 8.8, z: 27.5 };
const FOV = 42;
// The reference looks at a point offset from the player by a *constant*
// world-space vector (not heading-derived), biased toward where their
// village sits relative to spawn — not a "gaze ahead in movement
// direction" cue, so it can't reintroduce the heading-coupling jerk fixed
// earlier. Ground-level (y=0), not character height, matching their exact
// choice — biased toward our own village's position relative to spawn.
const LOOK_FORWARD_BIAS_Z = -3;
// Framerate-independent exponential smoothing (`1 - e^(-rate*delta)`)
// instead of a flat per-frame lerp factor, matching the reference exactly
// — a fixed-factor lerp is only an approximation of a time-constant ease
// and drifts with framerate; this doesn't.
const FOLLOW_RATE = 4;
const LOOKAT_RATE = 4;

/**
 * Fixed follow rig — no orbit, no zoom, no manual pan. Reads the character's
 * position straight from the store each frame via getState() (not the
 * reactive hook) so a 60fps position write doesn't route through React's
 * render cycle just to move a camera.
 *
 * Deliberately does NOT look toward the character's facing/heading. An
 * earlier version offset the look-at point 2 units ahead of the character's
 * movement direction as a "gaze ahead" cue — but `heading` (NiroController's
 * raw atan2 of input direction) jumps instantly on every direction change,
 * so that offset gave the camera's *view* a rotation tied directly to key
 * presses, on top of its already-smooth position follow. Even after
 * smoothing that offset with a lerp, it was still extra camera rotation the
 * player didn't ask for every time they turned. Looking directly at the
 * character's (smoothly-moving) position instead means the camera only
 * rotates as a side effect of position changing, never from a key press by
 * itself — no heading coupling left to jerk.
 */
export function FollowCamera() {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const desiredPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame((_state, delta) => {
    const cam = camRef.current;
    if (!cam) return;
    const { x, z } = useStore.getState().characterPosition;

    desiredPos.current.set(x + OFFSET.x, OFFSET.y, z + OFFSET.z);
    const desiredLookTarget = new THREE.Vector3(x, 0, z + LOOK_FORWARD_BIAS_Z);

    if (!initialized.current) {
      // First frame: snap straight to both targets instead of lerping from
      // (0,0,0), which would otherwise itself be a one-time jerk on load.
      cam.position.copy(desiredPos.current);
      lookTarget.current.copy(desiredLookTarget);
      initialized.current = true;
    } else {
      cam.position.lerp(desiredPos.current, 1 - Math.exp(-FOLLOW_RATE * delta));
      lookTarget.current.lerp(desiredLookTarget, 1 - Math.exp(-LOOKAT_RATE * delta));
    }
    cam.lookAt(lookTarget.current);
  });

  return <PerspectiveCamera ref={camRef} makeDefault fov={FOV} position={[OFFSET.x, OFFSET.y, OFFSET.z]} />;
}
