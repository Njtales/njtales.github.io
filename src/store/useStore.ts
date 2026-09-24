import { create } from 'zustand';

export type BuildingId = 'projects' | 'techstack' | 'experience' | 'learning' | 'about' | 'hobbies' | 'contact';

interface WorldState {
  /** Which content panel is open, if any. Setting this also freezes character input. */
  activePanel: BuildingId | null;
  setActivePanel: (id: BuildingId | null) => void;

  /** The building the character is currently in interact-prompt range of. */
  nearBuilding: BuildingId | null;
  setNearBuilding: (id: BuildingId | null) => void;

  /** Mouse-hover state for the in-scene hover-scale + label effect (step 13). */
  hoveredBuilding: BuildingId | null;
  setHoveredBuilding: (id: BuildingId | null) => void;

  /** Set briefly when a legend entry is clicked, to pulse its minimap dot. */
  highlightedBuilding: BuildingId | null;
  setHighlightedBuilding: (id: BuildingId | null) => void;

  /**
   * Character transform, written every frame by NiroController. Consumers
   * that need per-frame freshness (the minimap) should read via
   * `useStore.getState()` inside their own rAF/useFrame loop rather than the
   * reactive hook, so a 60fps position write doesn't force a React render
   * of everything subscribed to the store. `heading` isn't in the spec's
   * literal store shape but is needed by both the camera's look-ahead point
   * and the minimap's facing-direction tick, so it lives here alongside x/y/z
   * rather than as a second store.
   */
  characterPosition: { x: number; y: number; z: number; heading: number };
  setCharacterPosition: (x: number, y: number, z: number, heading: number) => void;
}

export const useStore = create<WorldState>((set) => ({
  activePanel: null,
  setActivePanel: (id) => set({ activePanel: id }),

  nearBuilding: null,
  setNearBuilding: (id) => set({ nearBuilding: id }),

  hoveredBuilding: null,
  setHoveredBuilding: (id) => set({ hoveredBuilding: id }),

  highlightedBuilding: null,
  setHighlightedBuilding: (id) => set({ highlightedBuilding: id }),

  characterPosition: { x: 0, y: 0, z: 0, heading: 0 },
  setCharacterPosition: (x, y, z, heading) => set({ characterPosition: { x, y, z, heading } }),
}));
