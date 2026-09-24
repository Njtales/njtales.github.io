import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './components/world/Scene';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
