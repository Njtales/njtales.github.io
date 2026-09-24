import { useEffect, useRef } from 'react';

const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

/**
 * Tracks which movement/interact keys are currently held, as a plain mutable
 * ref rather than React state — polled once per frame inside useFrame, so a
 * key press never triggers a React re-render on its own.
 */
export function useKeyboard() {
  const keys = useRef(new Set<string>());
  const interactPressed = useRef(false);
  const escapePressed = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (MOVE_KEYS.has(key)) keys.current.add(key);
      if (key === 'e') interactPressed.current = true;
      if (key === 'escape') escapePressed.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return { keys, interactPressed, escapePressed };
}
