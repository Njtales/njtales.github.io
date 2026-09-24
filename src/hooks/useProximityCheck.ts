import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BUILDINGS } from '../data/buildings';
import { useStore, type BuildingId } from '../store/useStore';

const PROXIMITY_RADIUS = 3.5;

/**
 * Finds the closest building within the interact radius (if any) and writes
 * it to `nearBuilding` once per frame — centralized here rather than one
 * useFrame per building so two overlapping proximity radii can't fight over
 * the store, and picking the *closest* one is a natural side effect of a
 * single pass. Only writes to the store when the answer actually changes,
 * so standing still doesn't cause a write (and re-render of anything
 * subscribed to nearBuilding) every frame.
 */
export function useProximityCheck() {
  const setNearBuilding = useStore((s) => s.setNearBuilding);
  const lastNear = useRef<BuildingId | null>(null);

  useFrame(() => {
    const { x, z } = useStore.getState().characterPosition;
    let closest: BuildingId | null = null;
    let closestDist = PROXIMITY_RADIUS;
    for (const building of BUILDINGS) {
      const dx = x - building.position[0];
      const dz = z - building.position[2];
      const dist = Math.hypot(dx, dz);
      if (dist < closestDist) {
        closestDist = dist;
        closest = building.id;
      }
    }
    if (closest !== lastNear.current) {
      lastNear.current = closest;
      setNearBuilding(closest);
    }
  });
}
