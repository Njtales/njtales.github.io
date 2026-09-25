import { useRef } from 'react';
import * as THREE from 'three';
import { Terrain } from './Terrain';
import { FollowCamera } from './FollowCamera';
import { Buildings } from './Buildings';
import { Paths } from './Paths';
import { Foliage } from './Foliage';
import { Mountains } from './Mountains';
import { NiroController } from '../character/NiroController';
import { useProximityCheck } from '../../hooks/useProximityCheck';

export function Scene() {
  const terrainRef = useRef<THREE.Mesh>(null);
  useProximityCheck();

  return (
    <>
      {/* Background matches the fog color exactly — with the shallower
          camera now able to see past the fogged terrain into empty space
          (nothing rendered beyond the ground plane's edge), a mismatched
          background would show as a visible seam where fully-fogged
          geometry meets the empty backdrop behind it. */}
      <color attach="background" args={['#B8E0F0']} />
      {/* Far pushed 65 -> 100 so the mountain ring (camera-distance ~61-89
          from spawn) lands mid-fog as a hazy silhouette instead of past
          full fog-opacity, where it'd be invisible. Near stays at 35. */}
      <fog attach="fog" args={['#B8E0F0', 35, 100]} />

      <ambientLight color="#FFFFFF" intensity={0.6} />
      <directionalLight color="#FFF5E0" intensity={1.2} position={[10, 20, 10]} />

      <FollowCamera />
      <Terrain ref={terrainRef} />
      <Mountains />
      <Paths />
      <Foliage />
      <Buildings />
      <NiroController terrainRef={terrainRef} />
    </>
  );
}
