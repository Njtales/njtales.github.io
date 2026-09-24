import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import type { BuildingDef } from '../../data/buildings';
import { useStore } from '../../store/useStore';

interface Props {
  building: BuildingDef;
  children: ReactNode;
}

/**
 * Shared wrapper for all 7 content panels: slide-in/out, backdrop blur,
 * close button, and the Escape key — both close paths go through the same
 * `handleClose` so pressing Escape gets the same GSAP slide-out as clicking
 * the button, rather than the panel just vanishing.
 */
export function PanelShell({ building, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const setActivePanel = useStore((s) => s.setActivePanel);

  // Layout effect (fires before paint) rather than a plain effect, so the
  // very first frame is already at xPercent:100 instead of briefly flashing
  // fully visible before the animation takes over. The transform is
  // deliberately NOT also set via a React `style` prop below — React would
  // reassert that value on every re-render and fight GSAP's own direct DOM
  // writes to the same property, which is exactly what left the panel stuck
  // off-screen the first time this was wired up.
  useLayoutEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(panelRef.current, { xPercent: 100 }, { xPercent: 0, duration: 0.35, ease: 'power2.out' });
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    if (!panelRef.current) {
      setActivePanel(null);
      return;
    }
    gsap.to(panelRef.current, {
      xPercent: 100,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => setActivePanel(null),
    });
  }

  return (
    <div
      ref={panelRef}
      className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#0D1117]/95 backdrop-blur-md p-8 overflow-y-auto text-white pointer-events-auto"
    >
      <button
        onClick={handleClose}
        aria-label="Close"
        className="absolute top-6 right-6 text-2xl leading-none text-[#AABBCC] hover:text-white transition-colors"
      >
        ✕
      </button>
      <p className="text-xs tracking-[0.15em] uppercase font-medium" style={{ color: building.color }}>
        {building.name}
      </p>
      <h2 className="text-3xl font-bold mt-1 pb-4 mb-6 border-b-2" style={{ borderColor: building.color }}>
        {building.panelHeader}
      </h2>
      {children}
    </div>
  );
}
