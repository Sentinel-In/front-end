/* ============================================================
   StickyContextHeader — SPEC §9
   Placeholder for per-page context headers (Phase 3+).
   ============================================================ */

import type { ReactNode } from 'react';

interface StickyContextHeaderProps {
  children: ReactNode;
}

export function StickyContextHeader({ children }: StickyContextHeaderProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: '12px 24px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {children}
    </div>
  );
}
