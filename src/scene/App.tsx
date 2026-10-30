import { lazy, Suspense, useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { portfolioSpots, type PortfolioSpot } from './portfolioData'
import { mapPosition, sectionNames } from './portfolioUi'
import { readViewPreferences, ViewSettings } from './ViewSettings'
import { SceneBoundary } from './SceneBoundary'

const VillageCanvas = lazy(() => import('./VillageCanvas'))

const padButtons = [
  { code: 'KeyW', direction: 'up', label: 'Move forward' },
  { code: 'KeyA', direction: 'left', label: 'Move left' },
  { code: 'KeyS', direction: 'down', label: 'Move backward' },
  { code: 'KeyD', direction: 'right', label: 'Move right' },
]

function MovementPad() {
  const send = (code: string, down: boolean) => window.dispatchEvent(
    new CustomEvent('coastlight:move', { detail: { code, down } }),
  )
  return (
    <div className="movement-pad" role="group" aria-label="Character movement">
      {padButtons.map(({ code, direction, label }) => (
        <button
          key={code}
          type="button"
          className={`pad-${direction}`}
          aria-label={label}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); send(code, true) }}
          onPointerUp={() => send(code, false)}
          onPointerCancel={() => send(code, false)}
          onLostPointerCapture={() => send(code, false)}
        >
          {direction === 'up' ? '▲' : direction === 'down' ? '▼' : direction === 'left' ? '◀' : '▶'}
        </button>
      ))}
    </div>
  )
}

function PortfolioMap({ selectedId, onSelect, playerMarker, isCompact }: { selectedId: string | null; onSelect: (spot: PortfolioSpot) => void;
  playerMarker: RefObject<HTMLSpanElement | null>; isCompact: boolean }) {
  return (
    <aside className="portfolio-map" aria-label="Portfolio landmarks">
      <div className="map-heading"><span>COASTLIGHT</span><small>7 LANDMARKS</small></div>
      <div className="map-body">
        <svg viewBox="0 0 180 112" aria-hidden="true">
          <path d="M17 24 38 15 61 19 78 12 104 18 126 14 154 25 163 44 156 63 164 78 145 91 119 90 99 101 74 94 51 100 31 88 19 68 24 49Z" />
        </svg>
        {portfolioSpots.map((spot, index) => {
          const { left, top } = mapPosition(spot.position[0], spot.position[2])
          return (
            <button
              key={spot.id}
              type="button"
              className={`map-pin${selectedId === spot.id ? ' is-selected' : ''}`}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={`${sectionNames[spot.id]} · ${spot.title}`}
              aria-label={`Open ${spot.title}`}
              aria-pressed={selectedId === spot.id}
              onClick={() => onSelect(spot)}
            >{index + 1}</button>
          )
        })}
        <span ref={playerMarker} className="map-player" role="img" aria-label="Niro’s current position"
          style={{ left: `${mapPosition(-3, 5.5).left}%`, top: `${mapPosition(-3, 5.5).top}%` }}><span>Niro</span></span>
      </div>
      <details className="map-sections" open={!isCompact}>
        <summary>Explore sections</summary>
        <div>{portfolioSpots.map((spot, index) => <button key={spot.id} type="button" aria-label={`Open ${sectionNames[spot.id]}`}
          aria-pressed={selectedId === spot.id} onClick={() => onSelect(spot)}><span>{index + 1}</span>{sectionNames[spot.id]}</button>)}</div>
      </details>
    </aside>
  )
}

const portfolioShortcuts = [
  { id: 'clocktower', label: 'Experience' },
  { id: 'cloud-forge', label: 'Skills' },
  { id: 'data-tower', label: 'Projects' },
  { id: 'signal-station', label: 'Contact' },
]

function PortfolioShortcuts({ selectedId, onSelect }: { selectedId: string | null; onSelect: (spot: PortfolioSpot) => void }) {
  return (
    <nav className="portfolio-shortcuts" aria-label="Portfolio sections">
      {portfolioShortcuts.map(({ id, label }) => {
        const spot = portfolioSpots.find((candidate) => candidate.id === id)
        if (!spot) return null
        return (
          <button
            key={id}
            type="button"
            data-active={selectedId === id ? 'true' : undefined}
            onClick={() => onSelect(spot)}
          >{label}</button>
        )
      })}
    </nav>
  )
}

