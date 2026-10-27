import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { VillageWorld } from './VillageWorld'
import type { PortfolioSpot } from './portfolioData'
import { initialRenderDpr } from './renderQuality'
import { ScenePreferencesContext, type ScenePreferences } from './ScenePreferences'

function SceneReady({ onReady }: { onReady: () => void }) {
  const invalidate = useThree(state => state.invalidate)
  const frames = useRef(0)
  const signalled = useRef(false)
  useFrame(() => {
    if (signalled.current) return
    frames.current += 1
    if (frames.current >= 3) {
      signalled.current = true
      onReady()
    } else invalidate()
  })
  return null
}
export default function VillageCanvas({
  isCompact,
  onReady,
  onOpen,
  onPlayerPosition, quality, reducedMotion, panelOpen,
}: {
  isCompact: boolean
  onReady: () => void
  onOpen: (spot: PortfolioSpot) => void
  onPlayerPosition: (x: number, z: number) => void
  quality: ScenePreferences['quality']; reducedMotion: boolean; panelOpen: boolean
}) {
  return (
    <Canvas
      shadows
      frameloop={panelOpen ? 'demand' : 'always'}
      dpr={initialRenderDpr(window.innerWidth, window.innerHeight, window.devicePixelRatio, isCompact)}
      camera={{ position: [0, 8.8, 33], fov: 42, near: 0.1, far: 180 }}
      gl={{ antialias: true, toneMapping: 3, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.domElement.tabIndex = 0
        gl.domElement.setAttribute('aria-label', 'Interactive Coastlight Village. Use W, A, S, D or arrow keys to move Niro, or choose a landmark from the map.')
      }}
    >
      <ScenePreferencesContext.Provider value={{ quality, reducedMotion, panelOpen }}>
      <SceneReady onReady={onReady} />
      <color attach="background" args={['#70d4e8']} />
      <fog attach="fog" args={['#b8e8e9', 48, 105]} />
      <ambientLight intensity={1.5} />
      <directionalLight
        castShadow
        position={[-10, 22, 12]}
        intensity={2.1}
        color="#fff2ce"
        shadow-mapSize={quality === 'light' ? [512, 512] : [1024, 1024]}
        shadow-normalBias={0.025}
        shadow-bias={-0.0001}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
      />
      <VillageWorld onOpen={onOpen} onPlayerPosition={onPlayerPosition} />
      </ScenePreferencesContext.Provider>
    </Canvas>
  )
}
