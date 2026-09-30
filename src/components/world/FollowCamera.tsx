import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

// Raised/pulled back from {6, 13} (~21 deg tilt) toward the reference
// island composition's more "looking down and across a diorama" feel.
// Note the reference's own stated "50-55 deg down" can't be taken as a
// literal boresight pitch — at any FOV wide enough to also show a horizon
// band at the top of frame (which the reference clearly has), a 50+ deg
// pitch mathematically never reaches back up to horizontal (confirmed by
// this exact math when the previous mountain-visibility bug was fixed).
// It's almost certainly describing the ground's apparent foreshortening,
// not a literal camera angle. Tuned by eye instead: taller/further offset
// plus a narrower fov for a more compressed, isometric-leaning look, while
// keeping enough frustum headroom above the boresight to still show sky.
const OFFSET = { x: 0, y: 11, z: 14 };
const FOV = 44;
// Aim a couple units above the character (not just head height) so the
// frustum's centerline tilts up slightly — more of the village and horizon
// in frame, less "staring at Niro's feet".
const LOOK_HEIGHT_OFFSET = 2;
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

    const desiredLookTarget = new THREE.Vector3(x, y + LOOK_HEIGHT_OFFSET, z);
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

  return <PerspectiveCamera ref={camRef} makeDefault fov={FOV} position={[OFFSET.x, OFFSET.y, OFFSET.z]} />;
}
