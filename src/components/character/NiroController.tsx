import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Niro } from './Niro';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useStore } from '../../store/useStore';

const MOVE_SPEED = 5; // units/sec
// Slerp speed — higher = snappier turn-to-face. Was 10, which felt snappy
// for small turns but whipped hard on a full reversal: slerp's per-frame
// step is a fixed *fraction* of the remaining angle, so the very first
// frame after a 180deg flip is also the single biggest turn it ever makes
// (measured: ~31deg in one ~16ms frame, i.e. ~1800deg/sec for that instant)
// — most noticeable exactly when least wanted, right at the moment of
// direction change. 5 roughly halves that peak (~15-18deg on a reversal)
// while keeping smaller turns reasonably prompt.
const ROTATE_RESPONSE = 5;
// Niro's own group origin sits at ground level (the legs' feet, y=0 inside
// Niro.tsx) rather than at the character's vertical center, so no extra
// lift is needed here to plant it on the terrain — offsetting by "half
// character height" would float it in the air.
const HEIGHT_OFFSET = 0;
const HEIGHT_LERP = 0.15;
// The 80x80 world has no visible hard walls (fog fades the edges out
// instead), but the character still shouldn't be able to wander past the
// point that stops making sense — clamped a little past the nominal
// walkable ~60x60 so the stop is never felt in practice, just quietly
// there before the player would want to go further anyway.
const WORLD_BOUND = 35;

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
  const { keys, interactPressed } = useKeyboard();
  const raycaster = useRef(new THREE.Raycaster());
  const headingRef = useRef(0); // radians; movement-direction convention: dir = (sin h, cos h)
  const movingRef = useRef(false);
  const setCharacterPosition = useStore((s) => s.setCharacterPosition);

  useFrame((_state, rawDelta) => {
    const group = groupRef.current;
    if (!group) return;
    const { activePanel, nearBuilding, setActivePanel } = useStore.getState();
    const delta = Math.min(rawDelta, 0.05);

    // E opens the panel for whichever building is in range. Closing (ESC or
    // the ✕ button) is owned by PanelShell instead of here, so both close
    // paths go through the same GSAP slide-out before the store actually
    // clears — closing straight from here would skip that animation.
    if (interactPressed.current) {
      interactPressed.current = false;
      if (!activePanel && nearBuilding) setActivePanel(nearBuilding);
    }

    // Re-read after the E handling above, which may have just changed it
    // this same frame — using the pre-press value here would let one frame
    // of movement slip through right as a panel opens.
    const panelOpen = useStore.getState().activePanel !== null;

    let dx = 0;
    let dz = 0;
    if (!panelOpen) {
      const k = keys.current;
      if (k.has('w') || k.has('arrowup')) dz -= 1;
      if (k.has('s') || k.has('arrowdown')) dz += 1;
      if (k.has('a') || k.has('arrowleft')) dx -= 1;
      if (k.has('d') || k.has('arrowright')) dx += 1;
    }

    const moving = dx !== 0 || dz !== 0;
    movingRef.current = moving;
    if (moving) {
      const len = Math.hypot(dx, dz); // normalize so diagonals aren't faster
      dx /= len;
      dz /= len;
      group.position.x = THREE.MathUtils.clamp(group.position.x + dx * MOVE_SPEED * delta, -WORLD_BOUND, WORLD_BOUND);
      group.position.z = THREE.MathUtils.clamp(group.position.z + dz * MOVE_SPEED * delta, -WORLD_BOUND, WORLD_BOUND);
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

    setCharacterPosition(group.position.x, group.position.y, group.position.z, headingRef.current);
  });

  return <Niro ref={groupRef} movingRef={movingRef} />;
}
