import type { GraphicsQuality } from './ScenePreferences'

export type ViewPreferences = { quality: GraphicsQuality; reducedMotion: boolean }
export function readViewPreferences(): ViewPreferences {
  const fallback: ViewPreferences = { quality: 'standard', reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches }
  try {
    const saved = JSON.parse(localStorage.getItem('coastlight-view') || 'null')
    return saved ? { quality: saved.quality === 'light' ? 'light' : 'standard',
      reducedMotion: typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : fallback.reducedMotion } : fallback
  } catch { return fallback }
}
export function ViewSettings({ value, onChange }: { value: ViewPreferences; onChange: (value: ViewPreferences) => void }) {
  return <details className="view-settings">
    <summary>View settings</summary>
    <div className="view-settings-menu">
      <label htmlFor="graphics-quality">Graphics</label>
      <select id="graphics-quality" value={value.quality} onChange={event => onChange({ ...value, quality: event.target.value as GraphicsQuality })}>
        <option value="standard">Full detail</option><option value="light">Lighter</option>
      </select>
      <label className="motion-setting"><input type="checkbox" checked={value.reducedMotion}
        onChange={event => onChange({ ...value, reducedMotion: event.target.checked })} /> Less ambient motion</label>
      <small>Lighter effects and shadows. Edges stay smooth.</small>
    </div>
  </details>
}
