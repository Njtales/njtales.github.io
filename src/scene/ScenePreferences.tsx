import { createContext, useContext, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export type GraphicsQuality = 'standard' | 'light'
export type ScenePreferences = { quality: GraphicsQuality; reducedMotion: boolean; panelOpen: boolean }
export const ScenePreferencesContext = createContext<ScenePreferences>({ quality: 'standard', reducedMotion: false, panelOpen: false })
export const useScenePreferences = () => useContext(ScenePreferencesContext)

/** Decorative time pauses for dialogs and reduced motion; walking stays usable. */
export function useAmbientTime() {
  const preferences = useScenePreferences(), time = useRef(0)
  useFrame((_, delta) => {
    if (!preferences.panelOpen && !preferences.reducedMotion) time.current += Math.min(delta, .05)
  }, -1)
  return time
}
