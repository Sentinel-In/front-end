/* ============================================================
   useKeyboardShortcuts — SPEC §9, §11
   Global keyboard shortcuts.
   Esc closes topmost overlay.
   ⌘K opens command palette.
   ⌘J toggles assistant.
   ============================================================ */

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useKeyboardShortcuts() {
  const closeModal = useAppStore((s) => s.closeModal);
  const closeDrawer = useAppStore((s) => s.closeDrawer);
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);
  const modals = useAppStore((s) => s.modals);
  const drawer = useAppStore((s) => s.drawer);
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Esc: close topmost overlay (modal → drawer → palette)
      if (e.key === 'Escape') {
        if (modals.length > 0) {
          closeModal();
        } else if (drawer) {
          closeDrawer();
        } else if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        }
        return;
      }

      // ⌘K: toggle command palette
      if (meta && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // ⌘J: toggle assistant (Phase 6 — placeholder)
      if (meta && e.key === 'j') {
        e.preventDefault();
        // Will be connected to assistant store in Phase 6
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modals, drawer, commandPaletteOpen, closeModal, closeDrawer, toggleCommandPalette, setCommandPaletteOpen]);
}
