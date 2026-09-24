import { useStore } from '../../store/useStore';

/** "[ E ] Enter" — shown while in proximity range and no panel is already
 * open. Full visual polish (position tied to the building's screen-space
 * entrance) lands with the rest of the UI overlay in step 12; this proves
 * the interaction loop end to end for now. */
export function InteractPrompt() {
  const nearBuilding = useStore((s) => s.nearBuilding);
  const activePanel = useStore((s) => s.activePanel);

  if (!nearBuilding || activePanel) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-20 px-4 py-2 rounded-full bg-black/60 text-white text-sm pointer-events-none select-none">
      <span className="font-mono font-medium">[ E ]</span> Enter
    </div>
  );
}
