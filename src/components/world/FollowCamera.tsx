import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

// Shallowed from {14, 11} (~50 deg downward tilt) to {6, 13} (~21 deg) — at
// the steeper angle the frustum's top edge never looked higher than ~25 deg
// below horizontal from any character position (fixed offset => fixed
// pitch, doesn't vary with position), so no sky or distant landmark could
// ever appear on screen, confirmed both by the numbers and empirically in
// the browser (a mountain ring built for a "big vista" backdrop was
// completely invisible - solid ground to the top edge of every screenshot).
// This is a real change to camera *feel* (more 3rd-person chase, less
// top-down), done deliberately after flagging the tradeoff.
const OFFSET = { x: 0, y: 6, z: 13 };
const FOLLOW_LERP = 0.08;
const LOOKAT_LERP = 0.15;

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

  useFrame(() => {
    const cam = camRef.current;
    if (!cam) return;
    const { x, y, z } = useStore.getState().characterPosition;

    desiredPos.current.set(x + OFFSET.x, OFFSET.y, z + OFFSET.z);
    cam.position.lerp(desiredPos.current, FOLLOW_LERP);

    const desiredLookTarget = new THREE.Vector3(x, y + 1, z);
    if (!initialized.current) {
      // First frame: snap straight to the target instead of lerping from
      // (0,0,0), which would otherwise itself be a one-time jerk on load.
      lookTarget.current.copy(desiredLookTarget);
      initialized.current = true;
    } else {
      lookTarget.current.lerp(desiredLookTarget, LOOKAT_LERP);
    }
    cam.lookAt(lookTarget.current);
  });

  return <PerspectiveCamera ref={camRef} makeDefault fov={50} position={[OFFSET.x, OFFSET.y, OFFSET.z]} />;
}
