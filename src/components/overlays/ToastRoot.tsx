/* ============================================================
   ToastRoot — SPEC §7
   Renders toast stack. Bottom-right, auto-dismiss,
   Framer Motion slide-in/out.
   ============================================================ */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const TOAST_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
} as const;

const TOAST_COLORS = {
  info: 'var(--color-accent)',
  success: 'var(--color-safe)',
  warning: 'var(--color-medium)',
  error: 'var(--color-critical)',
} as const;

export function ToastRoot() {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '400px',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type];
          const accentColor = TOAST_COLORS[toast.type];

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-panel)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                borderLeft: `3px solid ${accentColor}`,
              }}
            >
              <Icon size={16} style={{ color: accentColor, marginTop: '1px', flexShrink: 0 }} />
              <p
                style={{
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  margin: 0,
                  flex: 1,
                }}
              >
                {toast.message}
              </p>
              <button
                onClick={() => dismissToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: '0',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
                aria-label="Dismiss toast"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
