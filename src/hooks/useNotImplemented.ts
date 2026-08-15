/* ============================================================
   useNotImplemented — SPEC §9
   Opens a modal for controls not yet built in this phase.
   "Silent no-ops are a bug."
   ============================================================ */

import { useAppStore } from '../store/useAppStore';

export function useNotImplemented() {
  const openModal = useAppStore((s) => s.openModal);

  return (section?: string) => {
    openModal({
      id: 'not-implemented',
      title: 'Not Available',
      component: 'NotImplemented',
      props: { section: section || 'a future phase' },
    });
  };
}
