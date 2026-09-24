import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Niro } from './Niro';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useStore } from '../../store/useStore';

const MOVE_SPEED = 5; // units/sec
const ROTATE_RESPONSE = 10; // slerp speed — higher = snappier turn-to-face
const HEIGHT_OFFSET = 0.5; // half character height, per spec
const HEIGHT_LERP = 0.15;

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const RAY_ORIGIN_Y = 10;

interface Props {
  terrainRef: React.RefObject<THREE.Mesh | null>;
}

/**
 * Owns Niro's transform: reads raw keyboard state, moves on the XZ plane at
 * a constant speed (no accel/decel, per spec — snappy stop on key release),
 * slerps the facing rotation toward the movement direction, and samples
 * terrain height each frame via a downward raycast so the character rides
 * the bumps instead of sitting at a fixed Y.
 */
export function NiroController({ terrainRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const { keys } = useKeyboard();
  const raycaster = useRef(new THREE.Raycaster());
  const headingRef = useRef(0); // radians; movement-direction convention: dir = (sin h, cos h)
  const setPosition = useStore((s) => s.setPosition);

  useFrame((_state, rawDelta) => {
    const group = groupRef.current;
    if (!group) return;
    const activePanel = useStore.getState().activePanel;
    const delta = Math.min(rawDelta, 0.05);

    let dx = 0;
    let dz = 0;
    if (!activePanel) {
      const k = keys.current;
      if (k.has('w') || k.has('arrowup')) dz -= 1;
      if (k.has('s') || k.has('arrowdown')) dz += 1;
      if (k.has('a') || k.has('arrowleft')) dx -= 1;
      if (k.has('d') || k.has('arrowright')) dx += 1;
    }

    const moving = dx !== 0 || dz !== 0;
    if (moving) {
      const len = Math.hypot(dx, dz); // normalize so diagonals aren't faster
      dx /= len;
      dz /= len;
      group.position.x += dx * MOVE_SPEED * delta;
      group.position.z += dz * MOVE_SPEED * delta;
      headingRef.current = Math.atan2(dx, dz);
    }

    // Character model's forward is local -Z (three.js convention), which
    // needs a +PI offset from the raw movement-direction angle to actually
    // point that way — baking this into the quaternion here rather than
    // into `headingRef`, so the camera (which wants the raw movement angle
    // for its look-ahead point) doesn't have to un-apply it.
    const targetQuat = new THREE.Quaternion().setFromAxisAngle(UP, headingRef.current + Math.PI);
    group.quaternion.slerp(targetQuat, Math.min(1, ROTATE_RESPONSE * delta));

    // Terrain height sampling: cast straight down from above the character,
    // hit-test only the terrain mesh (buildings/paths sit on flat pads and
    // use their own proximity check, not this raycast).
    const terrain = terrainRef.current;
    let targetY = HEIGHT_OFFSET;
    if (terrain) {
      raycaster.current.set(new THREE.Vector3(group.position.x, RAY_ORIGIN_Y, group.position.z), DOWN);
      const hits = raycaster.current.intersectObject(terrain);
      if (hits.length > 0) targetY = hits[0].point.y + HEIGHT_OFFSET;
    }
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, HEIGHT_LERP);

    setPosition(group.position.x, group.position.z, headingRef.current);
  });

  return <Niro ref={groupRef} />;
}
