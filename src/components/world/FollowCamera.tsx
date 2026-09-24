import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const OFFSET = { x: 0, y: 18, z: 14 };
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
    const { x, z, heading } = useStore.getState().position;

    desiredPos.current.set(x + OFFSET.x, OFFSET.y, z + OFFSET.z);
    cam.position.lerp(desiredPos.current, FOLLOW_LERP);

    // Leads the character's facing direction slightly rather than centering
    // exactly on them — a small, subtle "gaze ahead" cue.
    const aheadX = x + Math.sin(heading) * LOOKAHEAD_DIST;
    const aheadZ = z + Math.cos(heading) * LOOKAHEAD_DIST;
    lookTarget.current.set(aheadX, 1, aheadZ);
    cam.lookAt(lookTarget.current);
  });

  return <PerspectiveCamera ref={camRef} makeDefault fov={55} position={[OFFSET.x, OFFSET.y, OFFSET.z]} />;
}
