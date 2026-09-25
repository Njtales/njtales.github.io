import type * as THREE from 'three';
import { createToonGradientMap } from '../textures/canvasTextures';

let cached: THREE.CanvasTexture | null = null;

/** One shared 4-step toon gradient map, reused by every MeshToonMaterial in
 * the scene (terrain, buildings, mountains, the character) so the whole
 * world reads as one consistent lighting language instead of each object
 * baking its own slightly-different ramp. */
export function getToonGradientMap(): THREE.CanvasTexture {
  if (!cached) cached = createToonGradientMap(4);
  return cached;
}
