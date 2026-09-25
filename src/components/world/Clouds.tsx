import { useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import { createCloudPuffTexture } from '../../textures/canvasTextures';

const CLOUD_COUNT = 14;
const VARIANT_COUNT = 4;
// Learned from the mountain-visibility bug, twice over: the follow
// camera's frustum only reaches ~4 deg above horizontal at its top edge
// (fixed ~21 deg downward pitch, 50 fov). The first pass here ({45-62,
// radius 95}) put every cloud 30-45 deg above horizontal; a second pass
// ({10-22, radius 75}) was still 10-18 deg - both well outside the
// frustum. Elevation angle from the camera is atan((height-cameraY)/dist),
// so for a fixed height gap above the ~6-unit-high camera, only distance
// brings the angle down - solved numerically for a low, close band that
// lands most clouds at roughly 1-5 deg elevation, safely inside the
// frustum instead of just barely grazing its edge.
const SKY_HEIGHT_MIN = 7;
const SKY_HEIGHT_MAX = 12;
const SCATTER_RADIUS_MIN = 45;
const SCATTER_RADIUS_MAX = 85;

function hash(n: number): number {
  const s = Math.sin(n * 61.51) * 91453.847;
  return s - Math.floor(s);
}

/**
 * A handful of soft billboarded cloud puffs scattered high over the play
 * area. Billboard (already used for the nametag/zone labels) keeps each
 * one facing the camera — appropriate here, unlike Niro, since clouds have
 * no facing direction of their own to preserve. Fog is disabled on the
 * material so distant clouds don't wash out inconsistently with how close
 * or far the character happens to be standing.
 */
export function Clouds() {
  const textures = useMemo(() => Array.from({ length: VARIANT_COUNT }, () => createCloudPuffTexture()), []);

  const clouds = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }, (_, i) => {
        const angle = hash(i * 3.3) * Math.PI * 2;
        const radius = SCATTER_RADIUS_MIN + hash(i * 5.5) * (SCATTER_RADIUS_MAX - SCATTER_RADIUS_MIN);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = SKY_HEIGHT_MIN + hash(i * 7.7) * (SKY_HEIGHT_MAX - SKY_HEIGHT_MIN);
        const scale = 10 + hash(i * 9.9) * 14;
        const opacity = 0.45 + hash(i * 4.4) * 0.3;
        return {
          position: [x, y, z] as [number, number, number],
          scale,
          opacity,
          texture: textures[i % VARIANT_COUNT],
        };
      }),
    [textures],
  );

  return (
    <>
      {clouds.map((c, i) => (
        <Billboard key={i} position={c.position}>
          <mesh scale={[c.scale, c.scale * 0.6, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={c.texture} transparent opacity={c.opacity} depthWrite={false} fog={false} />
          </mesh>
        </Billboard>
      ))}
    </>
  );
}
