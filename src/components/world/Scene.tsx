import { useRef } from 'react';
import * as THREE from 'three';
import { Terrain } from './Terrain';
import { FollowCamera } from './FollowCamera';
import { NiroController } from '../character/NiroController';

export function Scene() {
  const terrainRef = useRef<THREE.Mesh>(null);

  return (
    <>
      <color attach="background" args={['#7EC8E8']} />
      <fog attach="fog" args={['#B8E0F0', 35, 65]} />

      <ambientLight color="#FFFFFF" intensity={0.6} />
      <directionalLight color="#FFF5E0" intensity={1.2} position={[10, 20, 10]} />

      <FollowCamera />
      <Terrain ref={terrainRef} />
      <NiroController terrainRef={terrainRef} />
    </>
  );
}
