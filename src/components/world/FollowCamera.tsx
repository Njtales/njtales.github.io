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
// heading (NiroController's atan2 of raw input direction) jumps instantly
// on any direction change - e.g. releasing 'w' for 'a' snaps it 90deg in a
// single frame, confirmed by instrumenting camera yaw: an ~8.5deg jump in
// one ~18ms frame, vs ~0.3deg/frame during steady movement (~25x). The old
// code fed that straight into lookTarget.set(...) every frame, so the
// camera's *aim* snapped exactly as abruptly even though its *position*
// was already smoothly lerped - that mismatch (smooth position, snapping
// look direction) is what reads as a jerk specifically on turns. Lerping
// the look target the same way position is lerped fixes it.
const LOOKAT_LERP = 0.15;

/**
 * Fixed follow rig — no orbit, no zoom, no manual pan. Reads the character's
 * position straight from the store each frame via getState() (not the
 * reactive hook) so a 60fps position write doesn't route through React's
 * render cycle just to move a camera.
 */
export function FollowCamera() {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLookTarget = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);

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
    desiredLookTarget.current.set(aheadX, 1, aheadZ);

    if (!initialized.current) {
      // First frame: snap straight to the target instead of lerping from
      // (0,0,0), which would otherwise itself be a one-time jerk on load.
      lookTarget.current.copy(desiredLookTarget.current);
      initialized.current = true;
    } else {
      lookTarget.current.lerp(desiredLookTarget.current, LOOKAT_LERP);
    }
    cam.lookAt(lookTarget.current);
  });

  return <PerspectiveCamera ref={camRef} makeDefault fov={50} position={[OFFSET.x, OFFSET.y, OFFSET.z]} />;
}