export default function App() {
  const [selected, setSelected] = useState<PortfolioSpot | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneUnavailable, setSceneUnavailable] = useState(false)
  const [preferences, setPreferences] = useState(readViewPreferences)
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' && (
    window.matchMedia('(max-width: 700px)').matches || window.matchMedia('(pointer: coarse)').matches
  ))
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const panelOpen = Boolean(selected)
  const selectedIndex = portfolioSpots.findIndex(spot => spot.id === selected?.id)
  const adjacent = (offset: number) => portfolioSpots[(selectedIndex + offset + portfolioSpots.length) % portfolioSpots.length]
  const playerMarker = useRef<HTMLSpanElement>(null)
  const updatePosition = useCallback((x: number, z: number) => {
    if (!playerMarker.current) return
    const position = mapPosition(x, z)
    playerMarker.current.style.left = `${position.left}%`; playerMarker.current.style.top = `${position.top}%`
    playerMarker.current.dataset.worldX = x.toFixed(2); playerMarker.current.dataset.worldZ = z.toFixed(2)
  }, [])
  const markReady = useCallback(() => setSceneReady(true), [])
  const handleUnavailable = useCallback(() => { setSceneReady(true); setSceneUnavailable(true) }, [])
  useEffect(() => { try { localStorage.setItem('coastlight-view', JSON.stringify(preferences)) } catch { /* private browsing */ } }, [preferences])

  useEffect(() => {
    const smallViewport = window.matchMedia('(max-width: 700px)')
    const coarsePointer = window.matchMedia('(pointer: coarse)')
    const updateViewport = () => setIsCompact(smallViewport.matches || coarsePointer.matches)
    updateViewport()
    smallViewport.addEventListener('change', updateViewport)
    coarsePointer.addEventListener('change', updateViewport)
    return () => {
      smallViewport.removeEventListener('change', updateViewport)
      coarsePointer.removeEventListener('change', updateViewport)
    }
  }, [])

  useEffect(() => {
    if (!panelOpen) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-dialog-close]')
    closeButton?.focus()
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.code === 'KeyE' && event.repeat) { event.preventDefault(); event.stopImmediatePropagation(); return }
      if (event.key === 'Escape' || event.code === 'KeyE') {
        event.preventDefault()
        event.stopImmediatePropagation()
        setSelected(null)
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleDialogKeys, true)
    return () => {
      window.removeEventListener('keydown', handleDialogKeys, true)
      previousFocus.current?.focus()
    }
  }, [panelOpen])

  useEffect(() => {
    if (!selected) return
    dialogRef.current?.scrollTo({ top: 0 })
  }, [selected?.id])

  return (
    <main className="app-shell" data-panel-open={Boolean(selected)} data-scene-unavailable={sceneUnavailable} data-scene-ready={sceneReady} data-reduced-motion={preferences.reducedMotion}>
      <SceneBoundary onUnavailable={handleUnavailable}><Suspense fallback={null}>
        <VillageCanvas isCompact={isCompact} onReady={markReady} onOpen={setSelected} onPlayerPosition={updatePosition}
          quality={preferences.quality} reducedMotion={preferences.reducedMotion} panelOpen={Boolean(selected)} />
      </Suspense></SceneBoundary>
      {!sceneReady && <div className="scene-loading" role="status" aria-live="polite">Preparing your world</div>}
      <div inert={Boolean(selected)}>
      <div className="title-card">
        <span className="eyebrow">Nikhil Jatale · London, UK</span>
        <h1>Coastlight Village</h1>
        <p>Enterprise data analyst building toward cloud data platforms.</p>
        <PortfolioShortcuts selectedId={selected?.id ?? null} onSelect={setSelected} />
      </div>
      <PortfolioMap selectedId={selected?.id ?? null} onSelect={setSelected} playerMarker={playerMarker} isCompact={isCompact} />
      <MovementPad />
      <ViewSettings value={preferences} onChange={setPreferences} />
      <div className="control-hint">
        <span className="desktop-controls">Click ground to walk <i>·</i> <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to steer <i>·</i> <kbd>E</kbd> to open / close</span>
        <span className="touch-controls">Tap ground to walk <i>·</i> choose a section to explore</span>
      </div>
      </div>
      {selected && (
        <div className="panel-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section ref={dialogRef} className="portfolio-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-topline"><span>{selected.section}</span><button data-dialog-close type="button" aria-label="Close panel" onClick={() => setSelected(null)}>×</button></div>
            <div className="panel-landmark" aria-hidden="true">{String(selectedIndex + 1).padStart(2, '0')}<span>COASTLIGHT FIELD NOTES</span></div>
            <h2 id="panel-title" aria-live="polite">{selected.title}</h2>
            <p>{selected.description}</p>
            <div className="portfolio-entries">
              {selected.entries.map((entry) => (
                <article className="portfolio-entry" key={entry.title}>
                  <div className="entry-heading"><h3>{entry.title}</h3>{entry.status&&<span className="entry-status">{entry.status}</span>}</div>
                  <p>{entry.detail}</p>
                  {entry.tags && <div className="entry-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
                  {entry.link&&<a className="entry-link" href={entry.link.href} target="_blank" rel="noopener noreferrer">{entry.link.label}<span aria-hidden="true"> ↗</span></a>}
                </article>
              ))}
            </div>
            {selected.id === 'signal-station' && <nav className="contact-actions" aria-label="Contact links">
              <a href="mailto:nikhiljatale@gmail.com">Email Nikhil</a>
              <a href="https://www.linkedin.com/in/nikhil-jatale/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://github.com/Njtales" target="_blank" rel="noopener noreferrer">GitHub</a>
            </nav>}
            <nav className="panel-navigation" aria-label="Explore another section">
              <button type="button" aria-label={`Previous section: ${sectionNames[adjacent(-1).id]}`} onClick={() => setSelected(adjacent(-1))}>
                <span aria-hidden="true">←</span><span><small>Previous</small>{sectionNames[adjacent(-1).id]}</span>
              </button>
              <button type="button" aria-label={`Next section: ${sectionNames[adjacent(1).id]}`} onClick={() => setSelected(adjacent(1))}>
                <span><small>Next</small>{sectionNames[adjacent(1).id]}</span><span aria-hidden="true">→</span>
              </button>
            </nav>
            <p className="panel-close-hint"><span className="desktop-controls">Press E or Escape to return to the island.</span>
              <span className="touch-controls">Close this card to return to the island.</span></p>
            <div className="panel-footer"><span>COASTLIGHT VILLAGE</span><span>{portfolioSpots.findIndex((spot) => spot.id === selected.id) + 1} / {portfolioSpots.length}</span></div>
          </section>
        </div>
      )}
    </main>
  )
}
