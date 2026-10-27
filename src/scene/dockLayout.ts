export const DOCK_ORIGIN: [number, number, number] = [13, 0, 14.3]
export const DOCK_START_Z = DOCK_ORIGIN[2]
export const DOCK_END_Z = 21.2
export const DOCK_WIDTH = 2.8
export const DOCK_LANDING_START_Z = 19.5
export const DOCK_LANDING_WIDTH = 3.8
export const DOCK_RAMP_LENGTH = 1.2
export const DOCK_RAMP_END_Z = DOCK_START_Z + DOCK_RAMP_LENGTH
export const DOCK_SHORE_HEIGHT = 0.145
export const DOCK_DECK_HEIGHT = 0.34
export const DOCK_DECK_THICKNESS = 0.13

/** Full deck footprint in world coordinates; callers can apply their foot margin. */
export function dockContains(x: number, z: number) {
  if (z < DOCK_START_Z || z > DOCK_END_Z) return false
  const width = z >= DOCK_LANDING_START_Z ? DOCK_LANDING_WIDTH : DOCK_WIDTH
  return Math.abs(x - DOCK_ORIGIN[0]) <= width / 2
}

/** Exact top of the continuous deck, including the gently sloping shore ramp. */
export function dockHeightAt(x: number, z: number): number | undefined {
  if (!dockContains(x, z)) return undefined
  const ramp = Math.min(1, Math.max(0, (z - DOCK_START_Z) / DOCK_RAMP_LENGTH))
  return DOCK_SHORE_HEIGHT + (DOCK_DECK_HEIGHT - DOCK_SHORE_HEIGHT) * ramp
}
