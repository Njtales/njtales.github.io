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
    <summary aria-label="View settings" title="View settings"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v4m0 4v10M12 3v10m0 4v4M18 3v2m0 4v12"/><circle cx="6" cy="9" r="2"/><circle cx="12" cy="15" r="2"/><circle cx="18" cy="7" r="2"/></svg></summary>
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
