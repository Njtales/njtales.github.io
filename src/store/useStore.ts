import { create } from 'zustand';

export type BuildingId =
  | 'dataTower'
  | 'cloudForge'
  | 'careerClocktower'
  | 'learningLab'
  | 'aboutCottage'
  | 'hobbiesHut'
  | 'signalStation';

interface WorldState {
  /** Which content panel is open, if any. Setting this also freezes character input. */
  activePanel: BuildingId | null;
  setActivePanel: (id: BuildingId | null) => void;

  /** The building the character is currently in interact-prompt range of. */
  nearBuilding: BuildingId | null;
  setNearBuilding: (id: BuildingId | null) => void;

  /** Set briefly when a legend entry is clicked, to pulse its minimap dot. */
  highlightedBuilding: BuildingId | null;
  setHighlightedBuilding: (id: BuildingId | null) => void;

  /**
   * Character transform, written every frame by NiroController. Consumers
   * that need per-frame freshness (the minimap) should read via
   * `useStore.getState()` inside their own rAF/useFrame loop rather than the
   * reactive hook, so a 60fps position write doesn't force a React render
   * of everything subscribed to the store.
   */
  position: { x: number; z: number; heading: number };
  setPosition: (x: number, z: number, heading: number) => void;
}

export const useStore = create<WorldState>((set) => ({
  activePanel: null,
  setActivePanel: (id) => set({ activePanel: id }),

  nearBuilding: null,
  setNearBuilding: (id) => set({ nearBuilding: id }),

  highlightedBuilding: null,
  setHighlightedBuilding: (id) => set({ highlightedBuilding: id }),

  position: { x: 0, z: 0, heading: 0 },
  setPosition: (x, z, heading) => set({ position: { x, z, heading } }),
}));
