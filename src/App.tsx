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
        // Cineon tone mapping (not the flat NoToneMapping used before) is
        // what gives real contrast/warmth to lit surfaces instead of a flat
        // raw-lit look — confirmed by reading a working reference project
        // built on the same stack that nails this exact visual target.
        gl={{ powerPreference: 'high-performance', toneMapping: THREE.CineonToneMapping }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
      <InteractPrompt />
      <PanelHost />
    </div>
  );
}
