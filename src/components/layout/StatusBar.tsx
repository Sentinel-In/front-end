/* ============================================================
   StatusBar — SPEC §9
   Thin bottom bar with audit chain status and LLM provider.
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { Link2, ShieldCheck, Cpu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function StatusBar() {
  const navigate = useNavigate();
  const pushToast = useAppStore((s) => s.pushToast);

  return (
    <footer
      className="flex items-center justify-between"
      style={{
        height: '28px',
        padding: '0 20px',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-dim)',
        flexShrink: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Audit chain status */}
      <button
        onClick={() => navigate('/audit')}
        className="flex items-center gap-1"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-safe)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          padding: '2px 0',
        }}
        aria-label="Navigate to audit trail"
      >
        <ShieldCheck size={12} />
        <span>audit chain #8,441 verified</span>
      </button>

      {/* Center: Connection status */}
      <div className="flex items-center gap-1">
        <Link2 size={12} />
        <span>local mock · 0 external</span>
      </div>

      {/* Right: LLM Provider */}
      <button
        onClick={() => {
          pushToast({
            message: 'LLM provider settings — coming in Phase 6.',
            type: 'info',
            duration: 2000,
          });
        }}
        className="flex items-center gap-1"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-dim)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          padding: '2px 0',
        }}
        aria-label="LLM provider settings"
      >
        <Cpu size={12} />
        <span>Gemini 2.5 Pro</span>
      </button>
    </footer>
  );
}
