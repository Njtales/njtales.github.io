import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { VillageWorld } from './VillageWorld'
import { portfolioSpots, type PortfolioSpot } from './portfolioData'

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
    <div className="movement-pad" aria-label="Character movement">
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

function PortfolioMap({ selectedId, onSelect }: { selectedId: string | null; onSelect: (spot: PortfolioSpot) => void }) {
  return (
    <aside className="portfolio-map" aria-label="Portfolio landmarks">
      <div className="map-heading"><span>COASTLIGHT</span><small>7 LANDMARKS</small></div>
      <div className="map-body">
        <svg viewBox="0 0 180 112" aria-hidden="true">
          <path d="M17 24 38 15 61 19 78 12 104 18 126 14 154 25 163 44 156 63 164 78 145 91 119 90 99 101 74 94 51 100 31 88 19 68 24 49Z" />
          <path className="map-route" d="M39 68 Q65 62 83 69 T128 63" />
        </svg>
        {portfolioSpots.map((spot, index) => {
          const left = 17 + ((spot.position[0] + 26) / 33) * 66
          const top = 16 + ((spot.position[2] + 4) / 10) * 67
          return (
            <button
              key={spot.id}
              type="button"
              className={`map-pin${selectedId === spot.id ? ' is-selected' : ''}`}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={spot.title}
              aria-label={`Open ${spot.title}`}
              aria-pressed={selectedId === spot.id}
              onClick={() => onSelect(spot)}
            >{index + 1}</button>
          )
        })}
      </div>
      <div className="map-caption">SELECT A LANDMARK TO EXPLORE</div>
    </aside>
  )
}

export default function App() {
  const [selected, setSelected] = useState<PortfolioSpot | null>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!selected) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-dialog-close]')
    closeButton?.focus()
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
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
    window.addEventListener('keydown', handleDialogKeys)
    return () => {
      window.removeEventListener('keydown', handleDialogKeys)
      previousFocus?.focus()
    }
  }, [selected])

  return (
    <main className="app-shell">
      <Canvas
        shadows
        dpr={[1, 1.7]}
        camera={{ position: [0, 8.8, 33], fov: 42, near: 0.1, far: 180 }}
        gl={{ antialias: true, toneMapping: 3 }}
        onCreated={({ gl }) => { gl.domElement.tabIndex = 0 }}
      >
        <color attach="background" args={['#70d4e8']} />
        <fog attach="fog" args={['#a6e5e9', 48, 105]} />
        <ambientLight intensity={1.5} />
        <directionalLight
          castShadow
          position={[-10, 22, 12]}
          intensity={2.1}
          color="#fff2ce"
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-36}
          shadow-camera-right={36}
          shadow-camera-top={34}
          shadow-camera-bottom={-34}
        />
        <Suspense fallback={null}>
          <VillageWorld onOpen={setSelected} />
        </Suspense>
      </Canvas>
      <div className="title-card">
        <span className="eyebrow">Nikhil Jatale · London, UK</span>
        <h1>Coastlight Village</h1>
        <p>Enterprise data analyst building toward cloud data platforms.</p>
      </div>
      <PortfolioMap selectedId={selected?.id ?? null} onSelect={setSelected} />
      <div className="scene-note">WORLD 01 <span>·</span> THE SHORE</div>
      <MovementPad />
      <div className="control-hint">
        <span className="desktop-controls"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to explore <i>·</i> walk to a landmark and press <kbd>E</kbd></span>
        <span className="touch-controls">Use arrows to move <i>·</i> tap a map pin to explore</span>
      </div>
      {selected && (
        <div className="panel-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section ref={dialogRef} className="portfolio-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-topline"><span>{selected.section}</span><button data-dialog-close type="button" aria-label="Close panel" onClick={() => setSelected(null)}>×</button></div>
            <h2 id="panel-title">{selected.title}</h2>
            <p>{selected.description}</p>
            <div className="portfolio-entries">
              {selected.entries.map((entry) => (
                <article className="portfolio-entry" key={entry.title}>
                  <h3>{entry.title}</h3>
                  <p>{entry.detail}</p>
                  {entry.tags && <div className="entry-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
                </article>
              ))}
            </div>
            <div className="panel-footer"><span>COASTLIGHT VILLAGE</span><span>{portfolioSpots.findIndex((spot) => spot.id === selected.id) + 1} / {portfolioSpots.length}</span></div>
          </section>
        </div>
      )}
    </main>
  )
}
