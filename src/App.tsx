import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './components/world/Scene';
import { PanelHost } from './components/panels/PanelHost';
import { InteractPrompt } from './components/ui/InteractPrompt';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
      <InteractPrompt />
      <PanelHost />
    </div>
  );
}
