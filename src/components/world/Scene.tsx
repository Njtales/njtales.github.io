import { useRef } from 'react';
import * as THREE from 'three';
import { Selection, EffectComposer, Outline } from '@react-three/postprocessing';
import { Terrain } from './Terrain';
import { FollowCamera } from './FollowCamera';
import { Buildings } from './Buildings';
import { Paths } from './Paths';
import { Foliage } from './Foliage';
import { Mountains } from './Mountains';
import { Clouds } from './Clouds';
import { NiroController } from '../character/NiroController';
import { useProximityCheck } from '../../hooks/useProximityCheck';

export function Scene() {
  const terrainRef = useRef<THREE.Mesh>(null);
  useProximityCheck();

  return (
    <Selection>
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

      {/* Intensities and warm directional color matched to a working
          reference project on the same stack — our old 0.6/1.2 read flat
          and under-lit by comparison. Shadow-camera bounds sized to cover
          the whole island (radius ~36) so nothing outside the frustum
          silently drops its shadow. */}
      <ambientLight color="#FFFFFF" intensity={2.1} />
      <directionalLight
        color="#FFF2CE"
        intensity={2.1}
        position={[-10, 22, 12]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
      />

      {/* Ink-outline effect on buildings + Niro (each wraps itself in
          <Select enabled> — Buildings.tsx, Niro via NiroController.tsx).
          A real postprocessing pass gives consistent, crisp silhouette
          lines across every object it wraps in one place, instead of the
          per-object "wider mesh underneath" trick used for the dirt
          paths — better suited to paths' flat ribbons than to the
          buildings' and Niro's fully 3D silhouettes. */}
      <EffectComposer autoClear={false}>
        <Outline blur={false} edgeStrength={8} visibleEdgeColor={0x1a0a00} hiddenEdgeColor={0x1a0a00} xRay={false} />
      </EffectComposer>

      <FollowCamera />
      <Terrain ref={terrainRef} />
      <Mountains />
      <Clouds />
      <Paths />
      <Foliage />
      <Buildings />
      <NiroController terrainRef={terrainRef} />
    </Selection>
  );
}
