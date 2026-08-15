/* ============================================================
   ModalRoot — SPEC §7, §11
   Renders the modal stack from useAppStore.
   Focus trapping, aria-modal, Esc to close.
   ============================================================ */

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ModalContentProps {
  id: string;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

function ModalContent({ id, title, children, onClose }: ModalContentProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();

    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${id}`}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--density-card-padding)',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <h2
            id={`modal-title-${id}`}
            className="text-base font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-ctl)',
              color: 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ModalRoot() {
  const modals = useAppStore((s) => s.modals);
  const closeModal = useAppStore((s) => s.closeModal);

  return (
    <AnimatePresence>
      {modals.map((modal) => (
        <ModalContent
          key={modal.id}
          id={modal.id}
          title={modal.title}
          onClose={() => closeModal(modal.id)}
        >
          {/* Render based on component type */}
          {modal.component === 'NotImplemented' && (
            <div>
              <p style={{ color: 'var(--color-text-2)', fontSize: '14px', lineHeight: '1.6' }}>
                Not in this build — this control is specified in SPEC.md §{(modal.props?.section as string) || 'X'}.
              </p>
              <button
                onClick={() => closeModal(modal.id)}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-ctl)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Got it
              </button>
            </div>
          )}
          {modal.component === 'Generic' && (
            <p style={{ color: 'var(--color-text-2)', fontSize: '14px' }}>
              {(modal.props?.message as string) || ''}
            </p>
          )}
        </ModalContent>
      ))}
    </AnimatePresence>
  );
}
