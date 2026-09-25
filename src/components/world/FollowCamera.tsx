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
const LOOKAHEAD_DIST = 2;
const FOLLOW_LERP = 0.08;

/**
 * Fixed follow rig — no orbit, no zoom, no manual pan. Reads the character's
 * position straight from the store each frame via getState() (not the
 * reactive hook) so a 60fps position write doesn't route through React's
 * render cycle just to move a camera.
 */
export function FollowCamera() {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const desiredPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    const cam = camRef.current;
    if (!cam) return;
    const { x, z, heading } = useStore.getState().characterPosition;

    desiredPos.current.set(x + OFFSET.x, OFFSET.y, z + OFFSET.z);
    cam.position.lerp(desiredPos.current, FOLLOW_LERP);

    // Leads the character's facing direction slightly rather than centering
    // exactly on them — a small, subtle "gaze ahead" cue.
    const aheadX = x + Math.sin(heading) * LOOKAHEAD_DIST;
    const aheadZ = z + Math.cos(heading) * LOOKAHEAD_DIST;
    lookTarget.current.set(aheadX, 1, aheadZ);
    cam.lookAt(lookTarget.current);
  });

  return <PerspectiveCamera ref={camRef} makeDefault fov={50} position={[OFFSET.x, OFFSET.y, OFFSET.z]} />;
}
